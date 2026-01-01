// src/data/heroes/helpers.ts
import { HeroSkillSet } from '../../types';

export const getEmptyRecord = () => ({ 
  totalMatches: 0, totalWins: 0, totalPicks: 0, totalBans: 0,
  totalKills: 0, totalDeaths: 0, totalAssists: 0, 
  totalDamage: 0, totalDamageTaken: 0, totalCs: 0, totalGold: 0,
  recentResults: [] 
});

export const getEmptyUI = () => ({
  tier: '3' as const, rank: 0, rankChange: 0,
  recentWinRate: 0, pickRate: 0, banRate: 0,
  avgKda: '0.0/0.0/0.0', kdaRatio: '0.00', 
  avgDpm: '0', avgDpg: '0', avgCs: '0', avgGold: '0'
});

export const fallbackSkills: HeroSkillSet = {
  passive: { name: "기본 능력", mechanic: "NONE", val: 0, adRatio: 0, apRatio: 0, cd: 0, isPassive: true },
  q: { name: "Q 스킬", mechanic: "NONE", val: 100, adRatio: 0.7, apRatio: 0, cd: 8 },
  w: { name: "W 스킬", mechanic: "NONE", val: 80, adRatio: 0.5, apRatio: 0, cd: 12 },
  e: { name: "E 스킬", mechanic: "NONE", val: 60, adRatio: 0.3, apRatio: 0, cd: 15 },
  r: { name: "R 스킬", mechanic: "STUN", val: 400, adRatio: 1.2, apRatio: 0, cd: 100 }
};