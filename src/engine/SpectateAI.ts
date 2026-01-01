// src/engine/SpectateAI.ts
import { LivePlayer } from '../types';

export interface VisualUnit extends LivePlayer {
  vx: number;
  vy: number;
  role: string;
}

const getDist = (x1: number, y1: number, x2: number, y2: number) => 
  Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));

export function updateUnitAI(
  u: VisualUnit, 
  allies: VisualUnit[], 
  enemies: VisualUnit[], 
  isBlue: boolean
): VisualUnit {

  // 1. 사망 시 기지 위치 고정
  if (u.currentHp <= 0) {
    u.vx = isBlue ? 12 : 88;
    u.vy = isBlue ? 88 : 12;
    return u;
  }

  // 2. 적 탐지
  let target: VisualUnit | null = null;
  let minDist = 20; // 인식 범위 20%

  enemies.forEach(e => {
    if (e.currentHp > 0) {
      const d = getDist(u.vx, u.vy, e.vx, e.vy);
      if (d < minDist) { minDist = d; target = e; }
    }
  });

  const speed = 0.25; // 이동 속도 (영상보다 더 빠르게 설정)

  if (target) {
    const d = getDist(u.vx, u.vy, target.vx, target.vy);
    if (d > 4) { // 사거리 밖이면 추격
      u.vx += ((target.vx - u.vx) / d) * speed;
      u.vy += ((target.vy - u.vy) / d) * speed;
    } else {
      // 교전 중 (미세한 떨림)
      u.vx += (Math.random() - 0.5) * 0.15;
      u.vy += (Math.random() - 0.5) * 0.15;
    }
  } else {
    // [라인 이동]
    const dest = getLanePath(u.lane, isBlue, u.vx, u.vy);
    const dDest = getDist(u.vx, u.vy, dest.x, dest.y);
    if (dDest > 1) {
      u.vx += ((dest.x - u.vx) / dDest) * speed;
      u.vy += ((dest.y - u.vy) / dDest) * speed;
    }
  }

  // 유닛끼리 너무 겹치지 않게 밀어내기
  allies.forEach(mate => {
    if (mate.name === u.name) return;
    if (getDist(u.vx, u.vy, mate.vx, mate.vy) < 2) {
      u.vx += (Math.random() - 0.5) * 0.1;
      u.vy += (Math.random() - 0.5) * 0.1;
    }
  });

  return u;
}

function getLanePath(lane: string, isBlue: boolean, cx: number, cy: number) {
  const blueBase = { x: 12, y: 88 };
  const redBase = { x: 88, y: 12 };
  const target = isBlue ? redBase : blueBase;

  if (lane === 'MID') return target;
  if (lane === 'TOP') {
    if (isBlue) return cy > 15 ? { x: 12, y: 12 } : target;
    return cx > 15 ? { x: 12, y: 12 } : target;
  }
  if (lane === 'BOT') {
    if (isBlue) return cx < 85 ? { x: 88, y: 88 } : target;
    return cy < 85 ? { x: 88, y: 88 } : target;
  }
  return { x: 50, y: 50 };
}