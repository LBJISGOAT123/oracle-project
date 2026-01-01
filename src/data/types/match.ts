// ==========================================
// FILE PATH: /src/data/types/match.ts
// ==========================================

export type EventType = 'KILL' | 'TOWER' | 'COLOSSUS' | 'WATCHER' | 'START';

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
  level: number;
  items: string[];
  x: number; 
  y: number;
  lane: 'TOP' | 'MID' | 'BOT' | 'JUNGLE';
}

// [수정됨] 포탑을 라인별로 관리하기 위해 구조 변경
export interface TowerStatus {
  top: number; // 0 ~ 3 (파괴된 단계)
  mid: number;
  bot: number;
}

export interface TeamStats {
  towers: TowerStatus; // [변경] number -> TowerStatus
  colossus: number;
  watcher: number;
  fury: number;
}

export interface LiveMatch {
  id: string;
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
}