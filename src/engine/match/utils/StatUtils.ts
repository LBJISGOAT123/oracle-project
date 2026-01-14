// ==========================================
// FILE PATH: /src/engine/match/utils/StatUtils.ts
// ==========================================
import { HeroStats, Item, Hero, GrowthIntervals } from '../../../types';
import { useGameStore } from '../../../store/useGameStore';

export const getLevelScaledStats = (baseStats: HeroStats, level: number): HeroStats => {
  const state = useGameStore.getState().gameState;
  const defaults = { early: 5, mid: 10, late: 15 };
  const g = state?.growthSettings || { 
      hp: defaults, ad: defaults, ap: defaults, 
      armor: {early:2,mid:3,late:4}, baseAtk: {early:2,mid:3,late:4}, regen: {early:1,mid:2,late:2} 
  };

  const getMultiplier = (targetLevel: number, intervals: GrowthIntervals) => {
    if (targetLevel <= 1) return 0;
    
    let totalPercent = 0;
    // 2레벨부터 현재 레벨까지 누적 계산
    for (let i = 2; i <= targetLevel; i++) {
        if (i <= 6) totalPercent += intervals.early;       
        else if (i <= 12) totalPercent += intervals.mid;   
        else totalPercent += intervals.late;               
    }
    return totalPercent / 100;
  };

  const scale = (val: number, intervals: GrowthIntervals) => {
    if (!intervals) return val;
    const multiplier = getMultiplier(level, intervals);
    return Math.floor(val * (1 + multiplier));
  };

  return {
    ...baseStats,
    hp: scale(baseStats.hp, g.hp),        
    ad: scale(baseStats.ad, g.ad),        
    ap: scale(baseStats.ap, g.ap),        
    armor: scale(baseStats.armor, g.armor),  
    baseAtk: scale(baseStats.baseAtk, g.baseAtk),
    regen: scale(baseStats.regen, g.regen),
    pen: baseStats.pen, 
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
