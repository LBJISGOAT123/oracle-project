// ==========================================
// FILE PATH: /src/engine/match/systems/ItemManager.ts
// ==========================================

import { Item, LivePlayer, Hero, Role, HeroStats } from '../../../types';
import { getLevelScaledStats } from './PowerCalculator'; 

/**
 * [핵심 기능] 플레이어의 현재 스탯을 재계산하고 즉시 적용합니다.
 * - 아이템 구매/판매 직후
 * - 레벨업 직후
 * - 게임 시작 시
 * 위 타이밍에 반드시 호출되어야 합니다.
 */
export const updateLivePlayerStats = (player: LivePlayer, hero: Hero) => {
  // 1. 레벨 기반 기본 스탯 계산 (성장치 반영)
  const baseStats = getLevelScaledStats(hero.stats, player.level);
  
  // 2. 아이템 스탯 합산 (기본스탯 + 아이템스탯)
  const totalStats = calculateTotalStats({ ...hero, stats: baseStats }, player.items);

  // 3. 체력/마나 비율 보정 (최대치가 늘어났을 때 현재 수치도 비율 혹은 차이만큼 보정)
  const oldMaxHp = player.maxHp;
  const oldMaxMp = player.maxMp;

  // 최대 수치 갱신
  player.maxHp = totalStats.hp;
  player.maxMp = totalStats.mp || 300; // 마나 없는 영웅 최소 보장

  // 늘어난 통만큼 현재 체력/마나 회복 (워모그 샀는데 피 그대로면 안되니까)
  if (player.maxHp > oldMaxHp) {
      player.currentHp += (player.maxHp - oldMaxHp);
  }
  if (player.maxMp > oldMaxMp) {
      player.currentMp += (player.maxMp - oldMaxMp);
  }

  // 상한선 체크
  if (player.currentHp > player.maxHp) player.currentHp = player.maxHp;
  if (player.currentMp > player.maxMp) player.currentMp = player.maxMp;

  // 4. [중요] 실시간 변동 스탯 캐싱 (PlayerSystem 등에서 사용)
  // (LivePlayer 타입에 필드가 없어도 런타임에서 동작하도록 any 캐스팅 활용)
  (player as any).moveSpeed = totalStats.speed;
  (player as any).hpRegen = totalStats.regen;
  player.mpRegen = totalStats.mpRegen || 5;
};

/**
 * 영웅의 기본 스탯에 아이템 스탯을 모두 더하여 반환합니다.
 */
export const calculateTotalStats = (hero: Hero, items: Item[]): HeroStats => {
  let stats = { ...hero.stats }; // 복사본 생성
  
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
    // baseAtk(기본공격력)은 아이템으로 오르지 않음
  });
  
  return stats;
};

/**
 * 아이템 판매 로직
 */
export const sellItem = (player: LivePlayer, index: number, hero: Hero) => {
  const itemToSell = player.items[index];
  if (!itemToSell) return 0;

  const refundGold = Math.floor(itemToSell.cost * 0.7); // 판매시 70% 환급
  player.gold += refundGold;
  player.items.splice(index, 1);

  // [중요] 판매 후 스탯 재계산 (이속 감소 등 반영)
  updateLivePlayerStats(player, hero);

  return refundGold;
};

// 역할군별 아이템 선호도 가중치
const ROLE_WEIGHTS: Record<Role, any> = {
  '집행관': { ad: 1.2, hp: 0.8, armor: 0.8, regen: 0.5, pen: 1.0, speed: 0.5, crit: 0.8 },
  '추적자': { ad: 1.5, speed: 1.5, pen: 1.2, crit: 1.0, hp: 0.2 }, // 정글러 이속 중요
  '선지자': { ap: 1.5, mp: 1.2, mpRegen: 1.2, pen: 0.8, hp: 0.3 },
  '신살자': { ad: 1.5, crit: 1.5, speed: 1.0, pen: 1.2, hp: 0.1 },
  '수호기사': { hp: 1.5, armor: 1.5, regen: 1.5, mp: 0.5, speed: 0.3 },
};

/**
 * AI 아이템 구매 로직 (스마트 버전)
 */
export const attemptBuyItem = (
  player: LivePlayer, 
  shopItems: Item[], 
  heroes: Hero[], 
  enemies: LivePlayer[], 
  gameTime: number
) => {
  const hero = heroes.find(h => h.id === player.heroId);
  if (!hero) return;

  const role = hero.role;
  const weights = { ...(ROLE_WEIGHTS[role] || { ad: 1, ap: 1, hp: 1 }) };
  const itemCount = player.items.length;

  // -------------------------------------------------------
  // [전략 1] 적 팀 분석 및 카운터 가중치 적용
  // -------------------------------------------------------
  let enemyAD = 0;
  let enemyAP = 0;
  let enemyArmor = 0;

  const threats = enemies.sort((a, b) => b.gold - a.gold).slice(0, 3);
  threats.forEach(e => {
    const eHero = heroes.find(h => h.id === e.heroId);
    if (eHero) {
      enemyAD += eHero.stats.ad; 
      enemyAP += eHero.stats.ap;
      enemyArmor += eHero.stats.armor;
    }
  });

  if (enemyAD > enemyAP * 1.5) {
    weights.armor = (weights.armor || 0.5) * 1.5;
    weights.hp = (weights.hp || 0.5) * 1.2;
  }
  if (enemyArmor > 150) {
    weights.pen = (weights.pen || 0.5) * 2.0;
  }

  // -------------------------------------------------------
  // [전략 2] 생존 본능 (KDA 낮을 때 방어템 선호)
  // -------------------------------------------------------
  const kdaRatio = player.deaths === 0 ? player.kills : player.kills / player.deaths;
  if (player.deaths > 3 && kdaRatio < 0.5) {
    weights.hp = (weights.hp || 0.5) * 1.5;
    weights.regen = (weights.regen || 0.5) * 1.5;
  }

  // -------------------------------------------------------
  // [전략 3] 아이템 필터링 및 점수 산정
  // -------------------------------------------------------
  const hasBoots = player.items.some(i => i.type === 'BOOTS');
  const existingPowerIdx = player.items.findIndex(i => i.type === 'POWER');
  const hasPower = existingPowerIdx !== -1;

  let minPriceLimit = gameTime < 600 ? 300 : (gameTime < 1200 ? 800 : 2000);
  if (itemCount >= 6) minPriceLimit = 2500;

  const candidates = shopItems
    .filter(item => {
      if (player.items.some(owned => owned.id === item.id)) return false; 
      if (item.type === 'BOOTS' && hasBoots) return false; 
      if (item.type === 'POWER' && hasPower) { 
         if (item.cost <= player.items[existingPowerIdx].cost) return false; 
      }
      return item.cost <= (player.gold + 500) && item.cost >= minPriceLimit;
    })
    .map(item => {
      let score = 0;
      // 모든 스탯 가중치 반영
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

      if (role === '선지자' && item.type === 'ARTIFACT') score *= 1.2;
      if (role === '수호기사' && item.type === 'ARMOR') score *= 1.2;
      if (!hasBoots && item.type === 'BOOTS') score += 2000; // 신발 최우선

      if (item.type === 'POWER') score *= 10;

      return { item, score };
    });

  if (candidates.length === 0) return;

  candidates.sort((a, b) => b.score - a.score);
  const bestTarget = candidates[0].item;

  // -------------------------------------------------------
  // [구매 실행 및 스탯 갱신]
  // -------------------------------------------------------
  
  // A. 권능 교체
  if (bestTarget.type === 'POWER' && hasPower) {
      const refund = sellItem(player, existingPowerIdx, hero);
      if ((player.gold) >= bestTarget.cost) {
          player.gold -= bestTarget.cost;
          player.items.push(bestTarget);
          updateLivePlayerStats(player, hero); // 구매 후 즉시 반영
          return;
      }
  }

  // B. 일반 구매
  if (itemCount < 6) {
    if (player.gold >= bestTarget.cost) {
      player.gold -= bestTarget.cost;
      player.items.push(bestTarget);
      updateLivePlayerStats(player, hero); // 구매 후 즉시 반영
    }
  } 
  // C. 풀템 시 교체 (더 좋은 템으로)
  else {
    let cheapestIdx = -1;
    let minCost = 999999;
    player.items.forEach((item, idx) => {
      if (item.type !== 'POWER' && item.type !== 'BOOTS' && item.cost < minCost) {
        minCost = item.cost;
        cheapestIdx = idx;
      }
    });

    if (cheapestIdx !== -1) {
      const itemToSell = player.items[cheapestIdx];
      const refund = sellItem(player, cheapestIdx, hero); // 판매 (스탯 감소됨)
      if ((player.gold) >= bestTarget.cost && bestTarget.cost > (minCost * 1.5)) {
        player.gold -= bestTarget.cost;
        player.items.push(bestTarget);
        updateLivePlayerStats(player, hero); // 구매 (스탯 증가됨)
      }
    }
  }
};