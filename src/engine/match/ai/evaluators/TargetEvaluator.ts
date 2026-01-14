// ==========================================
// FILE PATH: /src/engine/match/ai/evaluators/TargetEvaluator.ts
// ==========================================
import { LivePlayer, Hero, Minion, LiveMatch } from '../../../../types';
import { AIUtils } from '../AIUtils';
import { Perception } from '../Perception';
import { TOWER_COORDS } from '../../constants/MapConstants';

export class TargetEvaluator {
  static selectBestTarget(
    attacker: LivePlayer, 
    attackerHero: Hero, 
    enemiesInRange: LivePlayer[], 
    heroes: Hero[],
    match?: LiveMatch
  ): LivePlayer | null {
    if (enemiesInRange.length === 0) return null;

    const brain = attacker.stats.brain; 
    let bestTarget: LivePlayer | null = null;
    let maxScore = -99999;
    
    // 공격 사거리 (보정값 포함)
    const myRange = (attackerHero.stats.range / 100);

    for (const enemy of enemiesInRange) {
      const enemyHero = heroes.find(h => h.id === enemy.heroId);
      if (!enemyHero) continue;

      let score = 0;

      // 1. 기본 점수 (체력, 킬각)
      const dmg = attackerHero.stats.ad * 2 + attackerHero.stats.ap * 1.5;
      if (enemy.currentHp < dmg) score += 10000;
      else score += (1 - AIUtils.hpPercent(enemy)) * 200;

      const dist = AIUtils.dist(attacker, enemy);
      score -= dist * 5;

      // 2. [핵심] 타워 상황 판단 (Smart Tower Check)
      if (match) {
          const isBlue = match.blueTeam.includes(attacker);
          const enemyPos = {x: enemy.x, y: enemy.y};
          
          // 적이 타워 사거리(13) 안에 있는가?
          if (Perception.isInActiveEnemyTowerRange(enemyPos, match, isBlue)) {
              
              // A. 미니언이 탱킹 중인가? (Safe Dive)
              const hasMinion = Perception.isSafeToSiege(attacker, match, enemyPos);
              
              // B. 내가 타워 밖에서 때릴 수 있는가? (Safe Poke)
              // (적이 타워 가장자리에 있고, 내 사거리가 길 때)
              // 타워 중심과 적의 거리 + 내 사거리 > 타워 사거리 + 내 거리
              // 간단히: 내 사거리 > 5.0 (원거리) 이면 시도해볼만 함
              const canPoke = myRange > 5.0;

              if (!hasMinion && !canPoke) {
                  // 미니언도 없고, 원거리도 아니면 -> 들어가야 함 -> 위험
                  let penalty = 2000;
                  
                  // 뇌지컬이 낮으면 페널티 무시 (꼴아박음)
                  if (brain < 30) penalty = 0;
                  
                  // 딸피면 감수함
                  if (AIUtils.hpPercent(enemy) < 0.15) penalty -= 1000;

                  score -= penalty;
              } else if (!hasMinion && canPoke) {
                   // 원거리지만 미니언이 없음 -> 짤짤이는 가능하지만 너무 깊이 못감
                   // 적이 타워 깊숙이 숨으면 포기해야 함
                   // (이는 TacticalComputer가 이동 위치를 제한함으로써 해결됨)
                   score -= 100; // 약간의 주의
              }
          }
      }

      if (score > maxScore) {
        maxScore = score;
        bestTarget = enemy;
      }
    }
    return bestTarget;
  }

  // (FarmTarget 유지)
  static selectFarmTarget(
    attacker: LivePlayer,
    minionsInRange: Minion[],
    killThreshold: number 
  ): Minion | null {
    if (minionsInRange.length === 0) return null;
    const killable = minionsInRange.filter(m => m.hp <= killThreshold);
    if (killable.length > 0) return killable.sort((a,b)=>a.hp-b.hp)[0];
    if (attacker.level < 6 && attacker.lane !== 'JUNGLE') return null;
    return minionsInRange[0];
  }
}
