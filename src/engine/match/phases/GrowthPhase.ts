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
    if (p.totalGold === undefined) p.totalGold = p.gold;

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

    // [핵심] 재생 시 Max 값을 넘지 않도록 Math.min 적용
    if (p.currentMp < p.maxMp) {
        p.currentMp = Math.min(p.maxMp, p.currentMp + (mpRegen * dt));
    }
    if (p.currentHp < p.maxHp) {
        p.currentHp = Math.min(p.maxHp, p.currentHp + (hpRegen * dt));
    }

    const passiveGold = 2.0 * dt;
    p.gold += passiveGold;
    p.totalGold += passiveGold;
    
    (p as any).exp = ((p as any).exp || 0) + (6.0 * dt);

    let reqExp = getRequiredExpForLevel(p.level);
    while ((p as any).exp >= reqExp && p.level < 18) {
        (p as any).exp -= reqExp;
        p.level++;

        const oldMaxHp = p.maxHp;
        const oldMaxMp = p.maxMp;

        updateLivePlayerStats(p, heroData);

        // 레벨업 즉시 회복 (이때도 Max 넘지 않게 주의)
        const hpGain = (p.maxHp - oldMaxHp) + 300;
        const mpGain = (p.maxMp - oldMaxMp) + 150;
        
        p.currentHp = Math.min(p.maxHp, p.currentHp + hpGain);
        p.currentMp = Math.min(p.maxMp, p.currentMp + mpGain);

        match.logs.push({
            time: Math.floor(match.currentDuration),
            message: `🆙 [${heroData.name}] ${p.level}레벨 달성!`,
            type: 'LEVELUP',
            team: match.blueTeam.includes(p) ? 'BLUE' : 'RED'
        });

        reqExp = getRequiredExpForLevel(p.level);
    }
  });
};
