// ==========================================
// FILE PATH: /src/engine/match/phases/GrowthPhase.ts
// ==========================================
import { LiveMatch, BattleSettings, Hero } from '../../../types';
import { calculateTotalStats } from '../ItemManager';
import { getLevelScaledStats } from '../calculators/PowerCalculator';

const getRequiredExpForLevel = (level: number): number => {
  if (level >= 18) return 999999;
  return 250 + (level * 90) + (Math.pow(level, 2) * 5);
};

export const processGrowthPhase = (
  match: LiveMatch, 
  battleSettings: BattleSettings, 
  heroes: Hero[], 
  dt: number
) => {
  const allPlayers = [...match.blueTeam, ...match.redTeam];

  allPlayers.forEach(p => {
    const heroData = heroes.find(h => h.id === p.heroId);
    if (!heroData) return;

    if ((p as any).exp === undefined) (p as any).exp = 0;
    const oldLevel = p.level;

    // [밸런스] 초당 패시브 골드: 2.1G (LoL 기준)
    p.gold += (2.1 * dt); 

    // [기능 유지] 피지컬/뇌지컬에 따른 CS/운영 보너스
    const csChance = 0.13 + (p.stats.mechanics / 2000); 
    const macroBonus = 1.0 + (p.stats.brain / 1000); 

    let gainExp = 0;

    if (p.lane === 'JUNGLE') {
        // [밸런스] 정글러 성장 수치 조정
        if (Math.random() < (0.045 * macroBonus * dt)) { 
            p.cs += 4;
            p.gold += 75 * macroBonus; 
            gainExp = 160;
            p.currentHp -= Math.max(0, (25 - p.level)); // 정글링 피관리 로직 유지
        }
    } else {
        // [밸런스] 라이너 CS 수치 조정
        if (Math.random() < (csChance * dt)) { 
            p.cs++;
            p.gold += 21 * macroBonus; 
            gainExp = 65;
        }
    }

    // 경험치 가중치
    gainExp += (2.5 * dt); 
    (p as any).exp += gainExp;

    const reqExp = getRequiredExpForLevel(p.level);
    if ((p as any).exp >= reqExp && p.level < 18) {
        (p as any).exp -= reqExp;
        p.level++;
    }

    // [기능 유지] 레벨업 시 스탯 갱신 및 체력 회복
    if (p.level > oldLevel) {
        const scaledBaseStats = getLevelScaledStats(heroData.stats, p.level);
        const totalStats = calculateTotalStats({ ...heroData, stats: scaledBaseStats }, p.items);

        const oldMaxHp = p.maxHp;
        p.maxHp = totalStats.hp;
        const healAmount = (p.maxHp - oldMaxHp) + (p.maxHp * 0.3); // 레벨업 시 체력 보너스 유지
        p.currentHp = Math.min(p.maxHp, p.currentHp + healAmount);

        if (Math.random() < 0.1) {
            match.logs.push({
                time: Math.floor(match.currentDuration),
                message: `🆙 [${heroData.name}] ${p.level}레벨 달성!`,
                type: 'LEVELUP',
                team: match.blueTeam.includes(p) ? 'BLUE' : 'RED'
            });
        }
    }

    // [킬 유도] 체력 재생은 낮추고 라인전 압박(피해량)은 유지하여 킬각을 만듦
    if (p.currentHp < p.maxHp) {
        p.currentHp = Math.min(p.maxHp, p.currentHp + (heroData.stats.regen * 0.2 * dt));
    }
    if (Math.random() < (0.18 * dt)) {
        p.currentHp -= (15 + p.level * 3); 
    }

    // [기능 유지] 뇌지컬 기반 귀환/쇼핑 판단
    const recallThreshold = 0.12 + (p.stats.brain / 1000); 
    const needsShopping = p.gold > 2800;
    const isLowHp = p.currentHp > 0 && p.currentHp < p.maxHp * recallThreshold;

    if (needsShopping || isLowHp) {
        p.currentHp = p.maxHp; 
    }
    if (p.currentHp > p.maxHp) p.currentHp = p.maxHp;
  });
};