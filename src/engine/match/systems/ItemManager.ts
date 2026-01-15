// ==========================================
// FILE PATH: /src/engine/match/systems/ItemManager.ts
// ==========================================
import { Item, LivePlayer, Hero } from '../../../types';
import { getLevelScaledStats, calculateTotalStats } from '../utils/StatUtils';
import { ItemOptimizer } from '../ai/mechanics/ItemOptimizer';

export const updateLivePlayerStats = (player: LivePlayer, hero: Hero) => {
  const baseStats = getLevelScaledStats(hero.stats, player.level);
  const totalStats = calculateTotalStats({ ...hero, stats: baseStats }, player.items);

  const oldMaxHp = player.maxHp;
  const oldMaxMp = player.maxMp;

  // 최대 체력/마나 갱신 (최소값 보장)
  player.maxHp = Math.max(100, totalStats.hp);
  player.maxMp = Math.max(0, totalStats.mp || 300); // 마나 없으면 0 or 300

  // 최대치가 늘어난 만큼 현재 수치도 채워줌 (레벨업/아이템 구매 시)
  if (player.maxHp > oldMaxHp) player.currentHp += (player.maxHp - oldMaxHp);
  if (player.maxMp > oldMaxMp) player.currentMp += (player.maxMp - oldMaxMp);

  // [핵심] 절대 상한선(Max)을 넘지 못하게 자름 (Overflow Fix)
  player.currentHp = Math.min(player.currentHp, player.maxHp);
  player.currentMp = Math.min(player.currentMp, player.maxMp);

  // 기타 스탯 반영
  (player as any).moveSpeed = totalStats.speed;
  (player as any).hpRegen = totalStats.regen;
  player.mpRegen = totalStats.mpRegen || 5;
};

export const sellItem = (player: LivePlayer, index: number, hero: Hero) => {
  const itemToSell = player.items[index];
  if (!itemToSell) return 0;
  const refundGold = Math.floor(itemToSell.cost * 0.7);
  
  player.gold += refundGold;
  player.items.splice(index, 1);
  updateLivePlayerStats(player, hero);
  return refundGold;
};

export const attemptBuyItem = (
  player: LivePlayer, shopItems: Item[], heroes: Hero[], enemies: LivePlayer[], gameTime: number
) => {
  const hero = heroes.find(h => h.id === player.heroId);
  if (!hero) return;

  const weights = ItemOptimizer.getDynamicWeights(player, hero, enemies, heroes);
  const itemCount = player.items.length;
  const hasBoots = player.items.some(i => i.type === 'BOOTS');
  
  let minPriceLimit = 350; 

  const candidates = shopItems.filter(item => {
      if (player.items.some(owned => owned.id === item.id)) return false; 
      if (item.type === 'BOOTS' && hasBoots) return false; 
      return item.cost <= player.gold && item.cost >= minPriceLimit;
  }).map(item => {
      let score = 0;
      score += (item.ad || 0) * weights.ad;
      score += (item.ap || 0) * weights.ap;
      score += (item.hp || 0) * weights.hp / 10;
      score += (item.armor || 0) * weights.armor;
      score += (item.speed || 0) * weights.speed * 5;
      if (item.type === 'POWER') score *= 3;
      return { item, score };
  });

  if (candidates.length === 0) return;
  
  candidates.sort((a, b) => b.score - a.score);
  const bestTarget = candidates[0].item;

  if (itemCount < 6) {
    if (player.gold >= bestTarget.cost) { 
        player.gold -= bestTarget.cost; 
        player.items.push(bestTarget); 
        updateLivePlayerStats(player, hero); 
    }
  }
};
