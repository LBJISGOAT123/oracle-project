// ==========================================
// FILE PATH: /src/data/types/match.ts
// ==========================================

export type EventType = 'KILL' | 'TOWER' | 'COLOSSUS' | 'WATCHER' | 'START' | 'LEVELUP';

export interface GameLog {
  time: number;
  message: string;
  type: EventType;
  team?: 'BLUE' | 'RED';
}

export interface TimelineEvent {
  time: number; 
  type: EventType;
  killerId: string; 
  victimId: string; 
  message: string;
}

export interface LivePlayer {
  name: string; 
  heroId: string;
  kills: number; deaths: number; assists: number;
  gold: number; cs: number;
  currentHp: number; 
  maxHp: number;
  currentMp: number;
  maxMp: number;
  mpRegen: number;
  level: number;
  items: any[]; 
  totalDamageDealt: number;
  x: number; 
  y: number;
  lane: 'TOP' | 'MID' | 'BOT' | 'JUNGLE';
  buffs: string[];
  mmr: number;
  respawnTimer: number;
  cooldowns?: { q:number, w:number, e:number, r:number };
  stats: { brain: number, mechanics: number };

  // [신규] 타워 어그로 시스템을 위한 필드
  lastAttackTime?: number;       // 마지막으로 적을 공격한 시간
  lastAttackedTargetId?: string; // 마지막으로 공격한 대상(영웅)의 ID
}

export interface TowerStatus {
  top: number; 
  mid: number;
  bot: number;
}

export interface TeamStats {
  towers: TowerStatus; 
  laneHealth: { top: number; mid: number; bot: number };
  colossus: number;
  watcher: number;
  fury: number;
  nexusHp: number;
  maxNexusHp: number;
  activeBuffs: { siegeUnit: boolean; voidPower: boolean; voidBuffEndTime?: number; };
}

export interface LiveMatch {
  id: string;
  status: 'DRAFTING' | 'PLAYING' | 'ENDED';
  draft?: any;
  blueTeam: LivePlayer[];
  redTeam: LivePlayer[];
  bans: { blue: string[]; red: string[]; };
  startTime: number;
  duration: number;
  currentDuration: number;
  avgTier: string;
  score: { blue: number, red: number };
  stats: {
    blue: TeamStats;
    red: TeamStats;
  };
  timeline: TimelineEvent[];
  logs: GameLog[];
  
  nextColossusSpawnTime?: number;
  nextWatcherSpawnTime?: number;
  objectives: {
      colossus: { hp: number; maxHp: number; status: 'ALIVE'|'DEAD'; nextSpawnTime: number };
      watcher: { hp: number; maxHp: number; status: 'ALIVE'|'DEAD'; nextSpawnTime: number };
  };
  minions: any[];
  projectiles: any[];
  jungleMobs: any[];
}
