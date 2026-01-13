// ==========================================
// FILE PATH: /src/types/jungle.ts
// ==========================================

export type JungleCampType = 'TOP_BLUE' | 'BOT_BLUE' | 'TOP_RED' | 'BOT_RED';

export type BuffType = 'ATK' | 'DEF' | 'SPEED' | 'REGEN' | 'HASSTE' | 'GOLD';

// [신규] 개별 버프 정의
export interface MonsterBuff {
  type: BuffType;
  value: number;
}

export interface JungleMonsterStats {
  name: string;
  hp: number;
  atk: number;
  def: number;
  gold: number;
  xp: number;
  respawnTime: number;
  isBuffMob: boolean;
  
  // [수정] 다중 버프 지원을 위해 배열로 변경
  buffs: MonsterBuff[]; 
}

export interface JungleCampConfig {
  id: string;
  name: string;
  monsters: {
    spotId: string;
    x: number;
    y: number;
    stats: JungleMonsterStats;
  }[];
}

export interface JungleSettings {
  density: number;
  camps: Record<JungleCampType, JungleCampConfig>;
}
