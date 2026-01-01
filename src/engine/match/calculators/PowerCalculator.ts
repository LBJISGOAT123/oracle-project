// ==========================================
// FILE PATH: /src/engine/match/calculators/PowerCalculator.ts
// ==========================================
import { Hero, LivePlayer, SkillDetail, RoleSettings, HeroStats, Item } from '../../../types';
import { calculateTotalStats } from '../ItemManager';
import { applyRoleBonus } from '../RoleManager';

export const getLevelScaledStats = (baseStats: HeroStats, level: number): HeroStats => {
  const scale = (val: number, rate: number) => Math.floor(val * (1 + (level - 1) * rate));
  return {
    ...baseStats,
    hp: scale(baseStats.hp, 0.05),        
    ad: scale(baseStats.ad, 0.06),        
    ap: scale(baseStats.ap, 0.06),        
    armor: scale(baseStats.armor, 0.03),  
    baseAtk: scale(baseStats.baseAtk, 0.04),
    regen: scale(baseStats.regen, 0.02),
    pen: scale(baseStats.pen, 0.03),      
  };
};

export const calculateHeroPower = (
  heroId: string, 
  heroes: Hero[], 
  player: LivePlayer, 
  isSiege: boolean, 
  allies: LivePlayer[],
  roleSettings: RoleSettings
) => {
  const hero = heroes.find(h => h.id === heroId);
  if (!hero) return 1000;

  const scaledBaseStats = getLevelScaledStats(hero.stats, player.level);
  const { damageMod, defenseMod } = applyRoleBonus(player, hero.role, isSiege, allies, roleSettings);
  const currentTotalStats = calculateTotalStats({ ...hero, stats: scaledBaseStats }, player.items);

  // 전투력 공식 정밀 조정
  const hpScore = currentTotalStats.hp / 12;
  const atkScore = (currentTotalStats.ad + currentTotalStats.ap) * 2.5;
  const utilScore = currentTotalStats.speed / 6;

  let basePower = (hpScore + atkScore + utilScore) * damageMod * defenseMod;

  // MMR 및 피지컬 보정 (기존 로직 유지)
  const skillMultiplier = 0.85 + (player.mmr / 15000) + (player.stats.mechanics / 1000); 

  return basePower * skillMultiplier;
};