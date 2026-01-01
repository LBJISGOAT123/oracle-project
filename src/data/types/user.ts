// src/types/user.ts
export interface MatchHistory {
  season: number; result: 'WIN' | 'LOSE'; heroName: string; kda: string; lpChange: number; date: string;
}
export interface UserProfile {
  id: number; name: string; mainHeroId: string; score: number;
  tier: string; winRate: number; totalGames: number;
  history: MatchHistory[];
  mostChamps: { name: string, winRate: number, kda: string }[];
  laneStats: { role: string, winRate: number }[];
}
export interface TierStat {
  name: string; minScore: number; count: number; percent: number; color: string;
}
export interface UserStatus {
  totalGames: number; playingUsers: number; queuingUsers: number; avgWaitTime: number;
  tierDistribution: TierStat[];
}
export interface TierConfig {
  challenger: number; master: number; ace: number; joker: number;
  gold: number; silver: number; bronze: number;
}