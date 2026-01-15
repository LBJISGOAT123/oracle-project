// ==========================================
// FILE PATH: /src/engine/match/constants/MapConstants.ts
// ==========================================
import { Vector2 } from '../utils/Vector';

export const MAP_SIZE = 100;

export const BASES = {
  BLUE: { x: 6, y: 94 }, // 좌측 하단
  RED: { x: 94, y: 6 }   // 우측 상단
};

export const FOUNTAIN_AREAS = {
  BLUE: { x: 0, y: 85, w: 15, h: 15 }, 
  RED: { x: 85, y: 0, w: 15, h: 15 }   
};

export const MOVEMENT_SETTINGS = {
  SEPARATION_DIST: 2.0, 
  WAYPOINT_TOLERANCE: 3.0, 
  ARRIVAL_TOLERANCE: 1.0, 
  MAX_FORCE: 0.5, 
};

// 라인전 격전지 (강가 부쉬 근처)
export const LANE_FRONTS = {
    TOP: { x: 15, y: 15 }, 
    MID: { x: 50, y: 50 }, 
    BOT: { x: 85, y: 85 }
};

export const TOWER_COORDS = {
  BLUE: {
    // 탑 (왼쪽 벽)
    TOP: [
        {x: 8, y: 25},  // 1차
        {x: 8, y: 45}, // 2차
        {x: 8, y: 76}  // 3차
    ],
    // 미드 (대각선)
    MID: [
        {x: 40, y: 58}, // 1차
        {x: 30, y: 68}, // 2차
        {x: 22, y: 78}  // 3차
    ],
    // 봇 (아래쪽 벽)
    BOT: [
        {x: 76, y: 92}, // 1차
        {x: 45, y: 92}, // 2차
        {x: 25, y: 92}  // 3차
    ],
    NEXUS: {x: 13, y: 87}
  },
  RED: {
    // [수정] 탑 (위쪽 벽): 오른쪽에서 왼쪽으로 뻗어나감
    TOP: [
        {x: 24, y: 8},  // 1차 (강가 근처까지 전진)
        {x: 55, y: 8}, // 2차
        {x: 75, y: 8}  // 3차 (본진 앞)
    ],
    // [수정] 미드 (대각선): 1차 타워를 더 전진시킴
    MID: [
        {x: 60, y: 42}, // 1차
        {x: 70, y: 32}, // 2차
        {x: 78, y: 22}  // 3차
    ],
    // [수정] 봇 (오른쪽 벽): 위에서 아래로 뻗어내려감
    BOT: [
        {x: 92, y: 75}, // 1차 (강가 근처까지 전진)
        {x: 92, y: 55}, // 2차
        {x: 92, y: 24}  // 3차 (본진 앞)
    ],
    NEXUS: {x: 87, y: 13}
  }
};

export const POI = { 
  BARON: { x: 33, y: 28 },
  DRAGON: { x: 68, y: 69 },
  
  TOP_RIVER: { x: 25, y: 25 },
  BOT_RIVER: { x: 75, y: 75 },
  
  JUNGLE_SPOTS: [
    { x: 22, y: 48 }, 
    { x: 55, y: 80 }, 
    { x: 48, y: 20 }, 
    { x: 80, y: 52 }  
  ]
};

// [수정] 웨이포인트가 타워 위치를 자연스럽게 지나가도록 보정
export const WAYPOINTS: Record<string, Vector2[]> = {
  TOP: [ 
      BASES.BLUE, 
      { x: 12, y: 80 }, 
      { x: 9, y: 40 }, 
      { x: 15, y: 15 }, // 탑 코너
      { x: 40, y: 9 },  // 레드 1차
      { x: 82, y: 12 }, // 레드 3차
      BASES.RED 
  ],
  MID: [ 
      BASES.BLUE, 
      { x: 35, y: 65 }, 
      { x: 50, y: 50 }, 
      { x: 65, y: 35 }, 
      BASES.RED 
  ],
  BOT: [ 
      BASES.BLUE, 
      { x: 20, y: 90 }, 
      { x: 60, y: 91 }, 
      { x: 85, y: 85 }, // 봇 코너
      { x: 91, y: 60 }, // 레드 1차
      { x: 88, y: 18 }, // 레드 3차
      BASES.RED 
  ],
  JUNGLE: POI.JUNGLE_SPOTS
};
