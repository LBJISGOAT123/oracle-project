import { Hero, LivePlayer, RoleSettings, HeroStats } from '../../../types';
// [수정] 순환 참조 제거 (StatUtils 사용)
import { getLevelScaledStats, calculateTotalStats } from '../utils/StatUtils';
import { applyRoleBonus } from './RoleManager';

// getLevelScaledStats는 StatUtils로 이동했으므로 export만 다시 해줍니다 (하위 호환성)
export { getLevelScaledStats } from '../utils/StatUtils';

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

  const hpScore = currentTotalStats.hp / 12;
  const atkScore = (currentTotalStats.ad + currentTotalStats.ap) * 2.5;
  const utilScore = currentTotalStats.speed / 6;

  let basePower = (hpScore + atkScore + utilScore) * damageMod * defenseMod;
  const skillMultiplier = 0.85 + (player.mmr / 15000) + (player.stats.mechanics / 1000); 

  return basePower * skillMultiplier;
};
