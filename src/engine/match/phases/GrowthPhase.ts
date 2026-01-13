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

    // 2. 자연 골드/경험치
    p.gold += (3.0 * dt);
    
    // [수정] 자연 경험치 2배 상향 (2.0 -> 4.0)
    // 킬이 많이 나와서 라인 경험치를 못 먹는 상황을 보정합니다.
    (p as any).exp = ((p as any).exp || 0) + (4.0 * dt);

    // 3. 레벨업 처리
    let reqExp = getRequiredExpForLevel(p.level);
    
    while ((p as any).exp >= reqExp && p.level < 18) {
        (p as any).exp -= reqExp;
        p.level++;

        const oldMaxHp = p.maxHp;
        const oldMaxMp = p.maxMp;

        updateLivePlayerStats(p, heroData);

        p.currentHp += (p.maxHp - oldMaxHp) + 100; 
        p.currentMp += (p.maxMp - oldMaxMp) + 100;

        match.logs.push({
            time: Math.floor(match.currentDuration),
            message: `🆙 [${heroData.name}] ${p.level}레벨 달성!`,
            type: 'LEVELUP',
            team: match.blueTeam.includes(p) ? 'BLUE' : 'RED'
        });

        reqExp = getRequiredExpForLevel(p.level);
    }

    // 4. 비상 귀환 (유지)
    const isLowHp = p.currentHp < p.maxHp * 0.2; 
    const isLowMp = p.currentMp < p.maxMp * 0.1; 
    const hasLotsOfGold = p.gold > 2000; 

    if ((isLowHp || isLowMp || hasLotsOfGold) && Math.random() < 0.1 * dt) {
        p.currentHp += p.maxHp * 0.05 * dt; 
    }
  });
};
