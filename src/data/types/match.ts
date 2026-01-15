// ==========================================
// FILE PATH: /src/data/types/match.ts
// ==========================================

export type EventType = 'KILL' | 'TOWER' | 'COLOSSUS' | 'WATCHER' | 'START' | 'LEVELUP' | 'RECALL_CANCEL';

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

export interface VisualEffect {
  id: string;
  type: 'PROJECTILE' | 'EXPLOSION' | 'AREA' | 'HIT';
  x: number;
  y: number;
  targetX?: number; 
  targetY?: number; 
  color: string;
  size: number;
  duration: number; 
  maxDuration: number; 
}

export interface LivePlayer {
  name: string; 
  heroId: string;
  kills: number; deaths: number; assists: number;
  gold: number; // 현재 소지금 (아이템 사면 줄어듦)
  totalGold: number; // [신규] 누적 획득 골드 (통계용)
  cs: number;
  currentHp: number; maxHp: number;
  currentMp: number; maxMp: number; mpRegen: number;
  level: number; items: any[]; 
  totalDamageDealt: number;
  x: number; y: number; lane: 'TOP' | 'MID' | 'BOT' | 'JUNGLE';
  buffs: string[]; mmr: number; respawnTimer: number;
  cooldowns?: { q:number, w:number, e:number, r:number };
  stats: { brain: number, mechanics: number };
  lastAttackTime?: number;       
  lastAttackedTargetId?: string;
  killStreak: number; bounty: number;
  isRecalling: boolean; currentRecallTime: number; recallCooldown: number;
  activeSkill?: { key: 'q' | 'w' | 'e' | 'r'; timestamp: number; };
}

export interface TowerStatus { top: number; mid: number; bot: number; }

export interface TeamStats {
  towers: TowerStatus; 
  laneHealth: { top: number; mid: number; bot: number };
  colossus: number; watcher: number; fury: number;
  nexusHp: number; maxNexusHp: number;
  activeBuffs: { siegeUnit: boolean; voidPower: boolean; voidBuffEndTime?: number; };
}

export interface LiveMatch {
  id: string;
  status: 'DRAFTING' | 'PLAYING' | 'ENDED';
  draft?: any;
  blueTeam: LivePlayer[]; redTeam: LivePlayer[];
  bans: { blue: string[]; red: string[]; };
  startTime: number; duration: number; currentDuration: number; avgTier: string;
  score: { blue: number, red: number };
  stats: { blue: TeamStats; red: TeamStats; };
  timeline: TimelineEvent[]; logs: GameLog[];
  
  nextColossusSpawnTime?: number;
  nextWatcherSpawnTime?: number;
  objectives: {
      colossus: { hp: number; maxHp: number; status: 'ALIVE'|'DEAD'; nextSpawnTime: number };
      watcher: { hp: number; maxHp: number; status: 'ALIVE'|'DEAD'; nextSpawnTime: number };
  };
  minions: any[];
  projectiles: any[];
  jungleMobs: any[];
  visualEffects: VisualEffect[];
}
