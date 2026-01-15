// ==========================================
// FILE PATH: /src/engine/match/ai/evaluators/RecallInterrupter.ts
// ==========================================
import { LivePlayer } from '../../../../types';
import { AIUtils } from '../AIUtils';

export class RecallInterrupter {
  
  /**
   * 적의 귀환을 방해해야 하는지 판단하고, 우선순위 점수를 반환합니다.
   */
  static getInterruptionScore(attacker: LivePlayer, target: LivePlayer): number {
    // 1. 귀환 중이 아니면 무시
    if (!target.isRecalling) return 0;

    let score = 0;
    const hpPercent = AIUtils.hpPercent(target);

    // 2. 기본 방해 점수 (귀환 자체를 끊는 것만으로도 이득)
    score += 500;

    // 3. 딸피일수록 점수 폭증 (집에 못 가게 하고 죽여야 함)
    if (hpPercent < 0.3) {
        score += 2000; // 딸피 귀환은 눈에 불을 켜고 끊음
    } else if (hpPercent < 0.6) {
        score += 1000;
    }

    // 4. 귀환 완료 직전일수록 점수 상승 (다급함)
    // recallTime이 보통 10초라면, 8초 넘게 진행됐을 때 더 급하게 끊으려 함
    if (target.currentRecallTime > 7.0) {
        score += 1500;
    }

    // 5. 거리 페널티 (너무 멀면 포기)
    const dist = AIUtils.dist(attacker, target);
    if (dist > 15) {
        score -= (dist * 20); // 멀면 점수 깎임
    }

    // 6. 뇌지컬 보정 (똑똑한 AI는 귀환을 더 잘 끊음)
    if (attacker.stats.brain > 60) {
        score *= 1.2;
    }

    return Math.max(0, score);
  }
}
