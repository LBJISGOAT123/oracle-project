// ==========================================
// FILE PATH: /src/engine/match/utils/StatUtils.ts
// ==========================================
import { HeroStats, Item, Hero, GrowthIntervals } from '../../../types';
import { useGameStore } from '../../../store/useGameStore';

export const getLevelScaledStats = (baseStats: HeroStats, level: number): HeroStats => {
  const state = useGameStore.getState().gameState;
  // 성장치 기본값
  const g = state?.growthSettings || { 
      hp: {early:5,mid:10,late:15}, 
      ad: {early:3,mid:5,late:8}, // 공격력 성장은 낮춤
      ap: {early:3,mid:5,late:8}, 
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

  // [근본 해결 1] 1레벨 깡체력 보정
  // 모든 영웅에게 기본 체력 +500, 기본 방어력 +20을 강제 주입하여 초반 급사 방지
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
