// ==========================================
// FILE PATH: /src/engine/data/MapData.ts
// ==========================================
import { POI as MAP_POI, BASES as MAP_BASES } from '../match/constants/MapConstants';

export interface Vector2 { x: number; y: number; }

export const BASES = MAP_BASES;

// 단순 거리 계산 (서버 로직용)
export const getDistance = (a: {x:number, y:number}, b: {x:number, y:number}) => {
  if (!a || !b) return 9999;
  return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
};

// MapConstants에서 정의한 POI를 그대로 내보냄 (Single Source of Truth)
export const POI = MAP_POI;

export const getTowerSafeZone = (lane: string, isBlue: boolean) => {
    if (lane === 'TOP') return isBlue ? {x: 12, y: 25} : {x: 75, y: 10};
    if (lane === 'MID') return isBlue ? {x: 38, y: 62} : {x: 62, y: 38}; 
    if (lane === 'BOT') return isBlue ? {x: 45, y: 90} : {x: 90, y: 35};
    return isBlue ? BASES.BLUE : BASES.RED;
};
