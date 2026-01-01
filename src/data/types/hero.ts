// src/types/hero.ts
export type Role = '집행관' | '선지자' | '수호기사' | '추적자' | '신살자';
export type Tier = 'OP' | '1' | '2' | '3' | '4' | '5';

// [NEW] 특수 스킬 메커니즘
export type SkillMechanic = 
  | 'NONE' | 'STUN' | 'HOOK' | 'DASH' | 'STEALTH' 
  | 'SHIELD' | 'HEAL' | 'EXECUTE' | 'GLOBAL';

export interface HeroStats {
  ad: number;      // 공격력 (스킬/평타 계수용)
  baseAtk: number; // [NEW] 기본 평타 데미지 (깡뎀)
  ap: number;      // 주문력
  hp: number;      // 체력
  armor: number;   // 방어력
  crit: number;    // 치명타
  range: number;   // 사거리
  speed: number;   // 이속
  regen: number;   // 재생
  pen: number;     // 관통
}

// 스킬 상세 구조
export interface SkillDetail {
  name: string;
  mechanic: SkillMechanic;
  val: number;
  adRatio: number;
  apRatio: number;
  cd: number;
  isPassive?: boolean;
}

// 스킬셋 (P, Q, W, E, R)
export interface HeroSkillSet {
  passive: SkillDetail;
  q: SkillDetail;
  w: SkillDetail;
  e: SkillDetail;
  r: SkillDetail;
}

export interface HeroRecord {
  totalMatches: number; totalWins: number; totalPicks: number; totalBans: number;
  totalKills: number; totalDeaths: number; totalAssists: number;
  totalDamage: number; totalDamageTaken: number; totalCs: number; totalGold: number;
  recentResults: boolean[]; 
}

export interface Hero {
  id: string; name: string; role: Role;
  stats: HeroStats;
  skills: HeroSkillSet;

  // (하위 호환용 - 사용 안함)
  skill?: any; skillLevels?: any; 

  record: HeroRecord;
  tier: Tier; rank: number; rankChange: number;
  recentWinRate: number; pickRate: number; banRate: number;
  avgKda: string; kdaRatio: string;
  avgDpm: string; avgDpg: string; avgCs: string; avgGold: string;
}