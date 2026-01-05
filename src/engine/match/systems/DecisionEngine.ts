// ==========================================
// FILE PATH: /src/engine/match/systems/DecisionEngine.ts
// ==========================================
import { LivePlayer, LiveMatch, Hero } from '../../../types';
import { getDistance, BASES, POI } from '../../data/MapData';
import { calculateTotalStats } from './ItemManager';
import { getLevelScaledStats } from './PowerCalculator';

export type ActionType = 'FARM' | 'TRADE' | 'GANK' | 'OBJECTIVE' | 'RECALL' | 'FLEE';

export interface Decision {
  action: ActionType;
  targetPos: { x: number, y: number };
  targetUnit?: LivePlayer;
  reason: string;
}

// 전투력 계산 (내부 헬퍼)
const getRealCombatPower = (p: LivePlayer, h: Hero) => {
  const scaledStats = getLevelScaledStats(h.stats, p.level);
  const totalStats = calculateTotalStats({ ...h, stats: scaledStats }, p.items);
  const statPower = (totalStats.ad + totalStats.ap) * 2 + (totalStats.hp / 10) + totalStats.armor;
  const hpRate = p.currentHp / p.maxHp;
  return statPower * hpRate + (p.level * 50);
};

// 인지된 전투력 (IQ 반영)
const getPerceivedPower = (observer: LivePlayer, target: LivePlayer, targetHero: Hero) => {
  const realPower = getRealCombatPower(target, targetHero);
  const myIQ = observer.stats.brain || 50; 
  const errorMargin = ((100 - myIQ) / 100) * 0.4;
  const error = 1 + (Math.random() * errorMargin * 2 - errorMargin);
  return realPower * error;
};

export const makeDecision = (
  player: LivePlayer, 
  match: LiveMatch, 
  heroes: Hero[]
): Decision => {
  const hero = heroes.find(h => h.id === player.heroId);
  if (!hero) return { action: 'FARM', targetPos: {x:player.x, y:player.y}, reason: 'Err' };

  const isBlue = match.blueTeam.includes(player);
  const enemies = isBlue ? match.redTeam : match.blueTeam;
  const allies = isBlue ? match.blueTeam : match.redTeam;
  const myBase = isBlue ? BASES.BLUE : BASES.RED;
  const enemyBase = isBlue ? BASES.RED : BASES.BLUE;

  const myIQ = player.stats.brain || 50;
  const myMech = player.stats.mechanics || 50;

  // 1. [위기 감지] 딸피면 생존 귀환
  let dangerThreshold = 0.2; 
  if (myIQ < 40) dangerThreshold = 0.1;

  if (player.currentHp < player.maxHp * dangerThreshold) {
    const nearbyLowHpEnemy = enemies.some(e => 
      getDistance(player, e) < 10 && (e.currentHp < e.maxHp * 0.15)
    );
    // IQ가 낮으면 죽기살기로 덤빔 (귀환 안 함)
    if (nearbyLowHpEnemy && Math.random() > (myIQ / 100)) {
       // Pass
    } else {
       return { action: 'RECALL', targetPos: myBase, reason: '생존 귀환' };
    }
  }

  // ---------------------------------------------------
  // [수정] 2. [전략 판단] 라인 상대가 죽었는가? -> 프리 푸시(PUSH)
  // ---------------------------------------------------
  if (player.lane !== 'JUNGLE') {
      const laneOpponent = enemies.find(e => e.lane === player.lane);
      // 상대가 죽었거나(respawnTimer > 0), 다른 라인에 가있음 (거리가 40 이상 차이남)
      if (laneOpponent && (laneOpponent.respawnTimer > 0 || getDistance(player, laneOpponent) > 40)) {
          // 적이 없으면 무조건 적 본진 방향으로 진격 (공성 유도)
          return { action: 'OBJECTIVE', targetPos: enemyBase, reason: '프리 푸시' };
      }
  }

  // ---------------------------------------------------
  // 3. [전투 판단] 싸울까 말까? (Fight or Flight)
  // ---------------------------------------------------
  let target: LivePlayer | null = null;
  let bestScore = -9999;

  for (const e of enemies) {
    if (e.currentHp > 0 && e.respawnTimer <= 0) {
      const dist = getDistance(player, e);
      if (dist < 18) { 
        const enemyHero = heroes.find(h => h.id === e.heroId);
        if (!enemyHero) continue;

        const myPerceivedPower = getPerceivedPower(player, player, hero);
        const enemyPerceivedPower = getPerceivedPower(player, e, enemyHero);

        // 점수: (내 힘 - 적 힘) - 거리패널티
        let score = (myPerceivedPower - enemyPerceivedPower) - (dist * 5);
        if (hero.role === '추적자' && (enemyHero.role === '신살자' || enemyHero.role === '선지자')) score += 500;

        if (score > bestScore) {
          bestScore = score;
          target = e;
        }
      }
    }
  }

  if (target) {
    const enemyHero = heroes.find(h => h.id === target.heroId)!;
    const myPower = getPerceivedPower(player, player, hero);
    const enemyPower = getPerceivedPower(player, target, enemyHero);

    // 너무 불리하면 도망
    if (enemyPower > myPower * 1.2) {
        const escapeChance = 0.5 + (myMech / 200); 
        if (Math.random() < escapeChance) {
            return { action: 'FLEE', targetPos: myBase, reason: '불리함 도주' };
        } else {
            return { action: 'TRADE', targetPos: {x: target.x, y: target.y}, targetUnit: target, reason: '도주 실패(물림)' };
        }
    }

    // 할만하면 싸움
    if (myPower >= enemyPower * 0.8) {
        return { 
            action: 'TRADE', 
            targetPos: {x: target.x, y: target.y}, 
            targetUnit: target, 
            reason: '교전' 
        };
    }
  }

  // 4. [운영 단계] 후반부 합류 (15분 이후)
  if (match.currentDuration > 900) {
      if (Math.random() < myIQ / 100) {
          if (match.objectives.colossus.status === 'ALIVE') {
              return { action: 'OBJECTIVE', targetPos: POI.BARON, reason: '오브젝트 오더' };
          }
          const carry = allies.reduce((prev, curr) => (curr.gold > prev.gold ? curr : prev));
          if (carry !== player && getDistance(player, carry) > 15) {
              return { action: 'OBJECTIVE', targetPos: {x: carry.x, y: carry.y}, reason: '합류' };
          }
      }
  }

  // 5. [쇼핑] (템창 꽉 차지 않았을 때)
  const hasFullItems = player.items.length >= 6;
  const needsShopping = player.gold > 2000 && !hasFullItems;
  if (needsShopping && !target) {
    return { action: 'RECALL', targetPos: myBase, reason: '쇼핑' };
  }

  // 6. [갱킹] (정글러)
  if (player.lane === 'JUNGLE' && player.level >= 3) {
      const gankChance = 0.05 + (myIQ * 0.002); 
      const gankTarget = enemies.find(e => 
          e.lane !== 'JUNGLE' && e.currentHp > 0 && e.currentHp < e.maxHp * 0.6 
      );
      if (gankTarget && Math.random() < gankChance) { 
          return { action: 'GANK', targetPos: {x: gankTarget.x, y: gankTarget.y}, targetUnit: gankTarget, reason: '갱킹' };
      }
  }

  // 7. [기본] 라인 복귀 및 파밍
  return { action: 'FARM', targetPos: {x: player.x, y: player.y}, reason: '라인전' };
};