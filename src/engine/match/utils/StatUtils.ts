// ==========================================
// FILE PATH: /src/engine/match/utils/StatUtils.ts
// ==========================================
import { HeroStats, Item, Hero, GrowthIntervals } from '../../../types';
import { useGameStore } from '../../../store/useGameStore';

export const getLevelScaledStats = (baseStats: HeroStats, level: number): HeroStats => {
  const state = useGameStore.getState().gameState;
  const g = state?.growthSettings || { 
      hp: {early:3,mid:5,late:7}, 
      ad: {early:5,mid:10,late:15}, 
      ap: {early:5,mid:10,late:15}, 
      armor: {early:2,mid:3,late:4}, 
      baseAtk: {early:2,mid:3,late:4}, 
      regen: {early:1,mid:2,late:3},
      respawnPerLevel: 3.0,
      recallTime: 10.0
  };

  const getMultiplier = (targetLevel: number, intervals: GrowthIntervals) => {
    if (targetLevel <= 1) return 0;
    let totalPercent = 0;
    for (let i = 2; i <= targetLevel; i++) {
        if (i <= 6) totalPercent += (intervals?.early || 0);       
        else if (i <= 12) totalPercent += (intervals?.mid || 0);   
        else totalPercent += (intervals?.late || 0);               
    }
    return totalPercent / 100;
  };

  const scale = (val: number, intervals: GrowthIntervals) => {
    // [안전 장치] 값이 없으면 0 처리
    const baseVal = val || 0;
    if (!intervals) return baseVal;
    
    const multiplier = getMultiplier(level, intervals);
    return Math.floor(baseVal * (1 + multiplier));
  };

  const FLAT_HP_BONUS = 500;
  const FLAT_ARMOR_BONUS = 20;

  return {
    ...baseStats,
    hp: scale(baseStats.hp, g.hp) + FLAT_HP_BONUS,        
    ad: scale(baseStats.ad, g.ad),        
    ap: scale(baseStats.ap, g.ap),        
    armor: scale(baseStats.armor, g.armor) + FLAT_ARMOR_BONUS,  
    baseAtk: scale(baseStats.baseAtk, g.baseAtk),
    regen: scale(baseStats.regen, g.regen),
    pen: baseStats.pen || 0,
    crit: baseStats.crit || 0,
    speed: baseStats.speed || 300,
    range: baseStats.range || 100
  };
};

export const calculateTotalStats = (hero: Hero, items: Item[]): HeroStats => {
  // [안전 장치] 초기값 보장
  let stats = { 
      ad: hero.stats.ad || 0,
      ap: hero.stats.ap || 0,
      hp: hero.stats.hp || 1000,
      mp: hero.stats.mp || 0,
      armor: hero.stats.armor || 0,
      crit: hero.stats.crit || 0,
      speed: hero.stats.speed || 300,
      regen: hero.stats.regen || 0,
      mpRegen: hero.stats.mpRegen || 0,
      pen: hero.stats.pen || 0,
      baseAtk: hero.stats.baseAtk || 0,
      range: hero.stats.range || 100
  };

  if (items && Array.isArray(items)) {
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
  }
  return stats;
};
