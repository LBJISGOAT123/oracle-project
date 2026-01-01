// ==========================================
// FILE PATH: /src/data/jungle.ts
// ==========================================

export const JUNGLE_CONFIG = {
  NAME: "혼돈의 균열 (Chaos Rift)",
  DESCRIPTION: "전장의 틈새에 존재하는 불안정한 차원입니다. 이곳에는 어느 진영에도 속하지 않는 '이계의 크리처'들이 서식합니다.",

  // 2. 기본 밸런스 수치 (0~100)
  DEFAULT_SETTINGS: {
    density: 50, // 밀도
    yield: 50,   // 풍요도
    attack: 30,  // 크리처 공격력
    defense: 20, // 크리처 방어력
    threat: 0    
  },

  // 3. 시뮬레이션 계수
  BASE_SPAWN_RATE: 0.13,  
  BASE_GOLD: 18,          
  BASE_XP_INTERVAL: 12,   
  BASE_DAMAGE_TAKEN: 10,  
  BASE_REGEN: 15          
};