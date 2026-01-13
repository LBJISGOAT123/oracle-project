import { Hero, UserStatus, TierStat, TierConfig, Tier, UserProfile } from '../../types';
import { userPool, getUserTierName } from './UserManager';

const safeDiv = (num: number, den: number) => (!den || den === 0 ? 0 : num / den);

export function analyzeHeroMeta(heroes: Hero[]): Hero[] {
  // [Safety] 데이터가 없으면 즉시 종료
  if (!heroes || !Array.isArray(heroes) || heroes.length === 0) return [];

  // 안전한 접근을 위한 맵핑
  const totalGlobalPicks = heroes.reduce((sum, h) => sum + (h?.record?.totalPicks || 0), 0);
  const totalGlobalGames = Math.max(1, Math.floor(totalGlobalPicks / 10));

  const scoredHeroes = heroes.map(h => {
    if (!h) return null; // 영웅 데이터 깨짐 방지

    const r = h.record || { 
      totalMatches: 0, totalWins: 0, recentResults: [], totalBans: 0, 
      totalPicks: 0, totalKills: 0, totalDeaths: 0, totalAssists: 0, 
      totalDamage: 0, totalDamageTaken: 0, totalCs: 0, totalGold: 0 
    };
    
    const matches = Math.max(1, r.totalMatches);
    const totalWinRate = matches > 0 ? (r.totalWins / matches) * 100 : 0;
    
    const recentResults = Array.isArray(r.recentResults) ? r.recentResults : [];
    const recentCount = recentResults.length;
    let recentWinRate = 50;
    if (recentCount > 0) {
        const recentWins = recentResults.filter(win => win).length;
        recentWinRate = (recentWins / recentCount) * 100;
    }

    let weightedWinRate = (totalWinRate * 0.7) + (recentWinRate * 0.3);
    if (isNaN(weightedWinRate)) weightedWinRate = 50;

    if (matches < 2000) {
       const factor = matches / 2000;
       weightedWinRate = (weightedWinRate * factor) + (50 * (1 - factor));
    }

    let winScore = (weightedWinRate - 50) * 4.0;
    const banRate = (r.totalBans / totalGlobalGames) * 100;
    const banScore = isNaN(banRate) ? 0 : banRate * 0.8;
    const pickRate = (r.totalPicks / totalGlobalGames) * 100;
    let pickScore = isNaN(pickRate) ? 0 : pickRate * 0.3;

    if (weightedWinRate < 49) { pickScore *= 0.5; winScore -= 5; }
    if (weightedWinRate < 47) winScore -= 10;
    if (weightedWinRate < 45) winScore -= 20;

    const opScore = winScore + banScore + pickScore;

    const k = safeDiv(r.totalKills, matches);
    const d = safeDiv(r.totalDeaths, matches);
    const a = safeDiv(r.totalAssists, matches);
    const kdaVal = d < 1 ? (k + a) : (k + a) / d;

    return {
      ...h,
      recentWinRate: weightedWinRate, 
      pickRate: pickRate || 0,
      banRate: banRate || 0,
      opScore: opScore || 0, 
      avgKda: `${k.toFixed(1)}/${d.toFixed(1)}/${a.toFixed(1)}`,
      kdaRatio: kdaVal.toFixed(2),
      avgDpm: Math.floor((r.totalDamage / matches) / 20).toLocaleString(),
      avgDpg: Math.floor((r.totalDamageTaken / matches) / 20).toLocaleString(),
      avgCs: (r.totalCs / matches).toFixed(1),
      avgGold: Math.floor(r.totalGold / matches).toLocaleString(),
    };
  }).filter(h => h !== null) as Hero[];

  scoredHeroes.sort((a, b) => ((b as any).opScore || 0) - ((a as any).opScore || 0));

  return scoredHeroes.map((h, index) => {
    const rank = index + 1;
    const score = (h as any).opScore || 0;
    let tier: Tier = '3';

    if (score >= 80 && rank <= 4) tier = 'OP';
    else if (score >= 40) tier = '1';
    else if (score >= 15) tier = '2';
    else if (score >= -5) tier = '3';
    else if (score >= -30) tier = '4';
    else tier = '5';

    if (rank >= 46) tier = '5'; 
    else if (rank >= 41 && tier !== '5') tier = '4';

    return { ...h, rank, tier };
  });
}

export function calculateUserEcosystem(ccu: number, totalUsers: number, config: TierConfig): UserStatus {
  // [Safety] 유저 데이터가 없거나 깨져있으면 기본값 반환
  if (!userPool || !Array.isArray(userPool)) {
      return { totalGames: 0, playingUsers: 0, queuingUsers: 0, avgWaitTime: 0, tierDistribution: [] };
  }

  const cfg = config || { master: 4800, ace: 3800, joker: 3200, gold: 2100, silver: 1300, bronze: 300 };

  const playingUsers = userPool.filter(u => u && u.status === 'INGAME').length;
  const queuingUsers = userPool.filter(u => u && (u.status === 'QUEUE' || u.status === 'IDLE')).length;
  
  const tiers: TierStat[] = [
    { name: '천상계', minScore: 9999, color: '#00bfff', count: 0, percent: 0 },
    { name: '마스터', minScore: cfg.master || 4800, color: '#9b59b6', count: 0, percent: 0 },
    { name: '에이스', minScore: cfg.ace || 3800, color: '#e74c3c', count: 0, percent: 0 },
    { name: '조커', minScore: cfg.joker || 3200, color: '#2ecc71', count: 0, percent: 0 },
    { name: '골드', minScore: cfg.gold || 2100, color: '#f1c40f', count: 0, percent: 0 },
    { name: '실버', minScore: cfg.silver || 1300, color: '#95a5a6', count: 0, percent: 0 },
    { name: '브론즈', minScore: cfg.bronze || 300, color: '#d35400', count: 0, percent: 0 },
    { name: '아이언', minScore: 0, color: '#7f8c8d', count: 0, percent: 0 },
  ];

  userPool.forEach(u => {
    if (!u) return;
    const score = typeof u.score === 'number' ? u.score : 0;
    
    let assigned = false;
    if (u.isChallenger) {
        tiers[0].count++;
        assigned = true;
    } else {
        for (let i = 1; i < tiers.length; i++) { 
            if (score >= tiers[i].minScore) { 
                tiers[i].count++; 
                assigned = true; 
                break; 
            } 
        }
    }
    
    if (!assigned) tiers[tiers.length - 1].count++;
  });

  const totalTracked = Math.max(1, userPool.length);
  tiers.forEach(t => { t.percent = parseFloat(((t.count / totalTracked) * 100).toFixed(1)); });

  return { 
    totalGames: Math.floor(playingUsers / 10), 
    playingUsers, 
    queuingUsers, 
    avgWaitTime: Math.max(5, Math.floor(120 / ((queuingUsers / 10) + 1))), 
    tierDistribution: tiers 
  };
}
