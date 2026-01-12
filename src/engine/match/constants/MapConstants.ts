import { Vector2 } from '../utils/Vector';

export const MAP_SIZE = 100;

export const BASES = {
  BLUE: { x: 5, y: 95 },
  RED: { x: 95, y: 5 }
};

// 라인별 정밀 웨이포인트 (곡선 주행을 위해 세분화)
export const WAYPOINTS: Record<string, Vector2[]> = {
  TOP: [
    { x: 5, y: 95 },   // 블루 본진
    { x: 5, y: 50 },   // 블루 탑 2차
    { x: 5, y: 20 },   // 블루 탑 1차
    { x: 10, y: 10 },  // 탑 코너 (곡선)
    { x: 20, y: 5 },   // 레드 탑 1차
    { x: 50, y: 5 },   // 레드 탑 2차
    { x: 95, y: 5 }    // 레드 본진
  ],
  MID: [
    { x: 5, y: 95 },
    { x: 25, y: 75 },
    { x: 50, y: 50 },  // 미드 중앙
    { x: 75, y: 25 },
    { x: 95, y: 5 }
  ],
  BOT: [
    { x: 5, y: 95 },   // 블루 본진
    { x: 50, y: 95 },  // 블루 봇 2차
    { x: 80, y: 95 },  // 블루 봇 1차
    { x: 90, y: 90 },  // 봇 코너 (곡선)
    { x: 95, y: 80 },  // 레드 봇 1차
    { x: 95, y: 50 },  // 레드 봇 2차
    { x: 95, y: 5 }    // 레드 본진
  ],
  JUNGLE: [ // 정글러 순회 경로
    { x: 20, y: 70 }, 
    { x: 35, y: 65 }, 
    { x: 45, y: 55 }, 
    { x: 55, y: 45 }, 
    { x: 65, y: 35 }, 
    { x: 80, y: 30 }  
  ]
};

export const MOVEMENT_SETTINGS = {
  SEPARATION_DIST: 3.0, // 유닛간 거리두기 반경
  WAYPOINT_TOLERANCE: 4.0, // 웨이포인트 도달 인정 범위
  ARRIVAL_TOLERANCE: 1.0, // 최종 목적지 도달 인정 범위
  MAX_FORCE: 0.5, // 조향력 제한 (관성 구현)
};
