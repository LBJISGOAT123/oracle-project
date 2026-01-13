// ==========================================
// FILE PATH: /src/engine/match/ai/MacroBrain.ts
// ==========================================
import { LivePlayer, LiveMatch, Hero } from '../../../types';
import { Perception } from './Perception';
import { AIUtils } from './AIUtils';
import { PathSystem } from '../systems/PathSystem';
import { GankEvaluator } from './evaluators/GankEvaluator';
import { BASES } from '../constants/MapConstants';
import { LaningLogic } from '../logics/LaningLogic';

export type MacroAction = 'RECALL' | 'DEFEND' | 'FIGHT' | 'FARM' | 'PUSH' | 'WAIT' | 'OBJECTIVE' | 'SUPPORT' | 'GANK' | 'FLEE' | 'FINISH' | 'LANING';

export interface MacroDecision {
  action: MacroAction;
  targetPos: { x: number, y: number };
  targetUnit?: LivePlayer;
  reason: string;
}

export class MacroBrain {
  static decide(player: LivePlayer, match: LiveMatch, hero: Hero): MacroDecision {
    const isBlue = match.blueTeam.includes(player);
    const myBase = AIUtils.getMyBasePos(isBlue);
    const enemyBase = isBlue ? BASES.RED : BASES.BLUE;
    const distToBase = AIUtils.dist(player, myBase);

    // [0] 우물 복귀 완료 (회복)
    if (distToBase < 5) {
      const hpP = AIUtils.hpPercent(player);
      const mpP = AIUtils.mpPercent(player);
      if (hpP < 0.95 || (player.maxMp > 0 && mpP < 0.95)) {
        return { action: 'RECALL', targetPos: myBase, reason: '우물 회복 중' };
      }
    }

    // [1] 생존 판단 (딸피면 귀환/도망)
    if (Perception.needsRecall(player)) {
      const nearbyEnemy = Perception.findNearbyEnemy(player, match, isBlue);
      if (nearbyEnemy && AIUtils.dist(player, nearbyEnemy) < 15) {
         return { action: 'FLEE', targetPos: myBase, reason: '교전 이탈' };
      }
      return { action: 'RECALL', targetPos: myBase, reason: '정비 필요' };
    }

    const situation = Perception.analyzeSituation(player, match);
    const enemyNexusHp = isBlue ? match.stats.red.nexusHp : match.stats.blue.nexusHp;
    const distToEnemyBase = AIUtils.dist(player, enemyBase);

    // [2] 넥서스 점사 (끝내기 각)
    if (situation.isEnemyWipedOut && AIUtils.hpPercent(player) > 0.3) {
        if (situation.isNexusVulnerable) {
            return { action: 'FINISH', targetPos: enemyBase, reason: '적 전멸! 끝내자!' };
        } else {
            const towerPos = AIUtils.getNextObjectivePos(player, match, isBlue);
            return { action: 'PUSH', targetPos: towerPos, reason: '적 전멸! 타워 철거' };
        }
    }
    if (distToEnemyBase < 30 && enemyNexusHp < 3000 && situation.isNexusVulnerable) {
        return { action: 'FINISH', targetPos: enemyBase, reason: '넥서스 점사' };
    }
    if (situation.hasSiegeBuff && situation.powerDifference > 1000 && situation.isNexusVulnerable) {
        return { action: 'PUSH', targetPos: enemyBase, reason: '거신병 진격' };
    }

    // [3] 본진/타워 수비 (최우선 방어)
    const baseThreat = Perception.isBaseUnderThreat(player, match, isBlue);
    if (baseThreat.isThreatened && baseThreat.enemyUnit) {
      const isBaseRace = distToEnemyBase < 30 && situation.isNexusVulnerable;
      if (!isBaseRace) {
          return { action: 'DEFEND', targetPos: { x: baseThreat.enemyUnit.x, y: baseThreat.enemyUnit.y }, targetUnit: baseThreat.enemyUnit, reason: '본진 방어' };
      }
    }
    if (AIUtils.hpPercent(player) > 0.6) {
      const towerThreat = Perception.findThreatenedStructure(player, match, isBlue);
      if (towerThreat) {
        const distToTower = AIUtils.dist(player, towerThreat.pos);
        // 내 라인 타워거나, 정글러거나, 아주 가까우면 수비
        if (player.lane === 'JUNGLE' || AIUtils.dist(player, towerThreat.pos) < 40) {
           return { action: 'DEFEND', targetPos: towerThreat.pos, targetUnit: towerThreat.enemy, reason: '타워 수비' };
        }
      }
    }

    // =================================================================
    // [중요 수정] 라인전 로직 (LaningLogic) 우선순위 상향
    // 기존 [7]번에서 [4]번으로 이동 -> 이제 불필요한 로밍/한타보다 라인전이 먼저임
    // =================================================================
    const laningDecision = LaningLogic.decide(player, match, hero);
    if (laningDecision) {
        return laningDecision;
    }

    // [5] 갱킹 (정글러 전용)
    if (AIUtils.hpPercent(player) > 0.6) {
        const gankTarget = GankEvaluator.evaluate(player, match, hero);
        if (gankTarget) {
            return { action: 'GANK', targetPos: { x: gankTarget.x, y: gankTarget.y }, targetUnit: gankTarget, reason: '갱킹' };
        }
    }

    // [6] 아군 지원 (로밍) - 라인전 단계가 끝났거나 정글러일 때만
    if (AIUtils.hpPercent(player) > 0.4) {
        const allyInTrouble = Perception.findAllyInTrouble(player, match, isBlue);
        if (allyInTrouble) {
            const chance = 60 + (player.stats.brain * 0.3);
            if (Math.random() * 100 < chance) {
                return { action: 'SUPPORT', targetPos: { x: allyInTrouble.x, y: allyInTrouble.y }, targetUnit: allyInTrouble, reason: '아군 지원' };
            }
        }
    }

    // [7] 오브젝트 (바론/용)
    const activeObj = Perception.findActiveObjective(match);
    if (activeObj) {
      const isJungler = player.lane === 'JUNGLE';
      const distanceToObj = AIUtils.dist(player, activeObj.pos);
      if (isJungler && AIUtils.hpPercent(player) > 0.5) {
          return { action: 'OBJECTIVE', targetPos: activeObj.pos, reason: '오브젝트 사냥' };
      }
      else if (distanceToObj < 40 && player.stats.brain > 50) {
         return { action: 'OBJECTIVE', targetPos: activeObj.pos, reason: '오브젝트 합류' };
      }
    }

    // [8] 교전 (최후순위: 라인전 단계도 아니고, 할 것도 없을 때 적 보이면 싸움)
    const nearbyEnemy = Perception.findNearbyEnemy(player, match, isBlue);
    if (nearbyEnemy) {
      const myPower = AIUtils.getCombatPower(player);
      const enemyPower = AIUtils.getCombatPower(nearbyEnemy);
      const aggro = (100 - player.stats.brain) * 10; 
      
      if (myPower + aggro >= enemyPower) {
        return { action: 'FIGHT', targetPos: { x: nearbyEnemy.x, y: nearbyEnemy.y }, targetUnit: nearbyEnemy, reason: '교전' };
      } else {
        return { action: 'FLEE', targetPos: myBase, reason: '후퇴' };
      }
    }

    // [9] 기본 행동 (라인 푸쉬 / 정글링)
    if (player.lane !== 'JUNGLE') {
        const towerPos = AIUtils.getNextObjectivePos(player, match, isBlue);
        const distToTower = AIUtils.dist(player, towerPos);
        
        if (distToTower < 20) {
            if (Perception.isSafeToSiege(player, match, towerPos)) {
                return { action: 'PUSH', targetPos: towerPos, reason: '공성' };
            } else {
                const waitPos = { 
                    x: towerPos.x + (isBlue ? -5 : 5), 
                    y: towerPos.y + (isBlue ? -5 : 5) 
                };
                return { action: 'WAIT', targetPos: waitPos, reason: '미니언 대기' };
            }
        } else {
            const nextPath = PathSystem.getNextWaypoint(player, isBlue);
            return { action: 'FARM', targetPos: nextPath, reason: '라인 복귀' };
        }
    }

    const nextPath = PathSystem.getNextWaypoint(player, isBlue);
    return { action: 'FARM', targetPos: nextPath, reason: '정글링' };
  }
}
