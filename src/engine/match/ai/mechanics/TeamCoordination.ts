// ==========================================
// FILE PATH: /src/engine/match/ai/mechanics/TeamCoordination.ts
// ==========================================
import { LivePlayer, Hero } from '../../../../types';
import { StatusManager } from '../../systems/StatusManager';

export class TeamCoordination {
  
  /**
   * [CC 연계 판단]
   * 타겟이 이미 기절 상태라면, 스킬 사용을 잠시 보류(Hold)해야 하는지 판단합니다.
   * @param target 타겟 플레이어
   * @param skillMechanic 사용할 스킬의 메커니즘
   */
  static shouldHoldCC(target: LivePlayer, skillMechanic: string): boolean {
    // CC기가 아니면 연계할 필요 없음
    if (skillMechanic !== 'STUN' && skillMechanic !== 'HOOK') return false;

    // 타겟이 기절 중인지 확인
    if (StatusManager.isStunned(target)) {
        const remainingTime = StatusManager.getRemainingStunTime(target);
        
        // 기절 시간이 0.5초 이상 남았으면 스킬 아낌 (중첩 방지)
        // 0.5초 미만이면 덮어씌워서 연계(Chain) 시전
        if (remainingTime > 0.5) {
            return true; // Hold
        }
    }
    return false; // Use now
  }
}
