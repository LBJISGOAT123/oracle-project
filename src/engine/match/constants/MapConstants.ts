// ==========================================
// FILE PATH: /src/engine/match/constants/MapConstants.ts
// ==========================================
import { Vector2 } from '../utils/Vector';

export const MAP_SIZE = 100;

export const BASES = {
  BLUE: { x: 5, y: 95 },
  RED: { x: 95, y: 5 }
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

// [핵심] 라인별 격전지 (미니언이 만나는 곳)
// 맵 이미지를 기반으로 좌표를 직접 지정합니다.
export const LANE_FRONTS = {
    TOP: { x: 20, y: 25 },  // 탑 라인 중앙 (강가쪽)
    MID: { x: 50, y: 50 },  // 미드 정중앙
    BOT: { x: 80, y: 75 }   // 봇 라인 중앙
};

export const TOWER_COORDS = {
  BLUE: {
    TOP: [{x: 8, y: 35}, {x: 8, y: 55}, {x: 10, y: 75}],
    MID: [{x: 40, y: 60}, {x: 30, y: 70}, {x: 22, y: 78}],
    BOT: [{x: 75, y: 92}, {x: 50, y: 90}, {x: 25, y: 88}],
    NEXUS: {x: 12, y: 88}
  },
  RED: {
    TOP: [{x: 45, y: 10}, {x: 65, y: 12}, {x: 80, y: 15}],
    MID: [{x: 60, y: 40}, {x: 70, y: 30}, {x: 78, y: 22}],
    BOT: [{x: 92, y: 65}, {x: 92, y: 45}, {x: 88, y: 25}],
    NEXUS: {x: 88, y: 12}
  }
};

export const POI = { 
  BARON: { x: 25, y: 28 },
  DRAGON: { x: 78, y: 72 },
  TOP_RIVER: { x: 20, y: 20 },
  BOT_RIVER: { x: 80, y: 80 },
  JUNGLE_SPOTS: [
    { x: 15, y: 42 }, { x: 50, y: 82 }, 
    { x: 58, y: 22 }, { x: 82, y: 55 }
  ]
};

// 웨이포인트도 단순화
export const WAYPOINTS: Record<string, Vector2[]> = {
  TOP: [ BASES.BLUE, { x: 8, y: 35 }, LANE_FRONTS.TOP, { x: 45, y: 10 }, BASES.RED ],
  MID: [ BASES.BLUE, { x: 25, y: 75 }, LANE_FRONTS.MID, { x: 75, y: 25 }, BASES.RED ],
  BOT: [ BASES.BLUE, { x: 75, y: 92 }, LANE_FRONTS.BOT, { x: 92, y: 65 }, BASES.RED ],
  JUNGLE: POI.JUNGLE_SPOTS
};
