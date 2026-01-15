// ==========================================
// FILE PATH: /src/engine/match/systems/ItemManager.ts
// ==========================================
import { Item, LivePlayer, Hero, Role } from '../../../types';
import { getLevelScaledStats, calculateTotalStats } from '../utils/StatUtils';
import { ItemOptimizer } from '../ai/mechanics/ItemOptimizer'; // [신규 모듈]

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

  // [고도화] ItemOptimizer를 통해 현재 전황에 맞는 가중치를 받아옴
  const weights = ItemOptimizer.getDynamicWeights(player, hero, enemies, heroes);

  const itemCount = player.items.length;
  const hasBoots = player.items.some(i => i.type === 'BOOTS');
  const existingPowerIdx = player.items.findIndex(i => i.type === 'POWER');
  const hasPower = existingPowerIdx !== -1;

  // 최소 가격 제한 (인벤토리 낭비 방지)
  let minPriceLimit = 300;
  if (itemCount >= 4) minPriceLimit = 1000; 

  // 구매 후보 점수 계산
  const candidates = shopItems.filter(item => {
      if (player.items.some(owned => owned.id === item.id)) return false; // 중복 방지
      if (item.type === 'BOOTS' && hasBoots) return false; // 신발 중복 방지
      
      // 권능 업그레이드 조건
      if (item.type === 'POWER' && hasPower) { 
          if (item.cost <= player.items[existingPowerIdx].cost) return false; 
      }
      
      // 구매 가능 여부 확인
      return item.cost <= (player.gold) && item.cost >= minPriceLimit;
    }).map(item => {
      let score = 0;
      // 동적 가중치 적용
      score += (item.ad || 0) * weights.ad;
      score += (item.ap || 0) * weights.ap;
      score += (item.hp || 0) * weights.hp / 10;
      score += (item.mp || 0) * weights.mp / 10;
      score += (item.armor || 0) * weights.armor;
      score += (item.crit || 0) * weights.crit * 2;
      score += (item.pen || 0) * weights.pen * 2;
      score += (item.regen || 0) * weights.regen * 5;
      score += (item.mpRegen || 0) * weights.mpRegen * 5;
      score += (item.speed || 0) * weights.speed * 2; 
      
      // 특수 보정
      if (hero.role === '선지자' && item.type === 'ARTIFACT') score *= 1.2;
      if (hero.role === '수호기사' && item.type === 'ARMOR') score *= 1.2;
      
      // 신발 우선순위 (이속이 중요하면 점수 대폭 상향)
      if (!hasBoots && item.type === 'BOOTS') score += 500 * weights.speed; 
      
      // 권능(Power) 아이템은 무조건 좋음
      if (item.type === 'POWER') score *= 5;
      
      return { item, score };
    });

  if (candidates.length === 0) return;
  
  // 점수 높은 순 정렬
  candidates.sort((a, b) => b.score - a.score);
  const bestTarget = candidates[0].item;

  // 권능 업그레이드 구매
  if (bestTarget.type === 'POWER' && hasPower) {
      const refund = sellItem(player, existingPowerIdx, hero);
      if ((player.gold) >= bestTarget.cost) { 
          player.gold -= bestTarget.cost; 
          player.items.push(bestTarget); 
          updateLivePlayerStats(player, hero); 
          return; 
      }
  }

  // 일반 구매
  if (itemCount < 6) {
    // 빈 슬롯 있으면 구매
    if (player.gold >= bestTarget.cost) { 
        player.gold -= bestTarget.cost; 
        player.items.push(bestTarget); 
        updateLivePlayerStats(player, hero); 
    }
  } else {
    // 풀템이면: 가장 싼 아이템(가치 낮은 템)을 팔고 더 좋은 걸 살 수 있는지 확인
    let cheapestIdx = -1; let minCost = 999999;
    
    player.items.forEach((item, idx) => { 
        // 권능과 신발은 웬만하면 안 팜
        if (item.type !== 'POWER' && item.type !== 'BOOTS' && item.cost < minCost) { 
            minCost = item.cost; cheapestIdx = idx; 
        } 
    });
    
    if (cheapestIdx !== -1) {
      // 교체하려는 템이 기존 템보다 1.5배 이상 비쌀 때만 교체 (업그레이드 의미)
      if (bestTarget.cost > (minCost * 1.5)) {
          const refund = sellItem(player, cheapestIdx, hero); 
          if ((player.gold) >= bestTarget.cost) { 
              player.gold -= bestTarget.cost; 
              player.items.push(bestTarget); 
              updateLivePlayerStats(player, hero); 
          }
      }
    }
  }
};
