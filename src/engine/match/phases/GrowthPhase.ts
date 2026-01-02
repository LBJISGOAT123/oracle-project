// ==========================================
// FILE PATH: /src/engine/match/phases/GrowthPhase.ts
// ==========================================
import { LiveMatch, BattleSettings, Hero, BattlefieldSettings } from '../../../types';
import { calculateTotalStats } from '../ItemManager';
import { getLevelScaledStats } from '../calculators/PowerCalculator';

const getRequiredExpForLevel = (level: number): number => {
  if (level >= 18) return 999999;
  return 250 + (level * 90) + (Math.pow(level, 2) * 5);
};

export const processGrowthPhase = (
  match: LiveMatch, 
  battleSettings: BattleSettings,
  fieldSettings: BattlefieldSettings,
  heroes: Hero[], 
  dt: number
) => {
  const allPlayers = [...match.blueTeam, ...match.redTeam];

  // 정글 설정 로드
  const jgGold = fieldSettings?.jungle?.gold ?? 80;
  const jgXp = fieldSettings?.jungle?.xp ?? 160;
  const yieldMod = (fieldSettings?.jungle?.yield ?? 50) / 50; 

  allPlayers.forEach(p => {
    // 죽어있으면 성장/회복 정지
    if (p.respawnTimer > 0) return;

    const heroData = heroes.find(h => h.id === p.heroId);
    if (!heroData) return;

    if ((p as any).exp === undefined) (p as any).exp = 0;
    const oldLevel = p.level;

    // [신규] 마나 자연 회복 (기본값 5 보장)
    const regen = p.mpRegen || 5;
    if (p.currentMp < p.maxMp) {
       p.currentMp = Math.min(p.maxMp, p.currentMp + (regen * dt));
    }

    // 초당 패시브 골드
    p.gold += (2.1 * dt); 

    const csChance = 0.13 + (p.stats.mechanics / 2000); 
    const macroBonus = 1.0 + (p.stats.brain / 1000); 

    let gainExp = 0;

    // CS 및 정글링
    if (p.lane === 'JUNGLE') {
        if (Math.random() < (0.045 * macroBonus * yieldMod * dt)) { 
            p.cs += 4;
            p.gold += jgGold * macroBonus;
            gainExp = jgXp;
            p.currentHp -= Math.max(0, (25 - p.level)); // 정글링 체력 소모
        }
    } else {
        if (Math.random() < (csChance * dt)) { 
            p.cs++;
            p.gold += 21 * macroBonus; 
            gainExp = 65;
        }
    }

    // 시간 흐름 경험치
    gainExp += (2.5 * dt); 
    (p as any).exp += gainExp;

    // 레벨업 처리
    const reqExp = getRequiredExpForLevel(p.level);
    if ((p as any).exp >= reqExp && p.level < 18) {
        (p as any).exp -= reqExp;
        p.level++;
    }

    // [수정] 레벨업 시 스탯 갱신 (HP, MP 포함)
    if (p.level > oldLevel) {
        const scaledBaseStats = getLevelScaledStats(heroData.stats, p.level);
        const totalStats = calculateTotalStats({ ...heroData, stats: scaledBaseStats }, p.items);

        // HP 갱신
        const oldMaxHp = p.maxHp;
        p.maxHp = totalStats.hp;
        const healAmount = (p.maxHp - oldMaxHp) + (p.maxHp * 0.3);
        p.currentHp = Math.min(p.maxHp, p.currentHp + healAmount);

        // MP 갱신 (데이터에 mp가 없으면 기본 공식 적용)
        // 기본 마나: 300 + 레벨*40 / 기본 젠: 5 + 레벨*0.5
        p.maxMp = (scaledBaseStats as any).mp || (300 + p.level * 40);
        p.mpRegen = (scaledBaseStats as any).mpRegen || (5 + p.level * 0.5);
        p.currentMp = p.maxMp; // 레벨업 시 마나 풀회복

        if (Math.random() < 0.1) {
            match.logs.push({
                time: Math.floor(match.currentDuration),
                message: `🆙 [${heroData.name}] ${p.level}레벨 달성!`,
                type: 'LEVELUP',
                team: match.blueTeam.includes(p) ? 'BLUE' : 'RED'
            });
        }
    }

    // 체력 자연 회복
    if (p.currentHp < p.maxHp) {
        p.currentHp = Math.min(p.maxHp, p.currentHp + (heroData.stats.regen * 0.2 * dt));
    }
    // 라인전 체력 소모 시뮬레이션
    if (Math.random() < (0.18 * dt)) {
        p.currentHp -= (15 + p.level * 3); 
    }

    // [수정] 귀환 판단 (마나 부족 시에도 귀환)
    const recallThreshold = 0.12 + (p.stats.brain / 1000); 
    const needsShopping = p.gold > 2800;
    const isLowHp = p.currentHp > 0 && p.currentHp < p.maxHp * recallThreshold;
    const isLowMp = p.currentMp < p.maxMp * 0.15; // 마나 15% 미만이면 귀환 고민

    if (needsShopping || isLowHp || isLowMp) {
        // 우물 복귀: 체력/마나 풀회복
        p.currentHp = p.maxHp; 
        p.currentMp = p.maxMp;
    }

    // 오버플로우 방지
    if (p.currentHp > p.maxHp) p.currentHp = p.maxHp;
    if (p.currentMp > p.maxMp) p.currentMp = p.maxMp;
  });
};