export interface MatchHistory {
  season: number; result: 'WIN' | 'LOSE' | 'PROMO WIN' | 'PROMO LOSS'; 
  heroName: string; kda: string; lpChange: number; date: string;
}

export interface UserHeroStat {
  matches: number; wins: number; kills: number; deaths: number; assists: number;
}

// [신규] 유저 성향 타입 정의
export type PlayStyle = 'WORKER' | 'STUDENT' | 'NIGHT_OWL' | 'HARDCORE';

export interface UserProfile {
  id: number; name: string; 
  score: number; tier: string; rank: number; isChallenger: boolean;
  promoStatus: { targetTier: string; wins: number; losses: number; targetWins: number; } | null;

  winRate: number; totalGames: number; wins: number; losses: number;
  
  mainHeroId: string; preferredLane: 'TOP' | 'JUNGLE' | 'MID' | 'BOT'; preferredHeroes: string[];
  brain: number; mechanics: number; hiddenMmr: number; 
  
  // [신규 속성: AI 행동 패턴용]
  playStyle: PlayStyle;      // 유저 성향 (접속 시간대 결정)
  activityBias: number;      // 접속 빈도 가중치 (높을수록 자주 접속)
  tiredness: number;         // 현재 세션에서 플레이한 게임 수
  sessionTarget: number;     // 이번 접속에서 플레이할 목표 게임 수

  status: 'IDLE' | 'QUEUE' | 'INGAME' | 'OFFLINE' | 'RESTING';
  restTimer: number;

  history: MatchHistory[]; heroStats: Record<string, UserHeroStat>;
  mostChamps?: any[]; laneStats?: any[];
}

export interface TierConfig {
  challengerRank: number; master: number; ace: number; joker: number;
  gold: number; silver: number; bronze: number;
  promos?: { master: number; ace: number; joker: number; gold: number; silver: number; bronze: number; };
}

export interface TierStat { name: string; minScore: number; count: number; percent: number; color: string; }
export interface UserStatus {
  totalGames: number; playingUsers: number; queuingUsers: number; avgWaitTime: number; tierDistribution: TierStat[];
}
