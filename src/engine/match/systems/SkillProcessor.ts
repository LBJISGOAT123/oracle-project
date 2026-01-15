// ==========================================
// FILE PATH: /src/engine/match/systems/SkillProcessor.ts
// ==========================================
import { SkillDetail } from '../../../types';
import { StatusManager } from './StatusManager';

export const processSkillEffect = (skill: SkillDetail, attacker: any, target: any) => {
  let power = skill.val + (attacker.stats.ad * skill.adRatio) + (attacker.stats.ap * skill.apRatio);

  switch (skill.mechanic) {
    case 'EXECUTE':
      // 잃은 체력 비례 데미지
      if (target.currentHp / target.maxHp < 0.3) power *= 2.5; 
      break;
      
    case 'STUN':
    case 'HOOK':
      // [핵심] CC 적용
      const duration = skill.duration || 1.5;
      StatusManager.applyStun(target, duration);
      break;
      
    case 'HEAL':
      attacker.currentHp = Math.min(attacker.maxHp, attacker.currentHp + power);
      return 0; // 데미지 없음
      
    case 'SHIELD':
      // 즉시 회복으로 구현 (임시)
      attacker.currentHp = Math.min(attacker.maxHp, attacker.currentHp + power * 0.5);
      return 0;
  }
  
  return Math.floor(power);
};
