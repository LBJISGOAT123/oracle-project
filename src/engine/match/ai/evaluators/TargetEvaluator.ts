import { LivePlayer, Hero } from '../../../../types';
import { AIUtils } from '../AIUtils';

export class TargetEvaluator {
  /**
   * 사거리 내의 적들 중 가장 우선순위가 높은 타겟을 반환
   */
  static selectBestTarget(
    attacker: LivePlayer, 
    attackerHero: Hero, 
    enemiesInRange: LivePlayer[], 
    heroes: Hero[] // 적 영웅 정보를 알기 위해 필요
  ): LivePlayer | null {
    if (enemiesInRange.length === 0) return null;
    if (enemiesInRange.length === 1) return enemiesInRange[0];

    // 역할군별 선호도
    const myRole = attackerHero.role;
    
    let bestTarget: LivePlayer | null = null;
    let maxScore = -9999;

    for (const enemy of enemiesInRange) {
      const enemyHero = heroes.find(h => h.id === enemy.heroId);
      if (!enemyHero) continue;

      let score = 0;

      // 1. 킬각 점수 (막타 칠 수 있으면 최우선)
      // 대략적인 데미지 계산 (평타 2방 + 스킬 1방 가정)
      const estimatedDmg = attackerHero.stats.ad * 3 + attackerHero.stats.ap * 2; 
      if (enemy.currentHp < estimatedDmg) score += 5000; // 절대적 우선순위

      // 2. 거리 점수 (가까울수록 때리기 쉬움 - 카이팅 기본)
      const dist = AIUtils.dist(attacker, enemy);
      score -= dist * 10; 

      // 3. 적 역할군 점수 (전략적 판단)
      const isSquishy = ['신살자', '선지자', '추적자'].includes(enemyHero.role);
      
      if (myRole === '추적자' || myRole === '집행관') {
        // 암살자/브루저는 딜러를 무는 게 이득
        if (isSquishy) score += 200;
      } else if (myRole === '신살자') {
        // 원딜은 "안전하게 칠 수 있는" 적이 우선이지만, 
        // 딜러가 사거리 내에 들어왔으면 점사
        if (isSquishy) score += 50; 
      }

      // 4. 적 체력 비율 점수 (점사 유도)
      score += (1 - AIUtils.hpPercent(enemy)) * 100;

      if (score > maxScore) {
        maxScore = score;
        bestTarget = enemy;
      }
    }

    return bestTarget;
  }
}
