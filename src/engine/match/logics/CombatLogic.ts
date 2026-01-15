// ==========================================
// FILE PATH: /src/engine/match/logics/CombatLogic.ts
// ==========================================
import { LiveMatch, LivePlayer, RoleSettings, BattleSettings, Hero } from '../../../types';
import { getDistance } from '../../data/MapData';
import { applyRoleBonus } from '../systems/RoleManager';

export const MINION_REWARD = {
    'MELEE': { gold: 21, xp: 60 },
    'RANGED': { gold: 14, xp: 30 },
    'SIEGE': { gold: 60, xp: 90 },
    'SUMMONED_COLOSSUS': { gold: 150, xp: 200 }
};

export const calcMitigatedDamage = (rawDmg: number, armor: number) => {
  // [안전 장치] armor가 NaN이거나 음수면 0 취급
  const safeArmor = isNaN(armor) ? 0 : Math.max(0, armor);
  const reduction = 100 / (100 + safeArmor);
  return rawDmg * reduction;
};

export const calculateHeroDamage = (
    attacker: any, defender: any, atkStats: any, defStats: any, attackerHero: any, 
    isBlue: boolean, settings: BattleSettings, roleSettings: RoleSettings, buffType: string
) => {
    // 1. 공격력 (NaN 방지)
    const god = isBlue ? settings.dante : settings.izman;
    const atkRatio = god?.atkRatio || 1.0;
    
    // 아이템 스탯 안전 합산
    const itemAD = (attacker.items || []).reduce((s:number, i:any) => s + (i.ad || 0), 0);
    const baseAtk = atkStats.baseAtk || 50;
    const adStat = atkStats.ad || 0;
    
    const totalAD = (baseAtk + adStat + itemAD) * atkRatio;

    // 2. 크리티컬
    const itemCrit = (attacker.items || []).reduce((s:number, i:any) => s + (i.crit || 0), 0);
    const critChance = (atkStats.crit || 0) + itemCrit;
    
    let isCrit = Math.random() < (critChance / 100);
    let rawDmg = totalAD * (isCrit ? 1.85 : 1.0);

    // 3. 방어력
    const defGod = isBlue ? settings.izman : settings.dante; 
    const defRatio = defGod?.defRatio || 1.0;
    const itemArmor = (defender.items || []).reduce((s:number, i:any) => s + (i.armor || 0), 0);
    const defArmor = defStats.armor || 0;
    
    const totalArmor = (defArmor + itemArmor) * defRatio;
    
    // 관통
    const itemPen = (attacker.items || []).reduce((s:number, i:any) => s + (i.pen || 0), 0);
    const penStat = atkStats.pen || 0;
    const effectiveArmor = Math.max(0, totalArmor - (penStat + itemPen));
    
    // 4. 최종 데미지
    const finalDamage = calcMitigatedDamage(rawDmg, effectiveArmor);
    
    // 5. 역할군/버프 보정
    const { damageMod } = applyRoleBonus(attacker, attackerHero.role, false, [], roleSettings);
    let result = finalDamage * damageMod;

    if (buffType === 'COMBAT') result *= 1.1; 

    // [최종 안전 장치] NaN이면 최소 데미지 1 반환
    if (isNaN(result) || result < 0) return 1;

    return Math.floor(result * 0.85);
};

export const calculateUnitDamage = (
    attacker: any, atkStats: any, targetArmor: number, isBlue: boolean, settings: BattleSettings
) => {
    const god = isBlue ? settings.dante : settings.izman;
    const atkRatio = god?.atkRatio || 1.0;
    const itemAD = (attacker.items || []).reduce((s:number, i:any) => s + (i.ad || 0), 0);
    
    const baseAtk = atkStats.baseAtk || 50;
    const adStat = atkStats.ad || 0;
    const totalAD = (baseAtk + adStat + itemAD) * atkRatio;

    const safeArmor = isNaN(targetArmor) ? 0 : targetArmor;
    const dmg = calcMitigatedDamage(totalAD, safeArmor);
    
    return isNaN(dmg) ? 10 : Math.floor(dmg);
};

export const distributeRewards = (
    match: LiveMatch, 
    deadUnitPos: {x:number, y:number}, 
    killer: LivePlayer | null, 
    killerTeam: 'BLUE'|'RED', 
    reward: { gold: number, xp: number },
    heroes: Hero[] 
) => {
    if (killer) {
        killer.cs++;
        killer.gold += reward.gold;
        if (isNaN(killer.totalGold)) killer.totalGold = killer.gold;
        killer.totalGold += reward.gold;

        const killerHero = heroes.find(h => h.id === killer.heroId);
        if (killerHero && killerHero.role === '수호기사') {
            const allies = killerTeam === 'BLUE' ? match.blueTeam : match.redTeam;
            let nearestAlly = null;
            let minDist = 15;
            for (const ally of allies) {
                if (ally !== killer && ally.currentHp > 0) {
                    const d = getDistance(killer, ally);
                    if (d < minDist) { minDist = d; nearestAlly = ally; }
                }
            }
            if (nearestAlly) {
                nearestAlly.gold += reward.gold;
                nearestAlly.totalGold += reward.gold;
                nearestAlly.cs++;
            }
        }
    }
    
    const allies = killerTeam === 'BLUE' ? match.blueTeam : match.redTeam;
    const beneficiaries = allies.filter(p => p.currentHp > 0 && p.respawnTimer <= 0 && getDistance(p, deadUnitPos) < 18);

    if (beneficiaries.length > 0) {
        const xpPerPerson = Math.floor(reward.xp / beneficiaries.length);
        beneficiaries.forEach(p => {
            (p as any).exp = ((p as any).exp || 0) + xpPerPerson;
        });
    }
};

export const distributeAssist = (match: LiveMatch, killer: LivePlayer, victim: LivePlayer, isBlue: boolean) => {
    const allies = isBlue ? match.blueTeam : match.redTeam;
    const assists = allies.filter(p => p !== killer && p.currentHp > 0 && getDistance(p, victim) < 20);
    
    assists.forEach(p => {
        p.assists++;
        p.gold += 150; 
        p.totalGold += 150;
        (p as any).exp = ((p as any).exp || 0) + 100;
    });
};
