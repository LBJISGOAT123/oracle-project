// ==========================================
// FILE PATH: /src/engine/UserManager.ts
// ==========================================

import { Hero, UserProfile, MatchHistory, TierConfig, UserHeroStat } from '../types';
import { generateUserName } from '../utils/nameGenerator';

const registeredNames = new Set<string>();

const HOURLY_ACTIVITY_RATES = [
  0.15, 0.10, 0.05, 0.03, 0.02, 0.05, 
  0.10, 0.15, 0.20, 0.25, 0.25, 0.30, 
  0.35, 0.35, 0.40, 0.40, 0.45, 0.50, 
  0.55, 0.60, 0.65, 0.60, 0.50, 0.40 
];

export class UserAgent {
  id: number; name: string; score: number; hiddenMmr: number;
  preferredLane: 'TOP' | 'JUNGLE' | 'MID' | 'BOT'; 
  preferredHeroes: string[]; 
  wins: number; losses: number; 
  history: MatchHistory[];
  status: 'IDLE' | 'QUEUE' | 'INGAME' | 'OFFLINE' | 'RESTING';
  restTimer: number;
  heroStats: Record<string, UserHeroStat>; 
  mainHeroId: string; 
  activityBias: number; 

  // [신규 필드 추가]
  promoStatus: { targetTier: string; wins: number; losses: number; targetWins: number; } | null = null;
  rank: number = 0;
  isChallenger: boolean = false;

  constructor(id: number, heroes: Hero[]) {
    this.id = id;
    this.score = 0;
    this.wins = 0; this.losses = 0;
    this.history = [];
    this.status = 'OFFLINE';
    this.restTimer = 0;
    this.heroStats = {};

    this.activityBias = (Math.random() * 0.2) - 0.1;

    let tempName = generateUserName(id);
    let attempts = 0;
    while (registeredNames.has(tempName) && attempts < 5) {
      tempName = generateUserName(id + attempts * 1000); 
      attempts++;
    }
    if (registeredNames.has(tempName)) tempName = `${tempName}#${id}`; 
    registeredNames.add(tempName);
    this.name = tempName;

    this.hiddenMmr = 1000 + (Math.random() * 1000) + (Math.random() * 1000);

    const lanes = ['TOP', 'JUNGLE', 'MID', 'BOT'];
    this.preferredLane = lanes[Math.floor(Math.random() * lanes.length)] as any;

    const myRoleHeroes = heroes.filter(h => this.isHeroForLane(h, this.preferredLane));
    const poolSize = Math.min(myRoleHeroes.length, 3 + Math.floor(Math.random() * 3));
    this.preferredHeroes = myRoleHeroes
      .sort(() => Math.random() - 0.5)
      .slice(0, poolSize)
      .map(h => h.id);

    if (this.preferredHeroes.length === 0) {
        this.preferredHeroes = [heroes[0].id];
    }

    this.mainHeroId = this.preferredHeroes[0];
  }

  private isHeroForLane(hero: Hero, lane: string) {
    if (lane === 'TOP') return hero.role === '수호기사' || hero.role === '집행관';
    if (lane === 'MID') return hero.role === '선지자' || hero.role === '추적자';
    if (lane === 'BOT') return hero.role === '신살자';
    if (lane === 'JUNGLE') return hero.role === '추적자' || hero.role === '집행관';
    return true;
  }

  getTierName(config?: TierConfig) {
    const defaults = { challengerRank: 50, challenger: 9999, master: 4800, ace: 3800, joker: 3200, gold: 2100, silver: 1300, bronze: 300, promoMatches: 3 };
    const cfg = config || defaults;

    // [수정] 챌린저 판별 로직: 플래그 확인
    if (this.isChallenger) return '천상계';

    // 나머지는 점수 기반
    if (this.score >= cfg.master) return '마스터';
    if (this.score >= cfg.ace) return '에이스';
    if (this.score >= cfg.joker) return '조커';
    if (this.score >= cfg.gold) return '골드';
    if (this.score >= cfg.silver) return '실버';
    if (this.score >= cfg.bronze) return '브론즈';
    return '아이언';
  }

  pickHero(heroes: Hero[]): string {
    if (Math.random() < 0.7 && this.preferredHeroes.length > 0) {
      return this.preferredHeroes[Math.floor(Math.random() * this.preferredHeroes.length)];
    }
    return heroes[Math.floor(Math.random() * heroes.length)].id;
  }

  shouldBeOnline(hour: number): boolean {
    const baseRate = HOURLY_ACTIVITY_RATES[hour] || 0.3;
    const finalRate = Math.min(0.95, Math.max(0.01, baseRate + this.activityBias));
    return Math.random() < finalRate;
  }
}

export const userPool: UserAgent[] = [];

export function getTierNameHelper(score: number, config: TierConfig) {
  if (score >= 9999) return '천상계'; // 임시 (UserAgent 내부 로직이 정확함)
  if (score >= config.master) return '마스터';
  if (score >= config.ace) return '에이스';
  if (score >= config.joker) return '조커';
  if (score >= config.gold) return '골드';
  if (score >= config.silver) return '실버';
  if (score >= config.bronze) return '브론즈';
  return '아이언';
}

export function initUserPool(heroes: Hero[], count: number = 3000) {
  const startId = userPool.length;
  if (count > userPool.length) {
    const newUsersCount = count - userPool.length;
    const newUsers = Array.from({ length: newUsersCount }, (_, i) => new UserAgent(startId + i, heroes));
    userPool.push(...newUsers);
  }
}

export function updateUserActivity(hour: number, heroes: Hero[]) {
  userPool.forEach(u => {
    if (u.status === 'INGAME') return; 

    if (u.status === 'RESTING') {
      u.restTimer -= 1;
      if (u.restTimer <= 0) u.status = 'IDLE';
      return;
    }

    const wantsToPlay = u.shouldBeOnline(hour);

    if (u.status === 'OFFLINE' && wantsToPlay) {
        u.status = 'IDLE';
    } 
    else if ((u.status === 'IDLE' || u.status === 'QUEUE') && !wantsToPlay) {
        if (Math.random() < 0.2) { 
            u.status = 'OFFLINE';
        }
    }
  });
}

export function getTopRankers(heroes: Hero[], config: TierConfig): UserProfile[] {
  const sorted = [...userPool].sort((a, b) => b.score - a.score || a.id - b.id);

  return sorted.slice(0, 50).map(u => {
    let mostPlayedId = u.mainHeroId;
    let maxGames = -1;

    Object.entries(u.heroStats).forEach(([hid, stat]) => {
      if (stat.matches > maxGames) {
        maxGames = stat.matches;
        mostPlayedId = hid;
      }
    });

    return {
      id: u.id, 
      name: u.name, 
      mainHeroId: mostPlayedId, 
      score: u.score, 
      tier: u.getTierName(config), 
      winRate: u.wins + u.losses > 0 ? (u.wins / (u.wins + u.losses)) * 100 : 0,
      totalGames: u.wins + u.losses, 
      history: u.history || [],
      heroStats: u.heroStats, 
      preferredLane: u.preferredLane,
      laneStats: [],
      mostChamps: [],
      promoStatus: u.promoStatus // [추가]
    };
  });
}

export function getUsersInTier(tierName: string, config: TierConfig): UserProfile[] {
  return userPool
    .filter(u => u.getTierName(config) === tierName)
    .sort((a, b) => b.score - a.score)
    .map(u => ({
      id: u.id, name: u.name, mainHeroId: u.mainHeroId, score: u.score,
      tier: tierName, winRate: (u.wins/(u.wins+u.losses))*100 || 0,
      totalGames: u.wins+u.losses, history: u.history || [],
      heroStats: u.heroStats,
      preferredLane: u.preferredLane,
      laneStats: [],
      mostChamps: [],
      promoStatus: u.promoStatus // [추가]
    }));
}

export function findUserProfileByName(name: string, config: TierConfig): UserProfile | null {
  const user = userPool.find(u => u.name === name);

  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    mainHeroId: user.mainHeroId,
    score: user.score,
    tier: user.getTierName(config),
    winRate: user.wins + user.losses > 0 ? (user.wins / (user.wins + user.losses)) * 100 : 0,
    totalGames: user.wins + user.losses,
    history: user.history || [],
    heroStats: user.heroStats,
    preferredLane: user.preferredLane,
    laneStats: [],
    mostChamps: [],
    promoStatus: user.promoStatus // [추가]
  };
}