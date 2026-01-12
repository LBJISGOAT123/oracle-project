import { HeroStats, Item, Hero } from '../../../types';

export const getLevelScaledStats = (baseStats: HeroStats, level: number): HeroStats => {
  const scale = (val: number, rate: number) => Math.floor(val * (1 + (level - 1) * rate));
  return {
    ...baseStats,
    hp: scale(baseStats.hp, 0.05),        
    ad: scale(baseStats.ad, 0.15),        
    ap: scale(baseStats.ap, 0.15),        
    armor: scale(baseStats.armor, 0.03),  
    baseAtk: scale(baseStats.baseAtk, 0.04),
    regen: scale(baseStats.regen, 0.02),
    pen: scale(baseStats.pen, 0.03),      
  };
};

export const calculateTotalStats = (hero: Hero, items: Item[]): HeroStats => {
  let stats = { ...hero.stats };
  
  items.forEach(item => {
    stats.ad += (item.ad || 0);
    stats.ap += (item.ap || 0);
    stats.hp += (item.hp || 0);
    stats.mp += (item.mp || 0);
    stats.armor += (item.armor || 0);
    stats.crit += (item.crit || 0);
    stats.speed += (item.speed || 0);
    stats.regen += (item.regen || 0);
    stats.mpRegen += (item.mpRegen || 0);
    stats.pen += (item.pen || 0);
  });
  
  return stats;
};
