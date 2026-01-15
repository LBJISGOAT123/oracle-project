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
    // 부활 로직
    if (p.respawnTimer > 0) {
        p.respawnTimer -= dt;
        p.isRecalling = false;
        p.currentRecallTime = 0;
        
        if (p.respawnTimer <= 0) {
            p.respawnTimer = 0;
            const heroData = heroes.find(h => h.id === p.heroId);
            if (heroData) updateLivePlayerStats(p, heroData);
            p.currentHp = p.maxHp;
            p.currentMp = p.maxMp;
            
            if (match.blueTeam.includes(p)) { p.x = 5; p.y = 95; } 
            else { p.x = 95; p.y = 5; }
            (p as any).pathIdx = 0;
            (p as any)._prevHp = p.maxHp;
        }
        return; 
    }

    const heroData = heroes.find(h => h.id === p.heroId);
    if (!heroData) return;

    const mpRegen = p.mpRegen || 5;
    const hpRegen = (p as any).hpRegen || heroData.stats.regen; 

    if (p.currentMp < p.maxMp) p.currentMp = Math.min(p.maxMp, p.currentMp + (mpRegen * dt));
    if (p.currentHp < p.maxHp) p.currentHp = Math.min(p.maxHp, p.currentHp + (hpRegen * dt));

    // [밸런스 패치] 자연 골드 대폭 하향 (3.5 -> 1.5)
    // 10분에 900골드 정도만 자연 획득
    p.gold += (1.5 * dt);
    
    (p as any).exp = ((p as any).exp || 0) + (3.0 * dt);

    // 레벨업
    let reqExp = getRequiredExpForLevel(p.level);
    while ((p as any).exp >= reqExp && p.level < 18) {
        (p as any).exp -= reqExp;
        p.level++;

        const oldMaxHp = p.maxHp;
        const oldMaxMp = p.maxMp;

        updateLivePlayerStats(p, heroData);

        p.currentHp += (p.maxHp - oldMaxHp) + 200; 
        p.currentMp += (p.maxMp - oldMaxMp) + 100;

        match.logs.push({
            time: Math.floor(match.currentDuration),
            message: `🆙 [${heroData.name}] ${p.level}레벨 달성!`,
            type: 'LEVELUP',
            team: match.blueTeam.includes(p) ? 'BLUE' : 'RED'
        });

        reqExp = getRequiredExpForLevel(p.level);
    }

    // 비상 귀환 힌트
    const isLowHp = p.currentHp < p.maxHp * 0.2; 
    const isLowMp = p.currentMp < p.maxMp * 0.1; 
    const hasLotsOfGold = p.gold > 2500; 

    if ((isLowHp || isLowMp || hasLotsOfGold) && Math.random() < 0.1 * dt) {
        // ...
    }
  });
};
