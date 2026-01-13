// ==========================================
// FILE PATH: /src/engine/match/systems/DamageCalculator.ts
// ==========================================
import { BattleSettings, RoleSettings } from '../../../types';
import { applyRoleBonus } from './RoleManager';

export const calcMitigatedDamage = (rawDmg: number, armor: number) => {
  const reduction = 100 / (100 + armor);
  return rawDmg * reduction;
};

// [영웅 vs 영웅] 데미지 계산
export const calculateHeroDamage = (
    attacker: any, defender: any, atkStats: any, defStats: any, attackerHero: any, 
    isBlue: boolean, settings: BattleSettings, roleSettings: RoleSettings, buffType: string
) => {
    // 1. 공격력
    const god = isBlue ? settings.dante : settings.izman;
    const atkRatio = god?.atkRatio || 1.0;
    const itemAD = attacker.items.reduce((s:number, i:any) => s + (i.ad||0), 0);
    const totalAD = (atkStats.baseAtk + atkStats.ad + itemAD) * atkRatio;

    // 2. 크리티컬
    const itemCrit = attacker.items.reduce((s:number, i:any) => s + (i.crit||0), 0);
    let isCrit = Math.random() < (atkStats.crit + itemCrit) / 100;
    let rawDmg = totalAD * (isCrit ? 1.75 : 1.0);

    // 3. 방어력
    const defGod = isBlue ? settings.izman : settings.dante; 
    const defRatio = defGod?.defRatio || 1.0;
    const itemArmor = defender.items.reduce((s:number, i:any) => s + (i.armor||0), 0);
    const totalArmor = (defStats.armor + itemArmor) * defRatio;
    
    // 관통
    const itemPen = attacker.items.reduce((s:number, i:any) => s + (i.pen||0), 0);
    const effectiveArmor = Math.max(0, totalArmor - (atkStats.pen + itemPen));
    
    // 4. 최종 데미지
    const finalDamage = calcMitigatedDamage(rawDmg, effectiveArmor);
    
    // 5. 역할군/버프 보정
    const { damageMod } = applyRoleBonus(attacker, attackerHero.role, false, [], roleSettings);
    let result = finalDamage * damageMod;

    if (buffType === 'COMBAT') result *= 1.1; 

    // [핵심 수정] 과잉 킬 방지를 위해 영웅 간 데미지 30% 감소
    // 전투가 길어지게 하여 도망칠 기회를 줌
    return Math.floor(result * 0.7);
};

// [영웅 -> 미니언] 데미지 계산 (너프 없음)
export const calculateUnitDamage = (
    attacker: any, atkStats: any, targetArmor: number, isBlue: boolean, settings: BattleSettings
) => {
    const god = isBlue ? settings.dante : settings.izman;
    const atkRatio = god?.atkRatio || 1.0;
    const itemAD = attacker.items.reduce((s:number, i:any) => s + (i.ad||0), 0);
    const totalAD = (atkStats.baseAtk + atkStats.ad + itemAD) * atkRatio;

    return Math.floor(calcMitigatedDamage(totalAD, targetArmor));
};
