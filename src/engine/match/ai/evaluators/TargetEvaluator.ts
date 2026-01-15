import { LivePlayer, Hero, Minion, LiveMatch } from '../../../../types';
import { AIUtils } from '../AIUtils';
import { Perception } from '../Perception';
import { RecallInterrupter } from './RecallInterrupter';
import { PsychologyEvaluator } from './PsychologyEvaluator';
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
    
    const morale = match ? PsychologyEvaluator.getMorale(attacker, match) : 1.0;
    const aggressionThreshold = morale < 0.8 ? 100 : -5000; 

    const myRange = (attackerHero.stats.range / 100);
    const isBlue = match ? match.blueTeam.includes(attacker) : true;

    for (const enemy of enemiesInRange) {
      // [핵심] 적이 우물 안에 있으면 절대 타겟팅 금지 (다이브 방지)
      if (match && Perception.isInEnemyFountain({x: enemy.x, y: enemy.y}, match, isBlue)) {
          continue;
      }

      const enemyHero = heroes.find(h => h.id === enemy.heroId);
      if (!enemyHero) continue;

      let score = 0;

      // 1. 기본 점수 (체력, 킬각)
      const dmg = attackerHero.stats.ad * 2 + attackerHero.stats.ap * 1.5;
      if (enemy.currentHp < dmg) score += 5000; 
      else score += (1 - AIUtils.hpPercent(enemy)) * 200;

      const dist = AIUtils.dist(attacker, enemy);
      score -= dist * 5;

      const threatScore = PersonalMemory.getThreatLevel(attacker, enemy.heroId);
      if (threatScore > 0 && brain > 40) {
          score -= threatScore; 
      }

      score *= morale;

      const interruptScore = RecallInterrupter.getInterruptionScore(attacker, enemy);
      score += interruptScore;

      // 2. 타워 다이브 판단
      if (match) {
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
