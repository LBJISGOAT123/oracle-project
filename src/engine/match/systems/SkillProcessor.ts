// ==========================================
// FILE PATH: /src/engine/match/systems/SkillProcessor.ts
// ==========================================
import { SkillDetail } from '../../../types';
import { StatusManager } from './StatusManager';

export const processSkillEffect = (skill: SkillDetail, attacker: any, target: any) => {
  let power = skill.val + (attacker.stats.ad * skill.adRatio) + (attacker.stats.ap * skill.apRatio);

  switch (skill.mechanic) {
    case 'EXECUTE':
      if (target.currentHp / target.maxHp < 0.25) power *= 5; 
      break;
      
    case 'STUN':
    case 'HOOK':
      // [수정] StatusManager를 통해 정확한 시간 동안 기절시킴
      // 스킬 데이터에 duration이 없으면 기본 1.5초
      const duration = skill.duration || 1.5;
      StatusManager.applyStun(target, duration);
      break;
      
    case 'HEAL':
      attacker.currentHp = Math.min(attacker.maxHp, attacker.currentHp + power);
      return 0;
      
    case 'SHIELD':
      // 쉴드 로직은 간소화 (체력을 임시로 늘림 or 별도 처리)
      // 여기서는 즉시 회복으로 대체 (구현 복잡도 완화)
      attacker.currentHp = Math.min(attacker.maxHp, attacker.currentHp + power * 0.5);
      return 0;
  }
  
  return Math.floor(power);
};
