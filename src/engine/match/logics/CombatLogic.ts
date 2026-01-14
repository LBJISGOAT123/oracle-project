// ==========================================
// FILE PATH: /src/engine/match/logics/CombatLogic.ts
// ==========================================
import { LiveMatch, LivePlayer, RoleSettings, BattleSettings, Hero, EconomySettings } from '../../../types';
import { getDistance } from '../../data/MapData';
import { applyRoleBonus } from '../systems/RoleManager';
import { useGameStore } from '../../../store/useGameStore';

export const MINION_REWARD = {
    'MELEE': { gold: 21, xp: 60 },
    'RANGED': { gold: 14, xp: 30 },
    'SIEGE': { gold: 60, xp: 90 },
    'SUMMONED_COLOSSUS': { gold: 150, xp: 200 }
};

export const calcMitigatedDamage = (rawDmg: number, armor: number) => {
  const reduction = 100 / (100 + armor);
  return rawDmg * reduction;
};

// [영웅 vs 영웅] 데미지 계산
export const calculateHeroDamage = (
    attacker: any, defender: any, atkStats: any, defStats: any, attackerHero: any, 
    isBlue: boolean, settings: BattleSettings, roleSettings: RoleSettings, buffType: string
) => {
    // 1. 공격력 계산
    const god = isBlue ? settings.dante : settings.izman;
    const atkRatio = god?.atkRatio || 1.0;
    const itemAD = attacker.items.reduce((s:number, i:any) => s + (i.ad||0), 0);
    const totalAD = (atkStats.baseAtk + atkStats.ad + itemAD) * atkRatio;

    // 2. 크리티컬
    const itemCrit = attacker.items.reduce((s:number, i:any) => s + (i.crit||0), 0);
    let isCrit = Math.random() < (atkStats.crit + itemCrit) / 100;
    let rawDmg = totalAD * (isCrit ? 1.85 : 1.0);

    // 3. 방어력 적용
    const defGod = isBlue ? settings.izman : settings.dante; 
    const defRatio = defGod?.defRatio || 1.0;
    const itemArmor = defender.items.reduce((s:number, i:any) => s + (i.armor||0), 0);
    const totalArmor = (defStats.armor + itemArmor) * defRatio;
    const itemPen = attacker.items.reduce((s:number, i:any) => s + (i.pen||0), 0);
    const effectiveArmor = Math.max(0, totalArmor - (atkStats.pen + itemPen));
    
    let finalDamage = calcMitigatedDamage(rawDmg, effectiveArmor);
    const { damageMod } = applyRoleBonus(attacker, attackerHero.role, false, [], roleSettings);
    finalDamage *= damageMod;

    if (attacker.buffs && attacker.buffs.includes('WATCHER_BUFF')) {
        finalDamage *= 1.2; 
    }
    if (buffType === 'COMBAT') finalDamage *= 1.1; 

    // [핵심 1] 최소 데미지 보장 (방어력 높아도 최소 10%는 박힘)
    finalDamage = Math.max(finalDamage, rawDmg * 0.1);

    // [핵심 2] 처형(Execution) 로직
    // 이번 데미지로 적 체력이 5% 미만으로 남게 된다면? -> 그냥 즉사시킴 (Overkill)
    // 예: 체력 100 남았는데 데미지가 95 들어감 -> 5 남기고 살려두지 말고 죽임.
    const remainingHp = defender.currentHp - finalDamage;
    const executeThreshold = defender.maxHp * 0.05; // 최대 체력의 5%

    if (remainingHp > 0 && remainingHp < executeThreshold) {
        // "어차피 죽을 운명" -> 데미지를 뻥튀기해서 확실히 죽임
        finalDamage += remainingHp + 1; 
    }

    return Math.floor(finalDamage);
};

// [영웅 -> 미니언] 데미지 계산
export const calculateUnitDamage = (
    attacker: any, atkStats: any, targetUnit: any, isBlue: boolean, settings: BattleSettings
) => {
    const god = isBlue ? settings.dante : settings.izman;
    const atkRatio = god?.atkRatio || 1.0;
    const itemAD = attacker.items.reduce((s:number, i:any) => s + (i.ad||0), 0);
    const totalAD = (atkStats.baseAtk + atkStats.ad + itemAD) * atkRatio;

    let dmgMod = 1.0;
    if (targetUnit.type === 'SUMMONED_COLOSSUS') {
        const colSettings = useGameStore.getState().gameState.fieldSettings.colossus;
        const percent = colSettings.dmgFromHero !== undefined ? colSettings.dmgFromHero : 100;
        dmgMod = (percent / 100);
    }
    if (attacker.buffs && attacker.buffs.includes('WATCHER_BUFF')) {
        dmgMod *= 1.2;
    }

    const targetArmor = targetUnit.armor || 0;
    const finalDmg = calcMitigatedDamage(totalAD, targetArmor) * dmgMod;
    return Math.floor(finalDmg);
};

// 보상 분배 (Reward Distribution)
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
            if (nearestAlly) { nearestAlly.gold += reward.gold; nearestAlly.cs++; }
        }
    }

    const allies = killerTeam === 'BLUE' ? match.blueTeam : match.redTeam;
    const beneficiaries = allies.filter(p => p.currentHp > 0 && p.respawnTimer <= 0 && getDistance(p, deadUnitPos) < 18);

    if (beneficiaries.length > 0) {
        const xpPerPerson = Math.floor(reward.xp / beneficiaries.length);
        beneficiaries.forEach(p => { (p as any).exp = ((p as any).exp || 0) + xpPerPerson; });
    }
};

// 어시스트 분배 (Assist)
export const distributeAssist = (match: LiveMatch, killer: LivePlayer, victim: LivePlayer, isBlue: boolean) => {
    const allies = isBlue ? match.blueTeam : match.redTeam;
    const assists = allies.filter(p => p !== killer && p.currentHp > 0 && getDistance(p, victim) < 25);
    
    const economy = useGameStore.getState().gameState.battleSettings.economy;
    const baseReward = 150; // 기본 어시스트 골드

    assists.forEach(p => {
        p.assists++;
        p.gold += baseReward; 
        (p as any).exp = ((p as any).exp || 0) + 100;
    });
};
