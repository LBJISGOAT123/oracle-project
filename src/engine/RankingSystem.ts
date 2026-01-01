// src/engine/RankingSystem.ts
import { Hero, UserStatus, TierStat, TierConfig, Tier } from '../types';
import { userPool } from './UserManager';

/**
 * [헬퍼] 안전한 나눗셈 및 정밀도 제어
 */
const safeDiv = (num: number, den: number) => (den <= 0 ? 0 : num / den);

/**
 * 1. 영웅 메타 분석 엔진
 * record(누적 데이터)를 바탕으로 UI에 표시될 실시간 통계를 산출합니다.
 */
export function analyzeHeroMeta(heroes: Hero[]): Hero[] {
  // 전체 게임 수 (모든 영웅의 판수 합 / 10)
  const totalGlobalPicks = heroes.reduce((sum, h) => sum + h.record.totalPicks, 0);
  const totalGlobalGames = totalGlobalPicks / 10;

  const analyzed = heroes.map(h => {
    const r = h.record;
    const matches = r.totalMatches;

    // A. 승률/픽률/밴률 계산
    const winRate = safeDiv(r.totalWins, matches) * 100;
    const pickRate = safeDiv(r.totalPicks, totalGlobalGames) * 100;
    const banRate = safeDiv(r.totalBans, totalGlobalGames) * 100;

    // B. KDA 계산 (표시용 데이터와 비율 데이터 일치화)
    const k = safeDiv(r.totalKills, matches);
    const d = safeDiv(r.totalDeaths, matches);
    const a = safeDiv(r.totalAssists, matches);

    // 사용자가 보는 소수점 1자리 값으로 캐스팅하여 오차 제거
    const kDisp = parseFloat(k.toFixed(1));
    const dDisp = parseFloat(d.toFixed(1));
    const aDisp = parseFloat(a.toFixed(1));
    const kdaRatio = safeDiv(kDisp + aDisp, dDisp);

    // C. 경제/데미지 지표
    const avgDpm = safeDiv(r.totalDamage, matches);
    const avgDpg = safeDiv(r.totalDamageTaken, matches);
    const avgCs = safeDiv(r.totalCs, matches);
    const avgGold = safeDiv(r.totalGold, matches);

    return {
      ...h,
      recentWinRate: winRate,
      pickRate: pickRate,
      banRate: banRate,
      avgKda: `${kDisp.toFixed(1)}/${dDisp.toFixed(1)}/${aDisp.toFixed(1)}`,
      kdaRatio: kdaRatio.toFixed(2),
      avgDpm: Math.floor(avgDpm).toLocaleString(),
      avgDpg: Math.floor(avgDpg).toLocaleString(),
      avgCs: avgCs.toFixed(1),
      avgGold: Math.floor(avgGold).toLocaleString(),
    };
  });

  // D. 순위 산정 및 티어 배정 (승률 기준 정렬)
  analyzed.sort((a, b) => b.recentWinRate - a.recentWinRate);

  return analyzed.map((h, index) => {
    const rank = index + 1;
    const total = analyzed.length;
    let tier: Tier = '3';

    // 상위 %에 따른 티어 부여
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

/**
 * 2. 유저 생태계 분석 엔진
 * 티어별 인구 분포와 CCU 데이터를 정산합니다.
 */
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

  // 실제 userPool 기반 티어 카운팅
  userPool.forEach(u => {
    const score = u.score;
    let assigned = false;
    for (const t of tiers) {
      if (score >= t.minScore) {
        t.count++;
        assigned = true;
        break;
      }
    }
    if (!assigned) tiers[tiers.length - 1].count++;
  });

  // 비율 계산
  const totalTracked = userPool.length || 1;
  tiers.forEach(t => {
    t.percent = parseFloat(((t.count / totalTracked) * 100).toFixed(1));
  });

  return {
    totalGames: Math.floor(playingUsers / 10),
    playingUsers,
    queuingUsers,
    avgWaitTime: Math.max(5, Math.floor(120 / (queuingUsers / 10 + 1))),
    tierDistribution: tiers
  };
}