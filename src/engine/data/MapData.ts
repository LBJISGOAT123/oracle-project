// ==========================================
// FILE PATH: /src/engine/data/MapData.ts
// ==========================================

export interface Vector2 { x: number; y: number; }

export const BASES = {
  BLUE: { x: 5, y: 95 },
  RED: { x: 95, y: 5 }
};

// 단순 거리 계산 (서버 로직용)
export const getDistance = (a: {x:number, y:number}, b: {x:number, y:number}) => {
  return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
};

export const POI = { 
  // [수정] 거신병 위치를 맵의 10~11시 방향(바론 둥지)으로 이동
  BARON: { x: 25, y: 30 },    
  // [수정] 주시자 위치를 맵의 4~5시 방향(용 둥지)으로 이동
  DRAGON: { x: 75, y: 70 },   
  TOP_RIVER: { x: 20, y: 20 },
  BOT_RIVER: { x: 80, y: 80 }
};

export const getTowerSafeZone = (lane: string, isBlue: boolean) => {
    if (lane === 'TOP') return isBlue ? {x: 5, y: 20} : {x: 20, y: 5};
    if (lane === 'MID') return isBlue ? {x: 20, y: 80} : {x: 80, y: 20}; 
    if (lane === 'BOT') return isBlue ? {x: 80, y: 95} : {x: 95, y: 80};
    return isBlue ? BASES.BLUE : BASES.RED;
};
