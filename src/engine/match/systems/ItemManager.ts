import { Item, LivePlayer, Hero, Role, HeroStats } from '../../../types';
import { getLevelScaledStats, calculateTotalStats } from '../utils/StatUtils';

export const updateLivePlayerStats = (player: LivePlayer, hero: Hero) => {
  const baseStats = getLevelScaledStats(hero.stats, player.level);
  const totalStats = calculateTotalStats({ ...hero, stats: baseStats }, player.items);

  const oldMaxHp = player.maxHp;
  const oldMaxMp = player.maxMp;

  player.maxHp = totalStats.hp;
  player.maxMp = totalStats.mp || 300;

  if (player.maxHp > oldMaxHp) player.currentHp += (player.maxHp - oldMaxHp);
  if (player.maxMp > oldMaxMp) player.currentMp += (player.maxMp - oldMaxMp);

  if (player.currentHp > player.maxHp) player.currentHp = player.maxHp;
  if (player.currentMp > player.maxMp) player.currentMp = player.maxMp;

  (player as any).moveSpeed = totalStats.speed;
  (player as any).hpRegen = totalStats.regen;
  player.mpRegen = totalStats.mpRegen || 5;
};

// sellItem
export const sellItem = (player: LivePlayer, index: number, hero: Hero) => {
  const itemToSell = player.items[index];
  if (!itemToSell) return 0;
  const refundGold = Math.floor(itemToSell.cost * 0.7);
  player.gold += refundGold;
  player.items.splice(index, 1);
  updateLivePlayerStats(player, hero);
  return refundGold;
};

// calculateTotalStats는 StatUtils로 이동했으므로 여기서 제거하고, 필요 시 import해서 씀
// (attemptBuyItem 등 다른 로직은 기존 유지하되 파일 끝부분에 덮어씀)

const ROLE_WEIGHTS: Record<Role, any> = {
  '집행관': { ad: 1.2, hp: 0.8, armor: 0.8, regen: 0.5, pen: 1.0, speed: 0.5, crit: 0.8 },
  '추적자': { ad: 1.5, speed: 1.5, pen: 1.2, crit: 1.0, hp: 0.2 },
  '선지자': { ap: 1.5, mp: 1.2, mpRegen: 1.2, pen: 0.8, hp: 0.3 },
  '신살자': { ad: 1.5, crit: 1.5, speed: 1.0, pen: 1.2, hp: 0.1 },
  '수호기사': { hp: 1.5, armor: 1.5, regen: 1.5, mp: 0.5, speed: 0.3 },
};

const analyzeEnemyThreat = (enemies: LivePlayer[], heroes: Hero[]) => {
  let totalAD = 0, totalAP = 0;
  let maxThreatType: 'AD' | 'AP' | 'BALANCED' = 'BALANCED';
  let highestGold = 0;

  enemies.forEach(e => {
    const h = heroes.find(x => x.id === e.heroId);
    if (!h) return;
    const itemAD = e.items.reduce((s, i) => s + (i.ad || 0), 0);
    const itemAP = e.items.reduce((s, i) => s + (i.ap || 0), 0);
    const currentAD = h.stats.ad + itemAD + (h.stats.ad * e.level * 0.1);
    const currentAP = h.stats.ap + itemAP + (h.stats.ap * e.level * 0.1);
    totalAD += currentAD; totalAP += currentAP;

    if (e.gold > highestGold) {
        highestGold = e.gold;
        if (currentAD > currentAP * 1.5) maxThreatType = 'AD';
        else if (currentAP > currentAD * 1.5) maxThreatType = 'AP';
        else maxThreatType = 'BALANCED';
    }
  });

  if (maxThreatType === 'BALANCED') {
      if (totalAD > totalAP * 1.3) maxThreatType = 'AD';
      if (totalAP > totalAD * 1.3) maxThreatType = 'AP';
  }
  return maxThreatType;
};

export const attemptBuyItem = (
  player: LivePlayer, shopItems: Item[], heroes: Hero[], enemies: LivePlayer[], gameTime: number
) => {
  const hero = heroes.find(h => h.id === player.heroId);
  if (!hero) return;

  const weights = { ...(ROLE_WEIGHTS[hero.role] || { ad: 1, ap: 1, hp: 1 }) };
  const threatType = analyzeEnemyThreat(enemies, heroes);
  
  if (player.stats.brain >= 50) {
      if (threatType === 'AD') { weights.armor = (weights.armor || 0.5) * 2.0; weights.hp = (weights.hp || 0.5) * 1.2; }
      else if (threatType === 'AP') { weights.hp = (weights.hp || 0.5) * 2.0; weights.regen = (weights.regen || 0.5) * 1.5; weights.armor = (weights.armor || 0.5) * 0.5; }
  }

  const kdaRatio = player.deaths === 0 ? player.kills : player.kills / player.deaths;
  if (player.deaths > 3 && kdaRatio < 0.5) { weights.hp = (weights.hp || 0.5) * 1.5; weights.regen = (weights.regen || 0.5) * 1.5; }

  const itemCount = player.items.length;
  const hasBoots = player.items.some(i => i.type === 'BOOTS');
  const existingPowerIdx = player.items.findIndex(i => i.type === 'POWER');
  const hasPower = existingPowerIdx !== -1;

  let minPriceLimit = gameTime < 600 ? 300 : (gameTime < 1200 ? 800 : 1500);
  if (itemCount >= 6) minPriceLimit = 2500;

  const candidates = shopItems.filter(item => {
      if (player.items.some(owned => owned.id === item.id)) return false; 
      if (item.type === 'BOOTS' && hasBoots) return false; 
      if (item.type === 'POWER' && hasPower) { if (item.cost <= player.items[existingPowerIdx].cost) return false; }
      return item.cost <= (player.gold + 200) && item.cost >= minPriceLimit;
    }).map(item => {
      let score = 0;
      score += (item.ad || 0) * (weights.ad || 0.1);
      score += (item.ap || 0) * (weights.ap || 0.1);
      score += (item.hp || 0) * (weights.hp || 0.1) / 10;
      score += (item.mp || 0) * (weights.mp || 0.1) / 10;
      score += (item.armor || 0) * (weights.armor || 0.1);
      score += (item.crit || 0) * (weights.crit || 0.1) * 2;
      score += (item.pen || 0) * (weights.pen || 0.1) * 2;
      score += (item.regen || 0) * (weights.regen || 0.1) * 5;
      score += (item.mpRegen || 0) * (weights.mpRegen || 0.1) * 5;
      score += (item.speed || 0) * (weights.speed || 0.5) * 2; 
      if (hero.role === '선지자' && item.type === 'ARTIFACT') score *= 1.2;
      if (hero.role === '수호기사' && item.type === 'ARMOR') score *= 1.2;
      if (!hasBoots && item.type === 'BOOTS') score += 1000; 
      if (item.type === 'POWER') score *= 5;
      return { item, score };
    });

  if (candidates.length === 0) return;
  candidates.sort((a, b) => b.score - a.score);
  const bestTarget = candidates[0].item;

  if (bestTarget.type === 'POWER' && hasPower) {
      const refund = sellItem(player, existingPowerIdx, hero);
      if ((player.gold) >= bestTarget.cost) { player.gold -= bestTarget.cost; player.items.push(bestTarget); updateLivePlayerStats(player, hero); return; }
  }

  if (itemCount < 6) {
    if (player.gold >= bestTarget.cost) { player.gold -= bestTarget.cost; player.items.push(bestTarget); updateLivePlayerStats(player, hero); }
  } else {
    let cheapestIdx = -1; let minCost = 999999;
    player.items.forEach((item, idx) => { if (item.type !== 'POWER' && item.type !== 'BOOTS' && item.cost < minCost) { minCost = item.cost; cheapestIdx = idx; } });
    if (cheapestIdx !== -1) {
      if (bestTarget.cost > (minCost * 1.5)) {
          const refund = sellItem(player, cheapestIdx, hero); 
          if ((player.gold) >= bestTarget.cost) { player.gold -= bestTarget.cost; player.items.push(bestTarget); updateLivePlayerStats(player, hero); }
      }
    }
  }
};
