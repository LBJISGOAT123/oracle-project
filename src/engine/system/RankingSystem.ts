// ==========================================
// FILE PATH: /src/engine/system/RankingSystem.ts
// ==========================================
import { Hero, UserStatus, TierStat, TierConfig, Tier } from '../../types';
import { userPool } from './UserManager';

const safeDiv = (num: number, den: number) => (den <= 0 ? 0 : num / den);

export function analyzeHeroMeta(heroes: Hero[]): Hero[] {
  const totalGlobalPicks = heroes.reduce((sum, h) => sum + h.record.totalPicks, 0);
  const totalGlobalGames = Math.max(1, Math.floor(totalGlobalPicks / 10));

  const scoredHeroes = heroes.map(h => {
    const r = h.record;
    const matches = Math.max(1, r.totalMatches);

    // [1] 승률 계산 (하이브리드)
    const totalWinRate = (r.totalWins / matches) * 100;
    const recentCount = r.recentResults.length;
    let recentWinRate = 50;
    if (recentCount > 0) {
        const recentWins = r.recentResults.filter(win => win).length;
        recentWinRate = (recentWins / recentCount) * 100;
    }

    // 통산 7 : 최근 3
    let weightedWinRate = (totalWinRate * 0.7) + (recentWinRate * 0.3);

    // 표본 부족 시 50% 수렴 (보정)
    if (matches < 2000) {
       const factor = matches / 2000;
       weightedWinRate = (weightedWinRate * factor) + (50 * (1 - factor));
    }

    // ---------------------------------------------------------
    // [2] OP 스코어 계산 (하위권 변별력 강화)
    // ---------------------------------------------------------
    
    // 1. 승률 점수
    let winScore = (weightedWinRate - 50) * 4.0;

    // 2. 밴률 점수
    const banRate = (r.totalBans / totalGlobalGames) * 100;
    const banScore = banRate * 0.8;

    // 3. 픽률 점수
    const pickRate = (r.totalPicks / totalGlobalGames) * 100;
    let pickScore = pickRate * 0.3;

    // ▼▼▼ [핵심 수정] 하위권 벌점 강화 ▼▼▼
    // 승률이 낮을수록 점수를 가혹하게 깎습니다.
    if (weightedWinRate < 49) {
        pickScore *= 0.5; // 인기 점수 반토막
        winScore -= 5;    // 기본 감점
    }
    if (weightedWinRate < 47) {
        winScore -= 10;   // 추가 감점 (4티어행)
    }
    if (weightedWinRate < 45) {
        winScore -= 20;   // 대폭 감점 (5티어행)
    }
    // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

    const opScore = winScore + banScore + pickScore;

    const k = safeDiv(r.totalKills, matches);
    const d = safeDiv(r.totalDeaths, matches);
    const a = safeDiv(r.totalAssists, matches);
    const kdaVal = d < 1 ? (k + a) : (k + a) / d;

    return {
      ...h,
      recentWinRate: recentWinRate, 
      pickRate: pickRate,
      banRate: banRate,
      opScore: opScore, 
      
      avgKda: `${k.toFixed(1)}/${d.toFixed(1)}/${a.toFixed(1)}`,
      kdaRatio: kdaVal.toFixed(2),
      avgDpm: Math.floor((r.totalDamage / matches) / 20).toLocaleString(),
      avgDpg: Math.floor((r.totalDamageTaken / matches) / 20).toLocaleString(),
      avgCs: (r.totalCs / matches).toFixed(1),
      avgGold: Math.floor(r.totalGold / matches).toLocaleString(),
    };
  });

  // 점수 정렬
  // @ts-ignore
  scoredHeroes.sort((a, b) => b.opScore - a.opScore);

  // ---------------------------------------------------------
  // [3] 티어 커트라인 (기준 점수 상향 조정)
  // ---------------------------------------------------------
  return scoredHeroes.map((h, index) => {
    const rank = index + 1;
    const score = (h as any).opScore;

    let tier: Tier = '3';

    // OP: 80점 이상 & 4위 이내
    if (score >= 80 && rank <= 4) tier = 'OP';
    
    // 1티어: 40점 이상
    else if (score >= 40) tier = '1';
    
    // 2티어: 15점 이상
    else if (score >= 15) tier = '2';
    
    // 3티어: -5점 이상 (기존 -15점에서 상향 -> 커트라인 빡세짐)
    else if (score >= -5) tier = '3';
    
    // 4티어: -30점 이상
    else if (score >= -30) tier = '4';
    
    // 5티어: 그 외 (나락)
    else tier = '5';

    // [안전장치] 랭킹 최하위권 강제 강등 (점수랑 상관없이 꼴찌면 5티어)
    if (rank >= 46) tier = '5'; 
    else if (rank >= 41 && tier !== '5') tier = '4';

    return { ...h, rank, tier };
  });
}

// (userEcosystem 함수 기존 유지)
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
    for (const t of tiers) { 
      if (u.score >= t.minScore) { t.count++; assigned = true; break; } 
    }
    if (!assigned) tiers[tiers.length - 1].count++;
  });

  const totalTracked = userPool.length || 1;
  tiers.forEach(t => { t.percent = parseFloat(((t.count / totalTracked) * 100).toFixed(1)); });

  return { 
    totalGames: Math.floor(playingUsers / 10), 
    playingUsers, 
    queuingUsers, 
    avgWaitTime: Math.max(5, Math.floor(120 / (queuingUsers / 10 + 1))), 
    tierDistribution: tiers 
  };
}