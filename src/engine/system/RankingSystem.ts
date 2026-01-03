// ==========================================
// FILE PATH: /src/engine/system/RankingSystem.ts
// ==========================================
// [수정] ../types -> ../../types
import { Hero, UserStatus, TierStat, TierConfig, Tier } from '../../types';
// [수정] 같은 폴더 내에 있으므로 ./UserManager
import { userPool } from './UserManager';

const safeDiv = (num: number, den: number) => (den <= 0 ? 0 : num / den);

export function analyzeHeroMeta(heroes: Hero[]): Hero[] {
  const totalGlobalPicks = heroes.reduce((sum, h) => sum + h.record.totalPicks, 0);
  const totalGlobalGames = Math.max(1, totalGlobalPicks / 10);

  const analyzed = heroes.map(h => {
    const r = h.record;
    const matches = Math.max(1, r.totalMatches);

    // 베이지안 평활화
    const winRate = ((r.totalWins + 5) / (matches + 10)) * 100;

    const k = safeDiv(r.totalKills, matches);
    const d = safeDiv(r.totalDeaths, matches);
    const a = safeDiv(r.totalAssists, matches);

    const avgDpm = (r.totalDamage / matches) / 25; 
    const avgDpg = (r.totalDamageTaken / matches) / 25;
    const avgCs = r.totalCs / matches;
    const avgGold = r.totalGold / matches;

    return {
      ...h,
      recentWinRate: winRate,
      pickRate: (r.totalPicks / totalGlobalGames) * 100,
      banRate: (r.totalBans / totalGlobalGames) * 100,
      avgKda: `${k.toFixed(1)}/${d.toFixed(1)}/${a.toFixed(1)}`,
      kdaRatio: safeDiv(k + a, d).toFixed(2),
      avgDpm: Math.floor(avgDpm).toLocaleString(),
      avgDpg: Math.floor(avgDpg).toLocaleString(),
      avgCs: avgCs.toFixed(1),
      avgGold: Math.floor(avgGold).toLocaleString(),
    };
  });

  analyzed.sort((a, b) => b.recentWinRate - a.recentWinRate);

  return analyzed.map((h, index) => {
    const rank = index + 1;
    const total = analyzed.length;
    let tier: Tier = '3';
    const percent = (rank / total) * 100;
    if (percent <= 8) tier = 'OP';
    else if (percent <= 25) tier = '1';
    else if (percent <= 50) tier = '2';
    else if (percent <= 75) tier = '3';
    else if (percent <= 90) tier = '4';
    else tier = '5';
    return { ...h, rank, tier };
  });
}

export function calculateUserEcosystem(ccu: number, totalUsers: number, config: TierConfig): UserStatus {
  const playingUsers = userPool.filter(u => u.status === 'INGAME').length;
  const queuingUsers = userPool.filter(u => u.status === 'QUEUE' || u.status === 'IDLE').length;
  const tiers: TierStat[] = [
    { name: '천상계', minScore: 9999, color: '#00bfff', count: 0, percent: 0 },
    { name: '마스터', minScore: config.master, color: '#9b59b6', count: 0, percent: 0 },
    { name: '에이스', minScore: config.ace, color: '#e74c3c', count: 0, percent: 0 },
    { name: '조커', minScore: config.joker, color: '#2ecc71', count: 0, percent: 0 },
    { name: '골드', minScore: config.gold, color: '#f1c40f', count: 0, percent: 0 },
    { name: '실버', minScore: config.silver, color: '#95a5a6', count: 0, percent: 0 },
    { name: '브론즈', minScore: config.bronze, color: '#d35400', count: 0, percent: 0 },
    { name: '아이언', minScore: 0, color: '#7f8c8d', count: 0, percent: 0 },
  ];
  userPool.forEach(u => {
    let assigned = false;
    for (const t of tiers) { if (u.score >= t.minScore) { t.count++; assigned = true; break; } }
    if (!assigned) tiers[tiers.length - 1].count++;
  });
  const totalTracked = userPool.length || 1;
  tiers.forEach(t => { t.percent = parseFloat(((t.count / totalTracked) * 100).toFixed(1)); });
  return { totalGames: Math.floor(playingUsers / 10), playingUsers, queuingUsers, avgWaitTime: Math.max(5, Math.floor(120 / (queuingUsers / 10 + 1))), tierDistribution: tiers };
}