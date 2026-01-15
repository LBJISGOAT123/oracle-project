// ==========================================
// FILE PATH: /src/engine/match/constants/MapConstants.ts
// ==========================================
import { Vector2 } from '../utils/Vector';

export const MAP_SIZE = 100;

// [수정] 본진 위치를 이미지상의 크리스탈/용암핵 위치로 미세 조정
export const BASES = {
  BLUE: { x: 8, y: 90 }, // 좌측 하단 크리스탈
  RED: { x: 92, y: 10 }  // 우측 상단 용암핵
};

export const FOUNTAIN_AREAS = {
  BLUE: { x: 0, y: 80, w: 20, h: 20 }, 
  RED: { x: 80, y: 0, w: 20, h: 20 }   
};

export const MOVEMENT_SETTINGS = {
  SEPARATION_DIST: 2.0, 
  WAYPOINT_TOLERANCE: 3.0, 
  ARRIVAL_TOLERANCE: 1.0, 
  MAX_FORCE: 0.5, 
};

// [수정] 라인전 격전지 (미니언이 만나는 곳) - 강가 중앙
export const LANE_FRONTS = {
    TOP: { x: 18, y: 18 },  // 탑 라인 강가 부쉬 근처
    MID: { x: 50, y: 50 },  // 미드 정중앙
    BOT: { x: 82, y: 82 }   // 봇 라인 강가 부쉬 근처
};

// [수정] 타워 좌표를 이미지의 '돌벽/타워 잔해' 위치로 정밀 매핑
export const TOWER_COORDS = {
  BLUE: {
    // 탑: 아래에서 위로 올라가는 경로
    TOP: [
        {x: 12, y: 65}, // 1차 (강가 앞)
        {x: 12, y: 80}, // 2차
        {x: 12, y: 85}  // 3차 (억제기)
    ],
    // 미드: 대각선
    MID: [
        {x: 38, y: 62}, // 1차
        {x: 28, y: 72}, // 2차
        {x: 20, y: 80}  // 3차
    ],
    // 봇: 왼쪽에서 오른쪽으로 가는 경로
    BOT: [
        {x: 45, y: 90}, // 1차
        {x: 25, y: 90}, // 2차
        {x: 15, y: 88}  // 3차
    ],
    NEXUS: {x: 10, y: 88} // 쌍둥이 타워 위치
  },
  RED: {
    // 탑: 왼쪽에서 오른쪽으로 (상단 벽 타고)
    TOP: [
        {x: 55, y: 10}, // 1차
        {x: 75, y: 10}, // 2차
        {x: 85, y: 12}  // 3차
    ],
    // 미드: 대각선
    MID: [
        {x: 62, y: 38}, // 1차
        {x: 72, y: 28}, // 2차
        {x: 80, y: 20}  // 3차
    ],
    // 봇: 위에서 아래로 (우측 벽 타고)
    BOT: [
        {x: 90, y: 35}, // 1차
        {x: 90, y: 20}, // 2차
        {x: 88, y: 15}  // 3차
    ],
    NEXUS: {x: 88, y: 10} // 쌍둥이 타워 위치
  }
};

// [수정] 오브젝트 위치 (이미지 싱크로율 100%)
export const POI = { 
  // 보라색 소용돌이 (바론)
  BARON: { x: 32, y: 24 },
  // 주황색 용암 둥지 (용)
  DRAGON: { x: 72, y: 76 },
  
  TOP_RIVER: { x: 25, y: 25 },
  BOT_RIVER: { x: 75, y: 75 },
  
  // 정글 몬스터 위치 (이미지의 숲 구역)
  JUNGLE_SPOTS: [
    { x: 22, y: 45 }, // 블루팀 탑 정글 (늑대)
    { x: 55, y: 78 }, // 블루팀 봇 정글 (레이스)
    { x: 45, y: 22 }, // 레드팀 탑 정글 (칼날부리)
    { x: 78, y: 55 }  // 레드팀 봇 정글 (작골)
  ]
};

// [수정] 웨이포인트 (유닛이 벽을 뚫지 않게 경로 꺾기)
export const WAYPOINTS: Record<string, Vector2[]> = {
  // 탑: 본진 -> 왼쪽 벽 -> 왼쪽 위 코너 -> 위쪽 벽 -> 적 본진
  TOP: [ 
      BASES.BLUE, 
      { x: 12, y: 80 }, 
      { x: 12, y: 25 }, // 파란팀 1차 타워 앞 (코너)
      { x: 15, y: 10 }, // 왼쪽 위 코너링
      { x: 50, y: 10 }, // 상단 중앙
      { x: 80, y: 10 }, 
      BASES.RED 
  ],
  // 미드: 직선 (살짝 휨)
  MID: [ 
      BASES.BLUE, 
      { x: 30, y: 70 }, 
      { x: 50, y: 50 }, 
      { x: 70, y: 30 }, 
      BASES.RED 
  ],
  // 봇: 본진 -> 아래 벽 -> 오른쪽 아래 코너 -> 오른쪽 벽 -> 적 본진
  BOT: [ 
      BASES.BLUE, 
      { x: 20, y: 90 }, 
      { x: 50, y: 90 }, // 하단 중앙
      { x: 85, y: 85 }, // 오른쪽 아래 코너링
      { x: 90, y: 75 }, // 빨간팀 1차 타워 앞
      { x: 90, y: 20 },
      BASES.RED 
  ],
  JUNGLE: POI.JUNGLE_SPOTS
};
