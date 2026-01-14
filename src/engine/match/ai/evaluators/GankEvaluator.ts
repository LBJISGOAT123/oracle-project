// ==========================================
// FILE PATH: /src/engine/match/ai/evaluators/GankEvaluator.ts
// ==========================================
import { LivePlayer, LiveMatch, Hero } from '../../../../types';
import { AIUtils } from '../AIUtils';
import { BASES } from '../../constants/MapConstants';

export class GankEvaluator {
  static evaluate(player: LivePlayer, match: LiveMatch, hero: Hero): LivePlayer | null {
    const isJungler = player.lane === 'JUNGLE';
    const isMid = player.lane === 'MID';
    const brain = player.stats.brain;
    
    // 로밍 조건: 뇌지컬 60 이상이면 라이너도 로밍각 봄
    if (!isJungler && !isMid && brain < 60) return null;

    const isBlue = match.blueTeam.includes(player);
    const enemies = isBlue ? match.redTeam : match.blueTeam;
    const enemyBase = isBlue ? BASES.RED : BASES.BLUE;

    let bestTarget: LivePlayer | null = null;
    let maxScore = 0;

    for (const enemy of enemies) {
      if (enemy.currentHp <= 0 || enemy.respawnTimer > 0) continue;
      if (enemy.lane === 'JUNGLE') continue;

      let score = 0;

      // A. 거리 점수
      const dist = AIUtils.dist(player, enemy);
      if (dist > 70) continue;
      score += (70 - dist) * 1.5;

      // B. 체력 점수 (딸피 냄새)
      const hpPer = AIUtils.hpPercent(enemy);
      if (hpPer < 0.5) score += (1 - hpPer) * 200; // 가중치 대폭 상향

      // C. 라인 상황 (Overextension)
      const distFromEnemyBase = AIUtils.dist(enemy, enemyBase);
      if (distFromEnemyBase > 35) { // 적이 라인을 밀고 있음
        score += (distFromEnemyBase - 35) * 4;
      } else {
        score -= 50; // 타워 허깅 중이면 갱킹 비추천
      }

      // D. [뇌지컬] 아군 호응 가능 여부
      // 똑똑하면 아군이 근처에 있을 때만 갱킹 감
      if (brain > 70) {
          const allyNearby = (isBlue ? match.blueTeam : match.redTeam).find(
              a => a !== player && a.currentHp > 0 && AIUtils.dist(a, enemy) < 20
          );
          if (allyNearby) score += 50;
          else score -= 30; // 호응 없으면 감점
      } else {
          // 멍청하면 그냥 들어감 (점수 보정 없음)
      }

      // E. 역할군 보정 (봇 갱킹 선호)
      if (enemy.lane === 'BOT') score += 20;

      if (score > 60 && score > maxScore) {
        maxScore = score;
        bestTarget = enemy;
      }
    }

    return bestTarget;
  }
}
