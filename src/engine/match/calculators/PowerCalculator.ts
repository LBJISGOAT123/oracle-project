// ==========================================
// FILE PATH: /src/engine/match/calculators/PowerCalculator.ts
// ==========================================

import { Hero, LivePlayer, SkillDetail, RoleSettings } from '../../../types';
import { calculateTotalStats } from '../ItemManager';
import { applyRoleBonus } from '../RoleManager';

// 스킬 위력 계산
const getSkillScore = (skill: SkillDetail, ad: number, ap: number) => {
  let power = skill.val + (skill.adRatio * ad) + (skill.apRatio * ap);

  if (skill.mechanic === 'STUN' || skill.mechanic === 'HOOK') power *= 1.3;
  if (skill.mechanic === 'EXECUTE') power *= 1.4;
  if (skill.mechanic === 'HEAL' || skill.mechanic === 'SHIELD') power *= 1.2;
  if (skill.mechanic === 'GLOBAL') power *= 1.5; 

  const cdrMod = 10 / Math.max(1, skill.cd);
  return power * Math.sqrt(cdrMod); 
};

// 영웅 전투력 계산
export const calculateHeroPower = (
  heroId: string, 
  heroes: Hero[], 
  player: LivePlayer, 
  isSiege: boolean, 
  allies: LivePlayer[],
  roleSettings: RoleSettings // [신규] 설정값 인자
) => {
  const hero = heroes.find(h => h.id === heroId);
  if (!hero) return 1000;

  // [수정] RoleManager에 설정값 전달
  const { damageMod, defenseMod } = applyRoleBonus(player, hero.role, isSiege, allies, roleSettings);

  const s = calculateTotalStats(hero, player.items);

  const defensivePower = s.hp * (1 + (s.armor * defenseMod) / 100);
  const autoAttackDPS = (s.baseAtk + s.ad) * (s.speed / 100) * (1 + s.crit / 100) * damageMod;

  let baseStatsScore = (defensivePower / 10) + (autoAttackDPS * 5);

  const skillScore = 
    (getSkillScore(hero.skills.q, s.ad, s.ap) +
    getSkillScore(hero.skills.w, s.ad, s.ap) +
    getSkillScore(hero.skills.e, s.ad, s.ap) +
    (getSkillScore(hero.skills.r, s.ad, s.ap) * 1.5)) * damageMod;

  const skillMultiplier = 0.8 + (player.mmr / 10000); 

  return (baseStatsScore + skillScore) * skillMultiplier;
};