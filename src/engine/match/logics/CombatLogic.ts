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
  const reduction = 100 / (100 + armor);
  return rawDmg * reduction;
};

export const distributeRewards = (
    match: LiveMatch, 
    deadUnitPos: {x:number, y:number}, 
    killer: LivePlayer | null, 
    killerTeam: 'BLUE'|'RED', 
    reward: { gold: number, xp: number },
    heroes: Hero[] 
) => {
    // 1. 킬러 보상
    if (killer) {
        killer.cs++;
        killer.gold += reward.gold;

        // [신규] 수호기사(Support) 전용 로직: 타곤산 효과 (Relic Shield)
        // 수호기사가 막타를 쳤다면, 가장 가까운 아군에게도 골드를 복사해줌
        const killerHero = heroes.find(h => h.id === killer.heroId);
        if (killerHero && killerHero.role === '수호기사') {
            const allies = killerTeam === 'BLUE' ? match.blueTeam : match.redTeam;
            // 나를 제외한 가장 가까운 아군 찾기
            let nearestAlly = null;
            let minDist = 15; // 공유 범위
            
            for (const ally of allies) {
                if (ally !== killer && ally.currentHp > 0) {
                    const d = getDistance(killer, ally);
                    if (d < minDist) {
                        minDist = d;
                        nearestAlly = ally;
                    }
                }
            }

            if (nearestAlly) {
                nearestAlly.gold += reward.gold; // 골드 공유
                nearestAlly.cs++; // (선택사항) 원딜 CS도 올려줌 (기분 좋으라고)
            }
        }
    }

    // 2. 경험치 분배 (기존 로직)
    const allies = killerTeam === 'BLUE' ? match.blueTeam : match.redTeam;
    const beneficiaries = allies.filter(p => 
        p.currentHp > 0 && 
        p.respawnTimer <= 0 &&
        getDistance(p, deadUnitPos) < 18 
    );

    if (beneficiaries.length > 0) {
        const xpPerPerson = Math.floor(reward.xp / beneficiaries.length);
        beneficiaries.forEach(p => {
            (p as any).exp = ((p as any).exp || 0) + xpPerPerson;
            
            // (이전의 단순 공유 로직은 위 타곤산 로직과 겹치므로 삭제하거나 유지해도 됨)
            // 여기선 타곤산 로직을 위해 '골드 공유' 부분은 제거하고 경험치만 남김
        });
    }
};

export const distributeAssist = (match: LiveMatch, killer: LivePlayer, victim: LivePlayer, isBlue: boolean) => {
    const allies = isBlue ? match.blueTeam : match.redTeam;
    const assists = allies.filter(p => p !== killer && p.currentHp > 0 && getDistance(p, victim) < 20);
    
    assists.forEach(p => {
        p.assists++;
        p.gold += 150; 
        (p as any).exp = ((p as any).exp || 0) + 100;
    });
};

export const calculateHeroDamage = (
    attacker: any, defender: any, atkStats: any, defStats: any, attackerHero: any, 
    isBlue: boolean, settings: BattleSettings, roleSettings: RoleSettings, buffType: string
) => {
    const god = isBlue ? settings.dante : settings.izman;
    const atkRatio = god?.atkRatio || 1.0;
    const itemAD = attacker.items.reduce((s:number, i:any) => s + (i.ad||0), 0);
    const totalAD = (atkStats.baseAtk + atkStats.ad + itemAD) * atkRatio;

    const itemCrit = attacker.items.reduce((s:number, i:any) => s + (i.crit||0), 0);
    let isCrit = Math.random() < (atkStats.crit + itemCrit) / 100;
    let rawDmg = totalAD * (isCrit ? 1.75 : 1.0);

    const defGod = isBlue ? settings.izman : settings.dante; 
    const defRatio = defGod?.defRatio || 1.0;
    const itemArmor = defender.items.reduce((s:number, i:any) => s + (i.armor||0), 0);
    const totalArmor = (defStats.armor + itemArmor) * defRatio;
    
    const itemPen = attacker.items.reduce((s:number, i:any) => s + (i.pen||0), 0);
    const effectiveArmor = Math.max(0, totalArmor - (atkStats.pen + itemPen));
    
    const finalDamage = calcMitigatedDamage(rawDmg, effectiveArmor);
    
    const { damageMod } = applyRoleBonus(attacker, attackerHero.role, false, [], roleSettings);
    let result = finalDamage * damageMod;

    if (buffType === 'COMBAT') result *= 1.1; 

    return Math.floor(result);
};

export const calculateUnitDamage = (
    attacker: any, atkStats: any, targetArmor: number, isBlue: boolean, settings: BattleSettings
) => {
    const god = isBlue ? settings.dante : settings.izman;
    const atkRatio = god?.atkRatio || 1.0;
    const itemAD = attacker.items.reduce((s:number, i:any) => s + (i.ad||0), 0);
    const totalAD = (atkStats.baseAtk + atkStats.ad + itemAD) * atkRatio;

    return Math.floor(calcMitigatedDamage(totalAD, targetArmor));
};
