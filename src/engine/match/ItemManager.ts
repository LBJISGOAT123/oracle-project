// ==========================================
// FILE PATH: /src/engine/match/ItemManager.ts
// ==========================================

import { Item, LivePlayer, Hero } from '../../types';

// [1] 스마트 아이템 구매 로직 (저축 및 교체 개념 도입)
export const attemptBuyItem = (player: LivePlayer, shopItems: Item[], heroes: Hero[]) => {
  // 플레이어 영웅 정보
  const hero = heroes.find(h => h.id === player.heroId);
  if (!hero) return;

  // 영웅 성향 파악 (AD vs AP)
  const isAdChamp = hero.stats.ad > hero.stats.ap || hero.skills.q.adRatio > hero.skills.q.apRatio;

  // 현재 인벤토리 상태
  const itemCount = player.items.length;

  // -------------------------------------------------------
  // [전략 1] 구매 제한 (Tier Check)
  // 인벤토리가 찰수록 더 비싼 아이템만 보게 하여 '저축'을 유도함
  // -------------------------------------------------------
  let minPriceLimit = 0;

  if (itemCount < 2) {
    minPriceLimit = 0; // 초반: 아무거나 삼 (단검, 도란링 등)
  } else if (itemCount < 4) {
    minPriceLimit = 600; // 중반 초입: 최소 600G 이상 아이템만 (하위템 난사 방지)
  } else if (itemCount < 6) {
    minPriceLimit = 1100; // 중반: 1100G 이상 중상위템만 노림
  } else {
    minPriceLimit = 2500; // 후반(풀템): 코어템(2500G+) 아니면 거들떠도 안 봄
  }

  // -------------------------------------------------------
  // [전략 2] 살 수 있는 아이템 필터링 및 점수 매기기
  // -------------------------------------------------------
  const purchasable = shopItems.filter(i => i.cost <= player.gold && i.cost >= minPriceLimit);

  if (purchasable.length === 0) return;

  // 우선순위 정렬 (비싼거 + 내 직업에 맞는거)
  purchasable.sort((a, b) => {
    let scoreA = a.cost;
    let scoreB = b.cost;

    // 성향 보정 (AD챔은 AD템, AP챔은 AP템 선호)
    if (isAdChamp && a.ad > 0) scoreA *= 1.5;
    if (!isAdChamp && a.ap > 0) scoreA *= 1.5;
    if (isAdChamp && b.ad > 0) scoreB *= 1.5;
    if (!isAdChamp && b.ap > 0) scoreB *= 1.5;

    // 권능 아이템은 최우선 (돈만 있다면)
    if (a.type === 'POWER') scoreA *= 5;
    if (b.type === 'POWER') scoreB *= 5;

    return scoreB - scoreA; // 점수 높은 순
  });

  const bestTargetItem = purchasable[0];

  // -------------------------------------------------------
  // [전략 3] 구매 및 교체 (Replacement)
  // -------------------------------------------------------

  // A. 인벤토리가 비어있으면 그냥 구매
  if (itemCount < 6) {
    player.gold -= bestTargetItem.cost;
    player.items.push(bestTargetItem);
  } 
  // B. 인벤토리가 꽉 찼으면 '가장 싼 템'을 팔고 교체 (업그레이드)
  else {
    // 내 인벤토리에서 가장 싼 아이템 찾기
    // (단, '권능' 아이템은 절대 팔지 않음)
    const sortedInventory = [...player.items].sort((a, b) => a.cost - b.cost);
    const cheapestItem = sortedInventory.find(i => i.type !== 'POWER');

    if (cheapestItem) {
      // 교체 조건: 새로 살 아이템이 버릴 아이템보다 훨씬 비싸야 함 (최소 2배 이상 가치 or 코어템)
      // 예: 도란검(450G) 버리고 무한의대검(3400G) 사기 -> OK
      // 예: 도란검(450G) 버리고 롱소드(350G) 사기 -> NO
      if (bestTargetItem.cost > cheapestItem.cost * 1.5) {
        // 판매 (반값 환불)
        player.gold += Math.floor(cheapestItem.cost * 0.5);
        // 인벤토리에서 제거
        player.items = player.items.filter(i => i !== cheapestItem);

        // 새 아이템 구매
        player.gold -= bestTargetItem.cost;
        player.items.push(bestTargetItem);
      }
    }
  }
};

// [2] 전투력 계산 (아이템 스탯 합산) - 기존 유지
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