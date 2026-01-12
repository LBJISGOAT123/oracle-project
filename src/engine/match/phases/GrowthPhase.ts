// ==========================================
// FILE PATH: /src/engine/match/phases/GrowthPhase.ts
// ==========================================
import { LiveMatch, BattleSettings, Hero, BattlefieldSettings } from '../../../types';
import { updateLivePlayerStats } from '../systems/ItemManager';

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

  const jgGold = fieldSettings?.jungle?.gold ?? 80;
  const jgXp = fieldSettings?.jungle?.xp ?? 160;

  allPlayers.forEach(p => {
    if (p.respawnTimer > 0) return;

    const heroData = heroes.find(h => h.id === p.heroId);
    if (!heroData) return;

    // 1. 기본 회복
    const mpRegen = p.mpRegen || 5;
    const hpRegen = (p as any).hpRegen || heroData.stats.regen; 

    if (p.currentMp < p.maxMp) {
        p.currentMp = Math.min(p.maxMp, p.currentMp + (mpRegen * dt));
    }
    if (p.currentHp < p.maxHp) {
        p.currentHp = Math.min(p.maxHp, p.currentHp + (hpRegen * dt));
    }

    // 2. 자연 골드
    p.gold += (2.0 * dt);

    // 3. CS 및 정글링
    const farmingSpeed = 1 + (p.stats.mechanics / 2000) + (p.level * 0.05);
    
    if (p.lane === 'JUNGLE') {
        const csRatePerSec = 0.2 * farmingSpeed;
        if (Math.random() < csRatePerSec * dt) {
            p.cs += 1;
            p.gold += jgGold;
            (p as any).exp = ((p as any).exp || 0) + jgXp;
            p.currentHp -= Math.max(0, (30 - p.level * 2)); 
        }
    } else {
        const csRatePerSec = 0.25 * farmingSpeed;
        if (Math.random() < csRatePerSec * dt) {
            p.cs += 1;
            p.gold += 21;
            (p as any).exp = ((p as any).exp || 0) + 60;
        }
    }

    // 4. 레벨업 처리 (Issue #6 해결: while 루프 사용)
    let reqExp = getRequiredExpForLevel(p.level);
    
    while ((p as any).exp >= reqExp && p.level < 18) {
        (p as any).exp -= reqExp;
        p.level++;

        const oldMaxHp = p.maxHp;
        const oldMaxMp = p.maxMp;

        // 스탯 재계산
        updateLivePlayerStats(p, heroData);

        // 체력/마나 회복 및 증가분 반영
        p.currentHp += (p.maxHp - oldMaxHp) + 100; 
        p.currentMp += (p.maxMp - oldMaxMp) + 100;

        match.logs.push({
            time: Math.floor(match.currentDuration),
            message: `🆙 [${heroData.name}] ${p.level}레벨 달성!`,
            type: 'LEVELUP',
            team: match.blueTeam.includes(p) ? 'BLUE' : 'RED'
        });

        // 다음 레벨 요구치 갱신
        reqExp = getRequiredExpForLevel(p.level);
    }

    // 5. 귀환 로직
    const isLowHp = p.currentHp < p.maxHp * 0.2; 
    const isLowMp = p.currentMp < p.maxMp * 0.1; 
    const hasLotsOfGold = p.gold > 2000; 

    if ((isLowHp || isLowMp || hasLotsOfGold) && Math.random() < 0.1 * dt) {
        p.currentHp = p.maxHp;
        p.currentMp = p.maxMp;
    }
  });
};
