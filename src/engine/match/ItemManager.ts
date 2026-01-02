// ==========================================
// FILE PATH: /src/engine/match/ItemManager.ts
// ==========================================

import { Item, LivePlayer, Hero, Role } from '../../types';

// [1] 아이템 판매 로직
export const sellItem = (player: LivePlayer, index: number) => {
  const itemToSell = player.items[index];
  if (!itemToSell) return 0;

  const refundGold = Math.floor(itemToSell.cost * 0.8);
  player.gold += refundGold;
  player.items.splice(index, 1);

  return refundGold;
};

// [2] 직업별 기본 스탯 가중치 (Base Preference)
const ROLE_WEIGHTS: Record<Role, any> = {
  '집행관': { ad: 1.2, hp: 0.8, armor: 0.8, regen: 0.5, pen: 1.0, speed: 0.5, crit: 0.8 },
  '추적자': { ad: 1.5, speed: 1.2, pen: 1.2, crit: 1.0, hp: 0.2 },
  '선지자': { ap: 1.5, mp: 1.2, mpRegen: 1.2, pen: 0.8, hp: 0.3 },
  '신살자': { ad: 1.5, crit: 1.5, speed: 1.0, pen: 1.2, hp: 0.1 },
  '수호기사': { hp: 1.5, armor: 1.5, regen: 1.5, mp: 0.5, speed: 0.3 },
};

// [3] AI 아이템 구매 로직 (스마트 버전)
export const attemptBuyItem = (
  player: LivePlayer, 
  shopItems: Item[], 
  heroes: Hero[], 
  enemies: LivePlayer[], // [추가] 적 팀 정보 분석용
  gameTime: number       // [추가] 게임 시간 (초)
) => {
  const hero = heroes.find(h => h.id === player.heroId);
  if (!hero) return;

  const role = hero.role;
  // 가중치 복사 (원본 수정 방지)
  const weights = { ...(ROLE_WEIGHTS[role] || { ad: 1, ap: 1, hp: 1 }) };
  const itemCount = player.items.length;

  // -------------------------------------------------------
  // [전략 1] 적 팀 분석 및 카운터 가중치 적용
  // -------------------------------------------------------
  let enemyAD = 0;
  let enemyAP = 0;
  let enemyArmor = 0;

  // 잘 큰 적(골드 상위권) 위주로 위협 분석
  const threats = enemies.sort((a, b) => b.gold - a.gold).slice(0, 3);
  threats.forEach(e => {
    const eHero = heroes.find(h => h.id === e.heroId);
    if (eHero) {
      // 적의 스탯 추정 (기본 + 아이템)
      enemyAD += eHero.stats.ad; // 단순화: 아이템 합산은 생략하고 영웅 특성만 봄
      enemyAP += eHero.stats.ap;
      enemyArmor += eHero.stats.armor;
    }
  });

  // A. 적이 물리 공격 위주라면 -> 방어력 가중치 증가
  if (enemyAD > enemyAP * 1.5) {
    weights.armor = (weights.armor || 0.5) * 1.5;
    weights.hp = (weights.hp || 0.5) * 1.2;
  }

  // B. 적이 방어력을 많이 올렸다면 -> 관통력 가중치 대폭 증가
  if (enemyArmor > 150) {
    weights.pen = (weights.pen || 0.5) * 2.0;
  }

  // -------------------------------------------------------
  // [전략 2] 생존 본능 (많이 죽었을 때)
  // -------------------------------------------------------
  const kdaRatio = player.deaths === 0 ? player.kills : player.kills / player.deaths;
  if (player.deaths > 3 && kdaRatio < 0.5) {
    // 너무 많이 죽고 있으면 생존템 선호
    weights.hp = (weights.hp || 0.5) * 1.5;
    weights.regen = (weights.regen || 0.5) * 1.5;
  }

  // -------------------------------------------------------
  // [전략 3] 게임 흐름에 따른 구매 제한 (Scaling)
  // -------------------------------------------------------
  let minPriceLimit = 0;

  if (gameTime < 600) { 
    // 초반 (10분 미만): 가성비 좋은 하위템도 OK
    minPriceLimit = 300; 
  } else if (gameTime < 1200) {
    // 중반 (20분 미만): 너무 싼 건 안 삼
    minPriceLimit = 800;
  } else {
    // 후반 (20분 이후): 코어 아이템만 취급
    minPriceLimit = 2000;
  }

  // 인벤토리가 꽉 찼으면 더 비싼 것만 봄
  if (itemCount >= 6) minPriceLimit = 2500;


  // -------------------------------------------------------
  // [전략 4] 아이템 점수 산정 및 필터링
  // -------------------------------------------------------
  const hasBoots = player.items.some(i => i.type === 'BOOTS');
  const existingPowerIdx = player.items.findIndex(i => i.type === 'POWER');
  const hasPower = existingPowerIdx !== -1;

  const candidates = shopItems
    .filter(item => {
      // 1. 중복 소유 방지
      if (player.items.some(owned => owned.id === item.id)) return false;
      // 2. 신발 중복 방지
      if (item.type === 'BOOTS' && hasBoots) return false;
      // 3. 권능 업그레이드 조건 (더 싼건 안 봄)
      if (item.type === 'POWER' && hasPower) {
         if (item.cost <= player.items[existingPowerIdx].cost) return false; 
      }
      // 4. 가격 필터 (현재 골드 + 템 판돈 800G 가정)
      const affordable = item.cost <= (player.gold + 1200); 
      return affordable && item.cost >= minPriceLimit;
    })
    .map(item => {
      let score = 0;

      // 스탯 점수 (동적으로 조정된 가중치 적용)
      score += (item.ad || 0) * (weights.ad || 0.1);
      score += (item.ap || 0) * (weights.ap || 0.1);
      score += (item.hp || 0) * (weights.hp || 0.1) / 10;
      score += (item.mp || 0) * (weights.mp || 0.1) / 10;
      score += (item.armor || 0) * (weights.armor || 0.1);
      score += (item.crit || 0) * (weights.crit || 0.1) * 2;
      score += (item.pen || 0) * (weights.pen || 0.1) * 2;
      score += (item.regen || 0) * (weights.regen || 0.1) * 5;
      score += (item.mpRegen || 0) * (weights.mpRegen || 0.1) * 5;
      score += (item.speed || 0) * (weights.speed || 0.5);

      // 타입별 특수 보너스
      if (role === '선지자' && item.type === 'ARTIFACT') score *= 1.2;
      if (role === '수호기사' && item.type === 'ARMOR') score *= 1.2;
      if (!hasBoots && item.type === 'BOOTS') score += 1000; // 신발 최우선

      // 권능은 무조건 높은 점수 (졸업템)
      if (item.type === 'POWER') score *= 10;

      return { item, score };
    });

  if (candidates.length === 0) return;

  // 점수순 정렬
  candidates.sort((a, b) => b.score - a.score);
  const bestTarget = candidates[0].item;

  // -------------------------------------------------------
  // [구매 실행]
  // -------------------------------------------------------

  // A. 권능 업그레이드 (교체)
  if (bestTarget.type === 'POWER' && hasPower) {
      const powerItem = player.items[existingPowerIdx];
      const refund = Math.floor(powerItem.cost * 0.8);
      if ((player.gold + refund) >= bestTarget.cost) {
          sellItem(player, existingPowerIdx);
          player.gold -= bestTarget.cost;
          player.items.push(bestTarget);
          return;
      }
  }

  // B. 일반 구매 (빈 자리)
  if (itemCount < 6) {
    if (player.gold >= bestTarget.cost) {
      player.gold -= bestTarget.cost;
      player.items.push(bestTarget);
    }
  } 
  // C. 교체 구매 (풀템일 때)
  else {
    let cheapestIdx = -1;
    let minCost = 999999;

    // 절대 팔면 안 되는 것들: 신발, 권능
    player.items.forEach((item, idx) => {
      if (item.type !== 'POWER' && item.type !== 'BOOTS' && item.cost < minCost) {
        minCost = item.cost;
        cheapestIdx = idx;
      }
    });

    if (cheapestIdx !== -1) {
      const itemToSell = player.items[cheapestIdx];
      const refund = Math.floor(itemToSell.cost * 0.8);

      // 교체 조건: 돈이 되고, 스펙업이 확실할 때 (가격 1.5배 이상 차이)
      if ((player.gold + refund) >= bestTarget.cost && bestTarget.cost > itemToSell.cost * 1.5) {
        sellItem(player, cheapestIdx);
        player.gold -= bestTarget.cost;
        player.items.push(bestTarget);
      }
    }
  }
};

// [4] 통합 스탯 계산기 (변경 없음)
export const calculateTotalStats = (hero: Hero, items: Item[]) => {
  let stats = { ...hero.stats }; 
  items.forEach(item => {
    stats.ad += (item.ad || 0);
    stats.ap += (item.ap || 0);
    stats.hp += (item.hp || 0);
    stats.mp += (item.mp || 0);
    stats.armor += (item.armor || 0);
    stats.crit += (item.crit || 0);
    stats.speed += (item.speed || 0);
    stats.regen += (item.regen || 0);
    stats.mpRegen += (item.mpRegen || 0);
    stats.pen += (item.pen || 0);
  });
  return stats;
};