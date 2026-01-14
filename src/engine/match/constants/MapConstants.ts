// ==========================================
// FILE PATH: /src/engine/match/constants/MapConstants.ts
// ==========================================
import { Vector2 } from '../utils/Vector';

export const MAP_SIZE = 100;

export const BASES = {
  BLUE: { x: 5, y: 95 },
  RED: { x: 95, y: 5 }
};

// 우물 구역 (접근 시 레이저)
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

// [이동] 웨이포인트 경로 (타워 위치에 맞춰 수정됨)
export const WAYPOINTS: Record<string, Vector2[]> = {
  TOP: [
    { x: 5, y: 95 }, { x: 8, y: 55 }, { x: 8, y: 35 }, // Blue Area
    { x: 25, y: 25 }, // River
    { x: 45, y: 10 }, { x: 65, y: 12 }, { x: 95, y: 5 } // Red Area
  ],
  MID: [
    { x: 5, y: 95 }, { x: 25, y: 75 }, { x: 50, y: 50 }, { x: 75, y: 25 }, { x: 95, y: 5 }
  ],
  BOT: [
    { x: 5, y: 95 }, { x: 50, y: 90 }, { x: 75, y: 92 }, // Blue Area
    { x: 80, y: 80 }, // River
    { x: 92, y: 65 }, { x: 92, y: 45 }, { x: 95, y: 5 } // Red Area
  ],
  JUNGLE: [ 
    { x: 20, y: 70 }, { x: 35, y: 65 }, { x: 45, y: 55 }, { x: 55, y: 45 }, { x: 65, y: 35 }, { x: 80, y: 30 }  
  ]
};

// [중요] 타워 좌표 (Visual Component와 100% 일치시킴)
export const TOWER_COORDS = {
  BLUE: {
    TOP: [
      {x: 8, y: 35}, 
      {x: 8, y: 55}, 
      {x: 10, y: 75}
    ],
    MID: [
      {x: 40, y: 60}, 
      {x: 30, y: 70}, 
      {x: 22, y: 78}
    ],
    BOT: [
      {x: 75, y: 92}, 
      {x: 50, y: 90}, 
      {x: 25, y: 88}
    ],
    NEXUS: {x: 12, y: 88}
  },
  RED: {
    TOP: [
      {x: 45, y: 10}, 
      {x: 65, y: 12}, 
      {x: 80, y: 15}
    ],
    MID: [
      {x: 60, y: 40}, 
      {x: 70, y: 30}, 
      {x: 78, y: 22}
    ],
    BOT: [
      {x: 92, y: 65}, 
      {x: 92, y: 45}, 
      {x: 88, y: 25}
    ],
    NEXUS: {x: 88, y: 12}
  }
};
