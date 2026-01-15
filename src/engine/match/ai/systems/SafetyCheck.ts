// ==========================================
// FILE PATH: /src/engine/match/ai/systems/SafetyCheck.ts
// ==========================================
import { LivePlayer, LiveMatch } from '../../../../types';
import { RiskAssessment } from './RiskAssessment';
import { AIUtils } from '../AIUtils';

export class SafetyCheck {
  
  static validateAction(
    player: LivePlayer, 
    match: LiveMatch, 
    intendedAction: string, 
    targetPos: {x:number, y:number}
  ): { action: string, targetPos: {x:number, y:number}, reason?: string } {
    
    // 이미 도망가거나 대기 중이면 패스
    if (intendedAction === 'RECALL' || intendedAction === 'WAIT') {
        return { action: intendedAction, targetPos };
    }

    const brain = player.stats.brain; // 운영 능력 (판단력)
    const mechanics = player.stats.mechanics; // 피지컬 (반사신경)
    
    // [핵심 패치] 동물적 감각 (Reflex Save)
    // 뇌지컬이 낮아서 위험한 곳에 들어갔더라도,
    // 피지컬이 좋으면 "어? 나 죽겠는데?" 하고 본능적으로 빠져나옴.
    
    // 조건: 체력이 30% 미만이고, 최근 2초 안에 피해를 입음
    const isLowHp = AIUtils.hpPercent(player) < 0.3;
    const isTakingDamage = match.currentDuration - (player as any).lastHitTime < 2.0;

    if (isLowHp && isTakingDamage) {
        // 피지컬 40 이상이면 반응 (기존엔 뇌지컬만 봤음)
        if (mechanics > 40) {
             const myBase = AIUtils.getMyBasePos(match.blueTeam.includes(player));
             return {
                 action: 'FLEE', // 뒤도 안 돌아보고 도망
                 targetPos: myBase,
                 reason: '동물적 감각 발동'
             };
        }
    }

    // --- 기존 뇌지컬 판단 로직 ---
    
    // 뇌지컬 30 이하는 위험 계산 불가 (그냥 들이박음 -> 위 피지컬 로직이 구제해줌)
    if (brain < 30) {
        return { action: intendedAction, targetPos };
    }

    const currentRisk = RiskAssessment.calculateRisk(player, targetPos, match);
    const riskTolerance = 100 - (brain * 0.6); 

    if (currentRisk > riskTolerance) {
        if (currentRisk > riskTolerance + 20) {
            const myBase = AIUtils.getMyBasePos(match.blueTeam.includes(player));
            return { action: 'RECALL', targetPos: myBase, reason: '위험 감지' };
        }
        return { action: 'WAIT', targetPos: { x: player.x, y: player.y }, reason: '진입 대기' };
    }

    return { action: intendedAction, targetPos };
  }
}
