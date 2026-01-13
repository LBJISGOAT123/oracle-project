export interface MatchHistory {
  season: number; 
  result: 'WIN' | 'LOSE' | 'PROMO WIN' | 'PROMO LOSS'; 
  heroName: string; 
  kda: string; 
  lpChange: number; 
  date: string;
}

export interface UserHeroStat {
  matches: number; 
  wins: number; 
  kills: number; 
  deaths: number; 
  assists: number;
}

export interface UserProfile {
  // [기본 정보]
  id: number; 
  name: string; 
  
  // [랭크 정보]
  score: number; 
  tier: string; // 로직 없이 바로 표시 가능한 텍스트
  rank: number;
  isChallenger: boolean;
  promoStatus: { targetTier: string; wins: number; losses: number; targetWins: number; } | null;

  // [통계]
  winRate: number; 
  totalGames: number;
  wins: number;
  losses: number;
  
  // [플레이 성향]
  mainHeroId: string;
  preferredLane: 'TOP' | 'JUNGLE' | 'MID' | 'BOT'; 
  preferredHeroes: string[];
  brain: number;      // 뇌지컬 (구 draftIq)
  mechanics: number;  // 피지컬
  hiddenMmr: number;
  activityBias: number; // 접속 시간대 편향치

  // [상태]
  status: 'IDLE' | 'QUEUE' | 'INGAME' | 'OFFLINE' | 'RESTING';
  restTimer: number;

  // [기록]
  history: MatchHistory[];
  heroStats: Record<string, UserHeroStat>;
  
  // [UI용 캐시 데이터] (옵션)
  mostChamps?: any[]; 
  laneStats?: any[];
}

export interface TierConfig {
  challengerRank: number;
  master: number; ace: number; joker: number;
  gold: number; silver: number; bronze: number;
  promos?: { master: number; ace: number; joker: number; gold: number; silver: number; bronze: number; };
}

export interface TierStat {
  name: string; minScore: number; count: number; percent: number; color: string;
}

export interface UserStatus {
  totalGames: number; playingUsers: number; queuingUsers: number; avgWaitTime: number;
  tierDistribution: TierStat[];
}
