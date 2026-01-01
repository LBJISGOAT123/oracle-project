// ==========================================
// FILE PATH: /src/engine/match/ItemManager.ts
// ==========================================

import { Item, LivePlayer, Hero } from '../../types';

// [신규 기능] 아이템 판매 로직 (외부에서도 호출 가능하도록 export)
// 인벤토리에서 특정 인덱스의 아이템을 제거하고 골드를 환불함 (70% 가격)
export const sellItem = (player: LivePlayer, index: number) => {
  const itemToSell = player.items[index];
  if (!itemToSell) return 0;

  // 판매 가격: 구매가의 70% (소수점 버림)
  const refundGold = Math.floor(itemToSell.cost * 0.7);

  player.gold += refundGold;
  player.items.splice(index, 1); // 인벤토리에서 삭제

  return refundGold;
};

// [업데이트] 스마트 아이템 구매 AI (중복 방지 포함)
export const attemptBuyItem = (player: LivePlayer, shopItems: Item[], heroes: Hero[]) => {
  const hero = heroes.find(h => h.id === player.heroId);
  if (!hero) return;

  const isAdChamp = hero.stats.ad > hero.stats.ap || hero.skills.q.adRatio > hero.skills.q.apRatio;
  const itemCount = player.items.length;

  // 1. 구매 제한 (초반엔 싼거, 후반엔 비싼거)
  let minPriceLimit = 0;
  if (itemCount < 2) minPriceLimit = 0;
  else if (itemCount < 4) minPriceLimit = 600;
  else if (itemCount < 6) minPriceLimit = 1100;
  else minPriceLimit = 2000; // 풀템일 때는 진짜 좋은거 아니면 안 봄

  // 2. 구매 가능한 아이템 필터링 및 점수 산정
  // [핵심 수정] 여기서 '이미 가진 아이템'은 후보에서 제외 (중복 방지)
  const candidates = shopItems.filter(item => {
    // A. 이미 가지고 있는지 체크 (Unique Logic: 중복 구매 방지)
    const hasItem = player.items.some(ownedItem => ownedItem.id === item.id);
    if (hasItem) return false;

    // B. 가격 필터 (현재 골드로 살 수 있거나, 템 하나 팔아서 살 수 있는 범위)
    // 템을 팔았을 때(약 500~1000G 확보 가정) 살 수 있는 가능성까지 고려
    const affordable = item.cost <= (player.gold + 1000); 

    return affordable && item.cost >= minPriceLimit;
  });

  if (candidates.length === 0) return;

  // 우선순위 정렬 (비싼거 + 내 직업에 맞는거)
  candidates.sort((a, b) => {
    let scoreA = a.cost;
    let scoreB = b.cost;

    // 성향 보정 (AD챔은 AD템, AP챔은 AP템 선호)
    if (isAdChamp && a.ad > 0) scoreA *= 1.5;
    if (!isAdChamp && a.ap > 0) scoreA *= 1.5;
    if (isAdChamp && b.ad > 0) scoreB *= 1.5;
    if (!isAdChamp && b.ap > 0) scoreB *= 1.5;

    // 권능(POWER) 아이템은 최우선 순위
    if (a.type === 'POWER') scoreA *= 10;
    if (b.type === 'POWER') scoreB *= 10;

    return scoreB - scoreA;
  });

  const bestTargetItem = candidates[0];

  // -------------------------------------------------------
  // [전략 3] 구매 및 교체 (Replacement)
  // -------------------------------------------------------

  // Case A: 인벤토리에 빈 자리가 있고, 돈이 충분할 때 -> 그냥 구매
  if (itemCount < 6) {
    if (player.gold >= bestTargetItem.cost) {
      player.gold -= bestTargetItem.cost;
      player.items.push(bestTargetItem);
    }
  } 
  // Case B: 인벤토리가 꽉 찼거나 돈이 모자랄 때 -> 하위템 판매 후 교체 고려
  else {
    // 내 아이템 중 가장 싼 것(판매 대상) 찾기
    // 단, 권능(POWER) 아이템은 절대 팔지 않음
    let cheapestIdx = -1;
    let minCost = 999999;

    player.items.forEach((item, idx) => {
      if (item.type !== 'POWER' && item.cost < minCost) {
        minCost = item.cost;
        cheapestIdx = idx;
      }
    });

    if (cheapestIdx !== -1) {
      const itemToSell = player.items[cheapestIdx];
      const refund = Math.floor(itemToSell.cost * 0.7);

      // [핵심] 교체 조건:
      // 1. (현재 골드 + 판 돈)으로 새 아이템을 살 수 있어야 함
      // 2. 새 아이템이 팔려는 아이템보다 훨씬 좋아야 함 (가격 1.5배 이상)
      if ((player.gold + refund) >= bestTargetItem.cost && bestTargetItem.cost > itemToSell.cost * 1.5) {
        // 판매 실행 (모듈화된 함수 사용)
        sellItem(player, cheapestIdx);

        // 구매 실행
        player.gold -= bestTargetItem.cost;
        player.items.push(bestTargetItem);
      }
    }
  }
};

// [기존 유지] 스탯 계산 로직
export const calculateTotalStats = (hero: Hero, items: Item[]) => {
  let stats = { ...hero.stats }; 
  items.forEach(item => {
    stats.ad += item.ad;
    stats.ap += item.ap;
    stats.hp += item.hp;
    stats.armor += item.armor;
    stats.crit += item.crit;
    stats.speed += item.speed;
  });
  return stats;
};