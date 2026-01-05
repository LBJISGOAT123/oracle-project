// ==========================================
// FILE PATH: /src/engine/match/systems/PlayerSystem.ts
// ==========================================
import { LivePlayer, LiveMatch, Hero, RoleSettings } from '../../../types';
import { makeDecision } from './DecisionEngine';
import { attemptBuyItem, updateLivePlayerStats } from './ItemManager'; 
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
  // ------------------------------------------------
  // [0] 상태 갱신 (쿨타임 감소 등)
  // ------------------------------------------------
  if (!player.cooldowns) player.cooldowns = { q:0, w:0, e:0, r:0 };
  
  if (player.cooldowns.q > 0) player.cooldowns.q -= dt;
  if (player.cooldowns.w > 0) player.cooldowns.w -= dt;
  if (player.cooldowns.e > 0) player.cooldowns.e -= dt;
  if (player.cooldowns.r > 0) player.cooldowns.r -= dt;

  // ------------------------------------------------
  // [1] 죽음 상태 관리
  // ------------------------------------------------
  if (player.respawnTimer > 0) {
    player.respawnTimer -= dt;
    // 죽어있을 땐 귀환 타이머 등 상태 초기화
    (player as any).currentRecallTime = 0; 

    if (player.respawnTimer <= 0) {
      // 부활 처리
      player.respawnTimer = 0;
      
      const hero = heroes.find(h => h.id === player.heroId);
      if (hero) {
          // 부활 시 스탯 재계산 (레벨업/아이템 오류 보정)
          updateLivePlayerStats(player, hero);
      }

      player.currentHp = player.maxHp;
      player.currentMp = player.maxMp;
      
      // 쿨타임 초기화
      player.cooldowns = { q:0, w:0, e:0, r:0 };

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
  
  // 현재 이동 속도 (아이템 반영값 우선)
  const currentMoveSpeed = (player as any).moveSpeed || hero.stats.speed;

  // ------------------------------------------------
  // [2] AI 의사 결정 (Decision Making)
  // ------------------------------------------------
  const decision = makeDecision(player, match, heroes);

  // 귀환 명령이 아니면 귀환 타이머 즉시 초기화 (취소됨)
  if (decision.action !== 'RECALL') {
      (player as any).currentRecallTime = 0;
  }

  // ------------------------------------------------
  // [3] 행동 실행 (Execution)
  // ------------------------------------------------
  switch (decision.action) {
    case 'RECALL':
      // 제자리 대기 (채널링) 후 이동
      handleRecall(player, isBlue, dt, hero, shopItems, match, heroes);
      break;

    case 'FLEE':
      // 불리할 때 도주 (본진 방향으로 이동)
      moveUnit(player, decision.targetPos, dt, currentMoveSpeed);
      break;

    case 'TRADE':
    case 'GANK':
      if (decision.targetUnit) {
        handleCombat(player, decision.targetUnit, hero, isBlue, dt, match, currentMoveSpeed);
      }
      break;

    case 'OBJECTIVE':
      moveUnit(player, decision.targetPos, dt, currentMoveSpeed);
      break;

    case 'FARM':
    default:
      handleLaning(player, isBlue, dt, hero, match, currentMoveSpeed);
      break;
  }

  // ------------------------------------------------
  // [4] 원격 아이템 구매 (우물 밖에서도 짐꾼/원격구매 컨셉)
  // ------------------------------------------------
  if (Math.random() < 0.1 * dt && player.gold > 1000) {
    const enemyTeam = isBlue ? match.redTeam : match.blueTeam;
    attemptBuyItem(player, shopItems, heroes, enemyTeam, match.currentDuration);
  }
};

// --- 하위 헬퍼 함수들 ---

function handleRecall(
    p: LivePlayer, isBlue: boolean, dt: number, 
    hero: Hero, shopItems: any[], match: LiveMatch, heroes: Hero[]
) {
  const basePos = isBlue ? BASES.BLUE : BASES.RED;
  
  // 이미 본진에 있으면 회복만 수행
  if (getDistance(p, basePos) <= 5) {
    p.currentHp += p.maxHp * 0.5 * dt;
    p.currentMp += p.maxMp * 0.5 * dt;
    (p as any).currentRecallTime = 0;
    
    // 도착했으니 쇼핑
    const enemyTeam = isBlue ? match.redTeam : match.blueTeam;
    attemptBuyItem(p, shopItems, heroes, enemyTeam, match.currentDuration);
    return;
  }

  // 본진이 아니면 귀환 시도 (채널링)
  const RECALL_DURATION = 4.0; // 4초

  (p as any).currentRecallTime = ((p as any).currentRecallTime || 0) + dt;

  // *중요*: moveUnit을 호출하지 않음 = 제자리에 멈춰있음

  if ((p as any).currentRecallTime >= RECALL_DURATION) {
      p.x = basePos.x;
      p.y = basePos.y;
      (p as any).currentRecallTime = 0;
      
      // 도착 즉시 약간 회복
      p.currentHp += p.maxHp * 0.2;
  }
}

function handleCombat(
    p: LivePlayer, target: LivePlayer, hero: Hero, 
    isBlue: boolean, dt: number, match: LiveMatch,
    speed: number
) {
  const dist = getDistance(p, target);
  // 사거리 + 맵 스케일 보정
  const attackRange = (hero.stats.range / 100) * 1.5; 

  if (dist <= attackRange) {
    // 사거리 내에 있으면 공격 실행 (데미지 계산은 CombatPhase가 하지만, 여기선 모션/위치제어)
    // *실제 데미지 로직은 processCombatPhase에서 확률적으로 처리됨*
    // 여기서는 '전투 상태'임을 유지하고 카이팅 무빙만 처리
    
    if (hero.role === '신살자' || hero.role === '선지자') {
      const kitingPos = isBlue ? BASES.BLUE : BASES.RED;
      moveUnit(p, kitingPos, dt, speed * 0.3); // 카이팅 (느리게 뒤로)
    }
  } else {
    // 사거리 밖이면 추격
    moveUnit(p, { x: target.x, y: target.y }, dt, speed);
  }
}

function handleLaning(
    p: LivePlayer, isBlue: boolean, dt: number, 
    hero: Hero, match: LiveMatch,
    speed: number
) {
  const laneKey = p.lane === 'JUNGLE' ? 'JUNGLE' : p.lane;
  let path = LANE_PATHS[laneKey] || LANE_PATHS['MID'];

  if (!isBlue && p.lane !== 'JUNGLE') {
    path = [...path].reverse();
  }

  let currentIdx = (p as any).pathIdx || 0;
  if (currentIdx >= path.length) currentIdx = path.length - 1;

  const dest = path[currentIdx];
  const arrived = moveUnit(p, dest, dt, speed);

  if (arrived) {
    if (currentIdx < path.length - 1) {
      (p as any).pathIdx = currentIdx + 1;
    }
  }
}