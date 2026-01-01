// src/engine/SpectateEngine.ts

export const MAP = {
  BLUE_BASE: { x: 15, y: 85 },
  RED_BASE: { x: 85, y: 15 },
  TOP_EXIT: { x: 15, y: 15 },
  BOT_EXIT: { x: 85, y: 85 },
  CENTER: { x: 50, y: 50 }
};

const PATHS = {
  TOP: {
    BLUE: [MAP.BLUE_BASE, MAP.TOP_EXIT, MAP.RED_BASE],
    RED: [MAP.RED_BASE, MAP.TOP_EXIT, MAP.BLUE_BASE]
  },
  MID: {
    BLUE: [MAP.BLUE_BASE, MAP.CENTER, MAP.RED_BASE],
    RED: [MAP.RED_BASE, MAP.CENTER, MAP.BLUE_BASE]
  },
  BOT: {
    BLUE: [MAP.BLUE_BASE, MAP.BOT_EXIT, MAP.RED_BASE],
    RED: [MAP.RED_BASE, MAP.BOT_EXIT, MAP.BLUE_BASE]
  }
};

/**
 * [추가] 경기 시간에 따른 유닛의 초기 위치 계산
 * 4분 진행된 방에 들어가면 라인 중간쯤으로 유닛을 워프시킴
 */
export const calculateInitialPosition = (lane: string, isBlue: boolean, duration: number) => {
  const laneKey = lane === 'JUNGLE' ? 'MID' : (lane as 'TOP' | 'MID' | 'BOT');
  const path = PATHS[laneKey][isBlue ? 'BLUE' : 'RED'];

  // 유닛이 한 바퀴 진격하는 데 걸리는 대략적인 시간 (초)
  const cycleTime = 60; 
  const progress = (duration % cycleTime) / cycleTime; // 0.0 ~ 1.0

  // 진행도에 따라 경로상의 index 결정
  const totalWaypoints = path.length;
  const currentIdx = Math.min(Math.floor(progress * totalWaypoints), totalWaypoints - 1);
  const nextIdx = Math.min(currentIdx + 1, totalWaypoints - 1);

  const start = path[currentIdx];
  const end = path[nextIdx];
  const ratio = (progress * totalWaypoints) % 1;

  return {
    x: start.x + (end.x - start.x) * ratio,
    y: start.y + (end.y - start.y) * ratio,
    step: currentIdx
  };
};

export const moveUnit = (unit: any, enemies: any[], allies: any[], isBlue: boolean, deltaTime: number) => {
  if (unit.currentHp <= 0) return;

  const speed = 0.6 * deltaTime;
  const detectionRange = 25; 
  const attackRange = 7;

  // 1. 적 감지
  let target: any = null;
  let minDist = detectionRange;
  enemies.forEach(en => {
    if (en.currentHp > 0) {
      const d = Math.sqrt(Math.pow(unit.vx - en.vx, 2) + Math.pow(unit.vy - en.vy, 2));
      if (d < minDist) { minDist = d; target = en; }
    }
  });

  if (target) {
    const d = Math.sqrt(Math.pow(unit.vx - target.vx, 2) + Math.pow(unit.vy - target.vy, 2));
    if (d > attackRange) {
      unit.vx += ((target.vx - unit.vx) / d) * speed;
      unit.vy += ((target.vy - unit.vy) / d) * speed;
      unit.isAttacking = false;
    } else {
      unit.isAttacking = true;
      unit.targetPos = { x: target.vx, y: target.vy };
      unit.vx += (Math.random() - 0.5) * 0.4; // 전투 중 떨림
      unit.vy += (Math.random() - 0.5) * 0.4;
    }
  } else {
    // 2. 진격 (웨이포인트 따라가기)
    unit.isAttacking = false;
    const laneKey = unit.lane === 'JUNGLE' ? 'MID' : unit.lane;
    const path = PATHS[laneKey as 'TOP' | 'MID' | 'BOT'][isBlue ? 'BLUE' : 'RED'];
    const targetWaypoint = path[unit.pathStep] || path[path.length - 1];

    const d = Math.sqrt(Math.pow(unit.vx - targetWaypoint.x, 2) + Math.pow(unit.vy - targetWaypoint.y, 2));
    if (d < 5) {
      if (unit.pathStep < path.length - 1) unit.pathStep++;
      else unit.pathStep = 0; // 본진 도착시 다시 처음으로 (순환)
    } else {
      unit.vx += ((targetWaypoint.x - unit.vx) / d) * speed;
      unit.vy += ((targetWaypoint.y - unit.vy) / d) * speed;
    }
  }

  // 아군끼리 겹침 방지
  allies.forEach(al => {
    if (al.name === unit.name) return;
    const d = Math.sqrt(Math.pow(unit.vx - al.vx, 2) + Math.pow(unit.vy - al.vy, 2));
    if (d < 3) {
      unit.vx -= (al.vx - unit.vx) * 0.1;
      unit.vy -= (al.vy - unit.vy) * 0.1;
    }
  });
};