// src/engine/battle/SkillProcessor.ts
import { SkillDetail, HeroStats } from '../../types';

export const processSkillEffect = (skill: SkillDetail, attacker: any, target: any) => {
  let power = skill.val + (attacker.stats.ad * skill.adRatio) + (attacker.stats.ap * skill.apRatio);

  switch (skill.mechanic) {
    case 'EXECUTE':
      if (target.currentHp / target.maxHp < 0.25) power *= 5; // 체력 25% 이하면 5배 데미지
      break;
    case 'STUN':
      target.isStunned = true; // CC기 상태 부여 (시뮬레이션 반영용)
      break;
    case 'HEAL':
      attacker.currentHp = Math.min(attacker.maxHp, attacker.currentHp + power);
      return 0; // 데미지는 0
    case 'SHIELD':
      attacker.shield = power;
      return 0;
  }
  return Math.floor(power);
};