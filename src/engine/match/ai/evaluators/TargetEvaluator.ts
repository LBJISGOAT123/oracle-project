// ==========================================
// FILE PATH: /src/engine/match/ai/evaluators/TargetEvaluator.ts
// ==========================================
import { LivePlayer, Hero, Minion, LiveMatch } from '../../../../types';
import { AIUtils } from '../AIUtils';
import { Perception } from '../Perception';
import { RecallInterrupter } from './RecallInterrupter';
import { PsychologyEvaluator } from './PsychologyEvaluator';
// [수정] 경로 수정: ../ai/memory -> ../memory (이미 ai 폴더 내부에 있으므로)
import { PersonalMemory } from '../memory/PersonalMemory';

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
    
    // [심리 상태 반영]
    const morale = match ? PsychologyEvaluator.getMorale(attacker, match) : 1.0;
    const aggressionThreshold = morale < 0.8 ? 100 : -5000; 

    const myRange = (attackerHero.stats.range / 100);

    for (const enemy of enemiesInRange) {
      const enemyHero = heroes.find(h => h.id === enemy.heroId);
      if (!enemyHero) continue;

      let score = 0;

      // 1. 기본 점수 (체력, 킬각)
      const dmg = attackerHero.stats.ad * 2 + attackerHero.stats.ap * 1.5;
      if (enemy.currentHp < dmg) score += 5000; 
      else score += (1 - AIUtils.hpPercent(enemy)) * 200;

      // 거리 페널티
      const dist = AIUtils.dist(attacker, enemy);
      score -= dist * 5;

      // ---------------------------------------------------------
      // [신규] 천적 관계 반영 (트라우마)
      // ---------------------------------------------------------
      const threatScore = PersonalMemory.getThreatLevel(attacker, enemy.heroId);
      if (threatScore > 0) {
          if (brain > 40) {
              score -= threatScore; 
          }
      }

      // ---------------------------------------------------------
      // [신규] 멘탈(Morale) 반영
      // ---------------------------------------------------------
      score *= morale;

      // 귀환 방해 점수
      const interruptScore = RecallInterrupter.getInterruptionScore(attacker, enemy);
      score += interruptScore;

      // 2. 타워 상황 판단 (Smart Tower Check)
      if (match) {
          const isBlue = match.blueTeam.includes(attacker);
          const enemyPos = {x: enemy.x, y: enemy.y};
          
          if (Perception.isInActiveEnemyTowerRange(enemyPos, match, isBlue)) {
              const hasMinion = Perception.isSafeToSiege(attacker, match, enemyPos);
              const canPoke = myRange > 5.0;

              if (!hasMinion && !canPoke) {
                  let penalty = 2000;
                  
                  if (morale > 1.5 && brain < 30) penalty = 0; 
                  
                  if (AIUtils.hpPercent(enemy) < 0.15) penalty -= 1000;
                  if (interruptScore > 1000) penalty -= 500;

                  score -= penalty;
              } else if (!hasMinion && canPoke) {
                   score -= 100;
              }
          }
      }

      if (score > aggressionThreshold && score > maxScore) {
        maxScore = score;
        bestTarget = enemy;
      }
    }
    return bestTarget;
  }

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
