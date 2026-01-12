import { LivePlayer, LiveMatch, Hero } from '../../../../types';
import { AIUtils } from '../AIUtils';
import { BASES } from '../../constants/MapConstants';

export class GankEvaluator {
  /**
   * 갱킹/로밍을 갈만한 최적의 타겟을 반환합니다.
   * 없으면 null 반환.
   */
  static evaluate(player: LivePlayer, match: LiveMatch, hero: Hero): LivePlayer | null {
    // 1. 자격 요건 심사
    // - 정글러는 언제든 가능
    // - 미드 라이너는 라인을 밀었거나(라인 압박 없음), 텔레포트(가정) 상황일 때 가능
    // - 탑/봇은 잘 안 움직임 (보수적)
    const isJungler = player.lane === 'JUNGLE';
    const isMid = player.lane === 'MID';
    
    // 정글이나 미드가 아니면 로밍 빈도 낮음 (뇌지컬 높으면 가능)
    if (!isJungler && !isMid && player.stats.brain < 80) return null;

    const isBlue = match.blueTeam.includes(player);
    const enemies = isBlue ? match.redTeam : match.blueTeam;
    const enemyBase = isBlue ? BASES.RED : BASES.BLUE;

    let bestTarget: LivePlayer | null = null;
    let maxScore = 0;

    for (const enemy of enemies) {
      if (enemy.currentHp <= 0 || enemy.respawnTimer > 0) continue;
      
      // 정글러끼리는 갱킹 대상에서 제외 (카정은 별도 로직 필요)
      if (enemy.lane === 'JUNGLE') continue; 

      // 점수 계산 (Gank Score)
      let score = 0;

      // A. 거리 점수: 너무 멀면 감점 (동선 낭비)
      const dist = AIUtils.dist(player, enemy);
      if (dist > 60) continue; // 너무 멀면 포기
      score += (60 - dist); // 가까울수록 점수

      // B. 체력 점수: 적 체력이 낮으면 킬각 (가중치 높음)
      const hpPer = AIUtils.hpPercent(enemy);
      if (hpPer < 0.5) score += (1 - hpPer) * 100;

      // C. 라인 상황 점수 (Overextension Check)
      // 적이 우리 타워 쪽으로 얼마나 깊숙이 들어왔는가?
      // 적 본진과의 거리가 멀수록(즉, 우리 진영에 가까울수록) 갱킹 성공률 높음
      const distFromSafety = AIUtils.dist(enemy, enemyBase);
      // 맵 중앙(50)보다 더 들어왔으면 가산점
      if (distFromSafety > 50) {
        score += (distFromSafety - 50) * 2;
      } else {
        // 안전지대에 있으면 감점 (타워 다이브 위험)
        score -= 50; 
      }

      // D. 레벨 격차: 내가 적보다 레벨 높으면 유리
      score += (player.level - enemy.level) * 10;

      // 갱킹 임계점 (이 점수를 넘어야만 감)
      if (score > 60 && score > maxScore) {
        maxScore = score;
        bestTarget = enemy;
      }
    }

    return bestTarget;
  }
}
