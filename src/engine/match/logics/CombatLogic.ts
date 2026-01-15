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
  const safeArmor = isNaN(armor) ? 0 : Math.max(0, armor);
  const reduction = 120 / (120 + safeArmor);
  return rawDmg * reduction;
};

export const calculateHeroDamage = (
    attacker: any, defender: any, atkStats: any, defStats: any, attackerHero: any, 
    isBlue: boolean, settings: BattleSettings, roleSettings: RoleSettings, buffType: string
) => {
    // [1] 피지컬 격차 계산 (Outplay Mechanic)
    // mechanics: 0 ~ 100
    const atkMech = attacker.stats?.mechanics || 50;
    const defMech = defender.stats?.mechanics || 50;
    const diff = atkMech - defMech; // 양수면 공격자 우위, 음수면 방어자 우위

    // 피지컬 계수: 차이 10당 5% 데미지 변동 (최대 ±25%)
    // 예: 피지컬 90 vs 50 -> 차이 40 -> 데미지 +20% (학살)
    let outplayMod = 1.0 + (diff * 0.005);
    
    // 최소 0.7배 ~ 최대 1.3배로 제한 (너무 밸붕 방지)
    outplayMod = Math.max(0.7, Math.min(1.3, outplayMod));

    // [2] 공격력 계산
    const god = isBlue ? settings.dante : settings.izman;
    const atkRatio = god?.atkRatio || 1.0;
    
    const itemAD = (attacker.items || []).reduce((s:number, i:any) => s + (i.ad || 0), 0);
    const baseAtk = atkStats.baseAtk || 50;
    const adStat = atkStats.ad || 0;
    const totalAD = (baseAtk + adStat + itemAD) * atkRatio;

    // [3] 치명타 (피지컬이 높으면 급소 타격 확률 증가)
    const itemCrit = (attacker.items || []).reduce((s:number, i:any) => s + (i.crit || 0), 0);
    // 피지컬 10당 치명타율 2% 보너스
    const mechCritBonus = atkMech * 0.2; 
    const critChance = (atkStats.crit || 0) + itemCrit + mechCritBonus;
    
    let isCrit = Math.random() < (critChance / 100);
    // 피지컬이 높으면 치명타 데미지도 증가 (기본 1.75 -> 최대 2.0)
    const critMult = 1.75 + (atkMech > 80 ? 0.25 : 0);
    
    let rawDmg = totalAD * (isCrit ? critMult : 1.0);

    // [4] 방어력
    const defGod = isBlue ? settings.izman : settings.dante; 
    const defRatio = defGod?.defRatio || 1.0;
    const itemArmor = (defender.items || []).reduce((s:number, i:any) => s + (i.armor || 0), 0);
    const defArmor = defStats.armor || 0;
    const totalArmor = (defArmor + itemArmor) * defRatio;
    
    const itemPen = (attacker.items || []).reduce((s:number, i:any) => s + (i.pen || 0), 0);
    const penStat = atkStats.pen || 0;
    const effectiveArmor = Math.max(0, totalArmor - (penStat + itemPen));
    
    const finalDamage = calcMitigatedDamage(rawDmg, effectiveArmor);
    
    const { damageMod } = applyRoleBonus(attacker, attackerHero.role, false, [], roleSettings);
    
    // [5] 최종 적용 (아웃플레이 계수 적용)
    let result = finalDamage * damageMod * outplayMod;

    if (buffType === 'COMBAT') result *= 1.1; 

    if (isNaN(result) || result < 0) return 1;

    return Math.floor(result * 0.95);
};

export const calculateUnitDamage = (
    attacker: any, atkStats: any, targetArmor: number, isBlue: boolean, settings: BattleSettings
) => {
    const god = isBlue ? settings.dante : settings.izman;
    const atkRatio = god?.atkRatio || 1.0;
    const itemAD = attacker.items.reduce((s:number, i:any) => s + (i.ad||0), 0);
    
    const baseAtk = atkStats.baseAtk || 50;
    const adStat = atkStats.ad || 0;
    const totalAD = (baseAtk + adStat + itemAD) * atkRatio;

    const safeArmor = isNaN(targetArmor) ? 0 : targetArmor;
    const dmg = calcMitigatedDamage(totalAD, safeArmor);
    
    // 미니언 막타는 피지컬 좋으면 실수 안 함 (보정)
    const mechBonus = (attacker.stats?.mechanics || 50) > 70 ? 1.2 : 1.0;
    
    return isNaN(dmg) ? 10 : Math.floor(dmg * mechBonus);
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
