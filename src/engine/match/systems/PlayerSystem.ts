// ==========================================
// FILE PATH: /src/engine/match/systems/PlayerSystem.ts
// ==========================================
import { LivePlayer, LiveMatch, Hero, RoleSettings } from '../../../types';
import { makeDecision } from './DecisionEngine';
import { attemptBuyItem } from './ItemManager';
import { moveUnit, executeAttack } from '../BattleLogic';
import { getDistance, BASES } from '../../data/MapData';
import { LANE_PATHS } from '../../data/MapData';

// 플레이어 한 명의 1틱(Frame) 행동을 처리하는 함수
export const updatePlayerBehavior = (
  player: LivePlayer,
  match: LiveMatch,
  heroes: Hero[],
  shopItems: any[],
  roleSettings: RoleSettings,
  dt: number
) => {
  // 1. 죽음 상태 관리
  if (player.respawnTimer > 0) {
    player.respawnTimer -= dt;
    if (player.respawnTimer <= 0) {
      player.respawnTimer = 0;
      player.currentHp = player.maxHp;
      player.currentMp = player.maxMp;
      const isBlue = match.blueTeam.includes(player);
      player.x = isBlue ? BASES.BLUE.x : BASES.RED.x;
      player.y = isBlue ? BASES.BLUE.y : BASES.RED.y;
      (player as any).pathIdx = 0;
    }
    return; // 죽었으면 행동 종료
  }

  const hero = heroes.find(h => h.id === player.heroId);
  if (!hero) return;

  const isBlue = match.blueTeam.includes(player);

  // 2. [AI Brain] 의사 결정
  const decision = makeDecision(player, match, heroes);

  // 3. [Execution] 결정에 따른 행동 실행
  switch (decision.action) {
    case 'RECALL':
      handleRecall(player, isBlue, dt, hero, shopItems, match, heroes);
      break;

    case 'TRADE':
    case 'GANK':
      if (decision.targetUnit) {
        handleCombat(player, decision.targetUnit, hero, isBlue, dt, match);
      }
      break;

    case 'OBJECTIVE':
      moveUnit(player, decision.targetPos, dt, hero.stats.speed);
      break;

    case 'FARM':
    default:
      handleLaning(player, isBlue, dt, hero, match);
      break;
  }

  // 4. 아이템 구매 (살아있을 때 간헐적 시도)
  if (Math.random() < 0.1 * dt && player.gold > 1000) {
    const enemyTeam = isBlue ? match.redTeam : match.blueTeam;
    attemptBuyItem(player, shopItems, heroes, enemyTeam, match.currentDuration);
  }
};

// --- 하위 헬퍼 함수들 (로직 분리) ---

function handleRecall(p: LivePlayer, isBlue: boolean, dt: number, hero: Hero, shopItems: any[], match: LiveMatch, heroes: Hero[]) {
  const basePos = isBlue ? BASES.BLUE : BASES.RED;
  if (getDistance(p, basePos) > 5) {
    // 본진으로 빤스런 (이속 증가)
    moveUnit(p, basePos, dt, hero.stats.speed * 1.5);
  } else {
    // 우물 회복
    p.currentHp += p.maxHp * 0.5 * dt;
    p.currentMp += p.maxMp * 0.5 * dt;
    // 집에 온 김에 쇼핑
    const enemyTeam = isBlue ? match.redTeam : match.blueTeam;
    attemptBuyItem(p, shopItems, heroes, enemyTeam, match.currentDuration);
  }
}

function handleCombat(p: LivePlayer, target: LivePlayer, hero: Hero, isBlue: boolean, dt: number, match: LiveMatch) {
  const dist = getDistance(p, target);
  const attackRange = (hero.stats.range / 100) * 1.5; // 맵 스케일 보정

  if (dist <= attackRange) {
    executeAttack(p, target, hero, dt, match.logs, match.currentDuration);
    // 카이팅 (원거리 딜러는 공격 후 살짝 거리 벌림)
    if (hero.role === '신살자' || hero.role === '선지자') {
      const kitingPos = isBlue ? BASES.BLUE : BASES.RED;
      moveUnit(p, kitingPos, dt, hero.stats.speed * 0.3);
    }
  } else {
    // 추격
    moveUnit(p, { x: target.x, y: target.y }, dt, hero.stats.speed);
  }
}

function handleLaning(p: LivePlayer, isBlue: boolean, dt: number, hero: Hero, match: LiveMatch) {
  const laneKey = p.lane === 'JUNGLE' ? 'JUNGLE' : p.lane;
  let path = LANE_PATHS[laneKey] || LANE_PATHS['MID'];

  if (!isBlue && p.lane !== 'JUNGLE') {
    path = [...path].reverse();
  }

  let currentIdx = (p as any).pathIdx || 0;
  if (currentIdx >= path.length) currentIdx = path.length - 1;

  const dest = path[currentIdx];
  const arrived = moveUnit(p, dest, dt, hero.stats.speed);

  if (arrived) {
    if (currentIdx < path.length - 1) {
      (p as any).pathIdx = currentIdx + 1;
    } else {
      // 라인 끝(적 본진) 도착 시 넥서스 타격 대기
      // (실제 타격은 SiegePhase에서 처리하거나 여기서 처리 가능)
    }
  }
}