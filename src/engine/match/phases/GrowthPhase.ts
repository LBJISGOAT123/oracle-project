// ==========================================
// FILE PATH: /src/engine/match/phases/GrowthPhase.ts
// ==========================================
import { LiveMatch, BattleSettings, Hero, BattlefieldSettings } from '../../../types';
import { calculateTotalStats } from '../systems/ItemManager';
import { getLevelScaledStats } from '../systems/PowerCalculator';

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

  // 정글 설정
  const jgGold = fieldSettings?.jungle?.gold ?? 80;
  const jgXp = fieldSettings?.jungle?.xp ?? 160;

  allPlayers.forEach(p => {
    if (p.respawnTimer > 0) return; // 죽은 자는 말이 없다

    const heroData = heroes.find(h => h.id === p.heroId);
    if (!heroData) return;

    // 1. 기본 회복 (체력/마나)
    const regen = p.mpRegen || 5;
    if (p.currentMp < p.maxMp) p.currentMp = Math.min(p.maxMp, p.currentMp + (regen * dt));
    if (p.currentHp < p.maxHp) p.currentHp = Math.min(p.maxHp, p.currentHp + (heroData.stats.regen * 0.2 * dt));

    // 2. 자연 골드 (초당 2G)
    p.gold += (2.0 * dt);

    // 3. CS 및 정글링 (능력치 기반 확률)
    const farmingSpeed = 1 + (p.stats.mechanics / 2000) + (p.level * 0.05);
    let csRatePerSec = 0;

    if (p.lane === 'JUNGLE') {
        csRatePerSec = 0.2 * farmingSpeed; // 정글 속도

        if (Math.random() < csRatePerSec * dt) {
            p.cs += 1;
            p.gold += jgGold;
            (p as any).exp = ((p as any).exp || 0) + jgXp;
            p.currentHp -= Math.max(0, (30 - p.level * 2)); // 체력 소모
        }
    } else {
        // 라인 CS 속도
        csRatePerSec = 0.25 * farmingSpeed; 

        if (Math.random() < csRatePerSec * dt) {
            p.cs += 1;
            p.gold += 21; // 미니언 골드
            (p as any).exp = ((p as any).exp || 0) + 60;
        }
    }

    // 4. 레벨업 처리
    const reqExp = getRequiredExpForLevel(p.level);
    if ((p as any).exp >= reqExp && p.level < 18) {
        (p as any).exp -= reqExp;
        p.level++;

        // 레벨업 스탯 갱신
        const oldMaxHp = p.maxHp;

        // [오타 수정 완료] scaledStats로 변수명 통일
        const scaledStats = getLevelScaledStats(heroData.stats, p.level);
        const totalStats = calculateTotalStats({ ...heroData, stats: scaledStats }, p.items);

        p.maxHp = totalStats.hp;
        p.maxMp = (scaledStats as any).mp || (300 + p.level * 40);

        // 체력 비율 유지 + 레벨업 보너스
        p.currentHp += (p.maxHp - oldMaxHp) + 100; 
        p.currentMp += 100;

        match.logs.push({
            time: Math.floor(match.currentDuration),
            message: `🆙 [${heroData.name}] ${p.level}레벨 달성!`,
            type: 'LEVELUP',
            team: match.blueTeam.includes(p) ? 'BLUE' : 'RED'
        });
    }

    // 5. 귀환 로직 (우물)
    const isLowHp = p.currentHp < p.maxHp * 0.2; 
    const isLowMp = p.currentMp < p.maxMp * 0.1; 
    const hasLotsOfGold = p.gold > 2000; 

    if ((isLowHp || isLowMp || hasLotsOfGold) && Math.random() < 0.1 * dt) {
        p.currentHp = p.maxHp;
        p.currentMp = p.maxMp;
    }
  });
};