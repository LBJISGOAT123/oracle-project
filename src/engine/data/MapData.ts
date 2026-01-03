// ==========================================
// FILE PATH: /src/engine/data/MapData.ts
// ==========================================

export interface Vector2 { x: number; y: number; }

// 맵 크기: 0 ~ 100
// 블루 본진: (5, 95) 좌하단
// 레드 본진: (95, 5) 우상단

export const BASES = {
  BLUE: { x: 5, y: 95 },
  RED: { x: 95, y: 5 }
};

// 각 라인별 웨이포인트 (이동 경로)
export const LANE_PATHS: Record<string, Vector2[]> = {
  TOP: [
    { x: 5, y: 95 },   // 블루 본진
    { x: 5, y: 20 },   // 블루 탑 1차 근처
    { x: 20, y: 5 },   // 탑 코너 (대각선 꺾임 방지)
    { x: 95, y: 5 }    // 레드 본진
  ],
  MID: [
    { x: 5, y: 95 },   // 블루 본진
    { x: 50, y: 50 },  // 미드 중앙
    { x: 95, y: 5 }    // 레드 본진
  ],
  BOT: [
    { x: 5, y: 95 },   // 블루 본진
    { x: 80, y: 95 },  // 블루 봇 1차 근처
    { x: 95, y: 80 },  // 봇 코너
    { x: 95, y: 5 }    // 레드 본진
  ],
  JUNGLE: [
    { x: 25, y: 75 }, // 블루 정글 (늑대/블루)
    { x: 40, y: 60 }, // 강가 근처
    { x: 60, y: 40 }, // 레드 정글 진입
    { x: 75, y: 25 }  // 레드 정글 (칼날부리/레드)
  ]
};

// 거리 계산 함수 (피타고라스)
export const getDistance = (a: {x:number, y:number}, b: {x:number, y:number}) => {
  return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
};

export const POI = { // Point of Interest (중요 거점)
  BARON: { x: 35, y: 35 },    // 거신병 (바론) 위치 (탑-미드 사이)
  DRAGON: { x: 65, y: 65 },   // 주시자 (용) 위치 (봇-미드 사이)
  TOP_RIVER: { x: 20, y: 20 },
  BOT_RIVER: { x: 80, y: 80 }
};

// 라인 복귀 시 타워 위치 계산을 위한 헬퍼
export const getTowerSafeZone = (lane: string, isBlue: boolean) => {
    // 1차 타워가 살아있으면 그곳, 없으면 2차... (간소화하여 1차 타워 위치 반환)
    if (lane === 'TOP') return isBlue ? {x: 5, y: 20} : {x: 20, y: 5};
    if (lane === 'MID') return isBlue ? {x: 20, y: 80} : {x: 80, y: 20}; // 대각선 보정 필요하지만 일단 
    if (lane === 'BOT') return isBlue ? {x: 80, y: 95} : {x: 95, y: 80};
    return isBlue ? BASES.BLUE : BASES.RED;
};

