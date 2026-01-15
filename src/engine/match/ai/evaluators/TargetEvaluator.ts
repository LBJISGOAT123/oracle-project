// ==========================================
// FILE PATH: /src/engine/match/ai/evaluators/TargetEvaluator.ts
// ==========================================
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
    
    // 심리 상태: 너무 위축되면 공격 안 함
    const morale = match ? PsychologyEvaluator.getMorale(attacker, match) : 1.0;
    const aggressionThreshold = morale < 0.7 ? 500 : -5000; 

    const isBlue = match ? match.blueTeam.includes(attacker) : true;

    for (const enemy of enemiesInRange) {
      // 1. [절대 금지] 우물 다이브
      if (match && Perception.isInEnemyFountain({x: enemy.x, y: enemy.y}, match, isBlue)) continue;

      const enemyHero = heroes.find(h => h.id === enemy.heroId);
      if (!enemyHero) continue;

      let score = 0;

      // 2. 딜교환 계산 (내 데미지 vs 적 체력)
      const myDmg = attackerHero.stats.ad * 2.5 + attackerHero.stats.ap * 2.0;
      const enemyHp = enemy.currentHp;
      
      // 킬각이면 점수 대폭 상승
      if (enemyHp < myDmg) score += 5000; 
      else score += (1 - AIUtils.hpPercent(enemy)) * 300; // 딸피일수록 유혹됨

      // 거리 페널티
      const dist = AIUtils.dist(attacker, enemy);
      score -= dist * 10;

      // 트라우마 (나를 죽인 적은 무서워함)
      const threatScore = PersonalMemory.getThreatLevel(attacker, enemy.heroId);
      if (threatScore > 0 && brain > 40) score -= threatScore; 

      // 3. [핵심 패치] 쪽수 파악 (Number Disadvantage)
      if (match) {
          const enemyPos = { x: enemy.x, y: enemy.y };
          
          // 적 주변 15거리 내에 또 다른 적이 몇 명인가?
          const enemiesNearTarget = (isBlue ? match.redTeam : match.blueTeam).filter(e => 
              e !== enemy && e.currentHp > 0 && AIUtils.dist({x: e.x, y: e.y}, enemyPos) < 15
          ).length;

          // 아군 주변 15거리 내에 내 편이 몇 명인가?
          const alliesNearMe = (isBlue ? match.blueTeam : match.redTeam).filter(a => 
              a !== attacker && a.currentHp > 0 && AIUtils.dist(attacker, a) < 15
          ).length;

          // [판단] 내가 불리한 싸움인가? (적 숫자 > 아군 숫자)
          if (enemiesNearTarget > alliesNearMe) {
              // 기본적으로 1:2 상황이면 -2000점 (절대 안 감)
              let penalty = (enemiesNearTarget - alliesNearMe) * 2000;
              
              // 뇌지컬이 높으면 페널티를 더 세게 받음 (더 사림)
              if (brain > 70) penalty *= 1.5;
              
              // 내가 암살자(추적자)나 원딜(신살자)이면 더 사림
              if (attackerHero.role === '추적자' || attackerHero.role === '신살자') penalty *= 1.5;

              score -= penalty;
          }
          
          // [예외] 내가 압도적으로 잘 컸으면(3코어 이상 차이) 1:2 정도는 해볼만 함
          if (attacker.items.length - enemy.items.length >= 3) {
              score += 1500; // 자신감 회복
          }
      }

      // 4. 타워 다이브 체크
      if (match) {
          const enemyPos = {x: enemy.x, y: enemy.y};
          if (Perception.isInActiveEnemyTowerRange(enemyPos, match, isBlue)) {
              // 기본적으로 타워 안은 지옥임
              score -= 4000; 

              // 딸피 유혹 (뇌지컬 낮으면 낚임)
              if (AIUtils.hpPercent(enemy) < 0.15 && brain < 40) score += 2000;
          }
      }

      score *= morale;
      score += RecallInterrupter.getInterruptionScore(attacker, enemy);

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
