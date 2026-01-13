// ==========================================
// FILE PATH: /src/engine/match/ai/evaluators/GankEvaluator.ts
// ==========================================
import { LivePlayer, LiveMatch, Hero } from '../../../../types';
import { AIUtils } from '../AIUtils';
import { BASES } from '../../constants/MapConstants';

export class GankEvaluator {
  /**
   * 갱킹/로밍을 갈만한 최적의 타겟을 반환합니다.
   * [수정] 갱킹 점수 허들을 낮추고, 거리 가중치를 조절하여 더 자주 갱킹을 가게 함
   */
  static evaluate(player: LivePlayer, match: LiveMatch, hero: Hero): LivePlayer | null {
    const isJungler = player.lane === 'JUNGLE';
    const isMid = player.lane === 'MID';
    
    // 로밍 조건 완화: 뇌지컬 60 이상이면 서폿/탑도 가끔 로밍 고려
    if (!isJungler && !isMid && player.stats.brain < 60) return null;

    const isBlue = match.blueTeam.includes(player);
    const enemies = isBlue ? match.redTeam : match.blueTeam;
    const enemyBase = isBlue ? BASES.RED : BASES.BLUE;

    let bestTarget: LivePlayer | null = null;
    let maxScore = 0;

    for (const enemy of enemies) {
      if (enemy.currentHp <= 0 || enemy.respawnTimer > 0) continue;
      if (enemy.lane === 'JUNGLE') continue; // 카정은 별도 로직

      let score = 0;

      // A. 거리 점수
      const dist = AIUtils.dist(player, enemy);
      if (dist > 70) continue; // 너무 멀면 포기 (기존 60 -> 70 확장)
      score += (70 - dist) * 1.5; // 가까울수록 점수 가중치 증가

      // B. 체력 점수 (딸피 사냥)
      const hpPer = AIUtils.hpPercent(enemy);
      if (hpPer < 0.5) score += (1 - hpPer) * 150; // 가중치 상향

      // C. 라인 상황 (Overextension)
      // 적이 우리 진영 깊숙이 들어와 있으면 맛집
      const distFromEnemyBase = AIUtils.dist(enemy, enemyBase);
      
      // 맵 중앙(50) 기준
      if (distFromEnemyBase > 40) { // 조금만 나와도 점수 부여
        score += (distFromEnemyBase - 40) * 3; // 가중치 대폭 상향
      } else {
        score -= 30; // 타워 허깅 중이면 감점
      }

      // D. 레벨 우위
      score += (player.level - enemy.level) * 15;

      // E. 역할군 보정 (봇 갱킹 선호)
      if (enemy.lane === 'BOT') score += 20;

      // 갱킹 임계점 (기존 60 -> 50으로 하향하여 더 자주 감)
      if (score > 50 && score > maxScore) {
        maxScore = score;
        bestTarget = enemy;
      }
    }

    return bestTarget;
  }
}
