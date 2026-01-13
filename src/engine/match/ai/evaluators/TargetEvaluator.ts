// ==========================================
// FILE PATH: /src/engine/match/ai/evaluators/TargetEvaluator.ts
// ==========================================
import { LivePlayer, Hero, Minion } from '../../../../types';
import { AIUtils } from '../AIUtils';

export class TargetEvaluator {
  static selectBestTarget(
    attacker: LivePlayer, 
    attackerHero: Hero, 
    enemiesInRange: LivePlayer[], 
    heroes: Hero[] 
  ): LivePlayer | null {
    if (enemiesInRange.length === 0) return null;
    if (enemiesInRange.length === 1) return enemiesInRange[0];

    const myRole = attackerHero.role;
    
    let bestTarget: LivePlayer | null = null;
    let maxScore = -9999;

    for (const enemy of enemiesInRange) {
      const enemyHero = heroes.find(h => h.id === enemy.heroId);
      if (!enemyHero) continue;

      let score = 0;

      const estimatedDmg = attackerHero.stats.ad * 3 + attackerHero.stats.ap * 2; 
      if (enemy.currentHp < estimatedDmg) score += 5000; 

      const dist = AIUtils.dist(attacker, enemy);
      score -= dist * 10; 

      const isSquishy = ['신살자', '선지자', '추적자'].includes(enemyHero.role);
      
      if (myRole === '추적자' || myRole === '집행관') {
        if (isSquishy) score += 200;
      } else if (myRole === '신살자') {
        if (isSquishy) score += 50; 
      }

      score += (1 - AIUtils.hpPercent(enemy)) * 100;

      if (score > maxScore) {
        maxScore = score;
        bestTarget = enemy;
      }
    }
    return bestTarget;
  }

  /**
   * [Smart Farming]
   * killThreshold 이하의 체력을 가진 미니언을 최우선으로 반환합니다.
   */
  static selectFarmTarget(
    attacker: LivePlayer,
    minionsInRange: Minion[],
    killThreshold: number 
  ): Minion | null {
    if (minionsInRange.length === 0) return null;

    // 1. 막타 가능 미니언 찾기
    const killableMinions = minionsInRange.filter(m => m.hp <= killThreshold);

    if (killableMinions.length > 0) {
        // 대포 > 근거리 > 원거리 순 + 피 적은 순
        killableMinions.sort((a, b) => {
            const valA = this.getMinionValue(a.type);
            const valB = this.getMinionValue(b.type);
            if (valA !== valB) return valB - valA; 
            return a.hp - b.hp;
        });
        return killableMinions[0];
    }

    // 막타 칠 게 없으면 null 반환 (불필요한 공격 자제 -> 막타 대기)
    return null;
  }

  private static getMinionValue(type: string): number {
      if (type === 'SUMMONED_COLOSSUS') return 10;
      if (type === 'SIEGE') return 3;
      if (type === 'MELEE') return 2;
      return 1;
  }
}
