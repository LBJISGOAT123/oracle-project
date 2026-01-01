// src/engine/battle/StatCalculator.ts
import { HeroStats, GodSettings } from '../../types';

export const calculateDamage = (
  attackerStats: HeroStats,
  defenderStats: HeroStats,
  godBuff: GodSettings,
  isCritical: boolean
) => {
  // 기본 데미지 = (기본공격력 + AD) * 진영 공격 가중치
  let baseDmg = (attackerStats.baseAtk + attackerStats.ad) * godBuff.atkRatio;

  if (isCritical) baseDmg *= 1.75;

  // 방어력 계산 (관통력 적용)
  const effectiveArmor = Math.max(0, defenderStats.armor - attackerStats.pen);
  const damageReduction = 100 / (100 + (effectiveArmor * godBuff.defRatio));

  return Math.floor(baseDmg * damageReduction);
};