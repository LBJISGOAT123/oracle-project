// ==========================================
// FILE PATH: /src/engine/match/logics/CombatLogic.ts
// ==========================================
import { LiveMatch, LivePlayer, RoleSettings, BattleSettings, Hero } from '../../../types';
import { getDistance } from '../../data/MapData';
import { applyRoleBonus } from '../systems/RoleManager';
import { useGameStore } from '../../../store/useGameStore';

export const MINION_REWARD = {
    'MELEE': { gold: 18, xp: 50 },
    'RANGED': { gold: 12, xp: 25 },
    'SIEGE': { gold: 50, xp: 80 },
    'SUMMONED_COLOSSUS': { gold: 120, xp: 200 }
};

export const calcMitigatedDamage = (rawDmg: number, armor: number) => {
  const reduction = 100 / (100 + armor);
  return rawDmg * reduction;
};

// [영웅 vs 영웅]
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

    // 데미지 계수 0.7 (교전 시간 늘리기)
    return Math.max(1, Math.floor(result * 0.7));
};

// [영웅 -> 미니언]
export const calculateUnitDamage = (
    attacker: any, atkStats: any, targetUnit: any, isBlue: boolean, settings: BattleSettings
) => {
    // ... (기존 로직 유지)
    const god = isBlue ? settings.dante : settings.izman;
    const atkRatio = god?.atkRatio || 1.0;
    const itemAD = attacker.items.reduce((s:number, i:any) => s + (i.ad||0), 0);
    const totalAD = (atkStats.baseAtk + atkStats.ad + itemAD) * atkRatio;

    let dmgMod = 1.0;
    if (targetUnit.type === 'SUMMONED_COLOSSUS') dmgMod = 0.01; // 거신병은 영웅 딜에 내성
    if (attacker.buffs && attacker.buffs.includes('WATCHER_BUFF')) dmgMod *= 1.2;

    const targetArmor = targetUnit.armor || 0;
    const finalDmg = calcMitigatedDamage(totalAD, targetArmor) * dmgMod;
    return Math.floor(finalDmg);
};

// [신규] 미니언 -> 영웅 (미니언 어그로)
export const calculateMinionToHeroDamage = (minion: any, hero: any) => {
    let damage = minion.atk || 20;
    
    // 영웅이 최근에(2초 내) 적 영웅을 공격했으면 미니언이 분노함 (1.5배 데미지)
    // (실제 게임의 미니언 어그로 시스템 모사)
    if (hero.lastAttackTime && (Date.now()/1000 - hero.lastAttackTime) < 2) {
        damage *= 1.5;
    }

    const armor = (hero.level * 3) + 30; // 영웅 방어력 추정
    return calcMitigatedDamage(damage, armor);
};

// 보상 분배
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
        // 서포터 로직 등 기존 유지
    }
    const allies = killerTeam === 'BLUE' ? match.blueTeam : match.redTeam;
    const beneficiaries = allies.filter(p => p.currentHp > 0 && p.respawnTimer <= 0 && getDistance(p, deadUnitPos) < 18);
    if (beneficiaries.length > 0) {
        const xpPerPerson = Math.floor(reward.xp / beneficiaries.length);
        beneficiaries.forEach(p => { (p as any).exp = ((p as any).exp || 0) + xpPerPerson; });
    }
};

// 어시스트 분배
export const distributeAssist = (match: LiveMatch, killer: LivePlayer, victim: LivePlayer, isBlue: boolean) => {
    const allies = isBlue ? match.blueTeam : match.redTeam;
    const assists = allies.filter(p => p !== killer && p.currentHp > 0 && getDistance(p, victim) < 25);
    
    // 어시스트 골드 감소 (100)
    const baseReward = 100; 

    assists.forEach(p => {
        p.assists++;
        p.gold += baseReward; 
        (p as any).exp = ((p as any).exp || 0) + 80;
    });
};
