// ==========================================
// FILE PATH: /src/engine/match/ai/MacroBrain.ts
// ==========================================
import { LivePlayer, LiveMatch, Hero } from '../../../types';
import { Perception } from './Perception';
import { AIUtils } from './AIUtils';
import { PathSystem } from '../systems/PathSystem';
import { GankEvaluator } from './evaluators/GankEvaluator';

export type MacroAction = 'RECALL' | 'DEFEND' | 'FIGHT' | 'FARM' | 'PUSH' | 'OBJECTIVE' | 'SUPPORT' | 'GANK' | 'FLEE';

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
    const distToBase = AIUtils.dist(player, myBase);

    // ====================================================
    // [0] 우물 대기 (회복 완료까지 대기) - 신규 로직
    // ====================================================
    // 본진에 있고, 체력이나 마나가 95% 미만이면 나가지 않음
    if (distToBase < 5) {
      const hpP = AIUtils.hpPercent(player);
      const mpP = AIUtils.mpPercent(player);
      
      // 풀피/풀마나가 아니면 계속 RECALL 상태 유지 (PlayerSystem이 회복시킴)
      if (hpP < 0.95 || (player.maxMp > 0 && mpP < 0.95)) {
        return { action: 'RECALL', targetPos: myBase, reason: '우물 회복 중' };
      }
    }

    // ====================================================
    // [1] 생존 판단 (귀환) - 기존 로직 유지
    // ====================================================
    if (Perception.needsRecall(player)) {
      const nearbyEnemy = Perception.findNearbyEnemy(player, match, isBlue);
      
      // 적이 근처(15)에 있으면 귀환 끊길 위험 -> 걸어서 도망(FLEE)
      if (nearbyEnemy && AIUtils.dist(player, nearbyEnemy) < 15) {
         return { action: 'FLEE', targetPos: myBase, reason: '교전 이탈' };
      }
      return { action: 'RECALL', targetPos: myBase, reason: '정비 필요' };
    }

    // ====================================================
    // [2] 수비 판단 (본진 & 타워 방어) - 신규 로직
    // ====================================================
    // A. 넥서스 위협 (최우선)
    const baseThreat = Perception.isBaseUnderThreat(player, match, isBlue);
    if (baseThreat.isThreatened && baseThreat.enemyUnit) {
      // 뇌지컬이 너무 낮지 않으면(20 이상) 수비하러 감
      if (player.stats.brain > 20) { 
        return { action: 'DEFEND', targetPos: { x: baseThreat.enemyUnit.x, y: baseThreat.enemyUnit.y }, targetUnit: baseThreat.enemyUnit, reason: '본진 방어' };
      }
    }

    // B. 타워 위협 (차순위)
    // 체력이 여유 있을 때만 타워 막으러 감
    if (AIUtils.hpPercent(player) > 0.6) {
      const towerThreat = Perception.findThreatenedStructure(player, match, isBlue);
      if (towerThreat) {
        // 정글러거나, 해당 라인 라이너거나, 뇌지컬이 높은 유저면 합류
        // (너무 멀면 안 가도록 거리 체크 추가 가능)
        const distToTower = AIUtils.dist(player, towerThreat.pos);
        if (distToTower < 50 || player.lane === 'JUNGLE' || player.stats.brain > 70) {
           return { action: 'DEFEND', targetPos: towerThreat.pos, targetUnit: towerThreat.enemy, reason: '타워 수비' };
        }
      }
    }

    // ====================================================
    // [3] 지원 및 한타
    // ====================================================
    if (AIUtils.hpPercent(player) > 0.4) {
        const allyInTrouble = Perception.findAllyInTrouble(player, match, isBlue);
        if (allyInTrouble) {
            const baseChance = hero.role === '수호기사' ? 90 : 60;
            const chance = baseChance + (player.stats.brain * 0.2);
            if (Math.random() * 100 < chance) {
                return { action: 'SUPPORT', targetPos: { x: allyInTrouble.x, y: allyInTrouble.y }, targetUnit: allyInTrouble, reason: '아군 지원' };
            }
        }
    }

    // ====================================================
    // [4] 갱킹 (정글러 전용)
    // ====================================================
    if (AIUtils.hpPercent(player) > 0.6) {
        const gankTarget = GankEvaluator.evaluate(player, match, hero);
        if (gankTarget) {
            return { action: 'GANK', targetPos: { x: gankTarget.x, y: gankTarget.y }, targetUnit: gankTarget, reason: '갱킹' };
        }
    }

    // ====================================================
    // [5] 오브젝트
    // ====================================================
    const activeObj = Perception.findActiveObjective(match);
    if (activeObj) {
      const isJungler = player.lane === 'JUNGLE';
      const isLateGame = match.currentDuration > 900;
      const brain = player.stats.brain;

      // 정글러는 오브젝트 우선순위 높음
      if (isJungler) {
        if (AIUtils.hpPercent(player) > 0.5) return { action: 'OBJECTIVE', targetPos: activeObj.pos, reason: '오브젝트 사냥' };
      }
      // 라이너는 후반이거나 똑똑하면 합류
      else if (isLateGame || brain > 70) {
         const distanceToObj = AIUtils.dist(player, activeObj.pos);
         // 너무 멀면 안 감 (라인 손해 방지)
         if (distanceToObj < 40) return { action: 'OBJECTIVE', targetPos: activeObj.pos, reason: '오브젝트 합류' };
      }
    }

    // ====================================================
    // [6] 교전 (주변 적 조우)
    // ====================================================
    const nearbyEnemy = Perception.findNearbyEnemy(player, match, isBlue);
    if (nearbyEnemy) {
      const myPower = AIUtils.getCombatPower(player);
      const enemyPower = AIUtils.getCombatPower(nearbyEnemy);
      // 공격성(Aggression) 보정: 뇌지컬이 낮을수록 무지성 돌격
      const aggro = (100 - player.stats.brain) * 10; 
      
      if (myPower + aggro >= enemyPower) {
        return { action: 'FIGHT', targetPos: { x: nearbyEnemy.x, y: nearbyEnemy.y }, targetUnit: nearbyEnemy, reason: '교전' };
      } else {
        return { action: 'FLEE', targetPos: myBase, reason: '후퇴' };
      }
    }

    // ====================================================
    // [7] 기본 행동 (파밍/푸쉬/정글링)
    // ====================================================
    
    // 라이너
    if (player.lane !== 'JUNGLE') {
        const towerPos = AIUtils.getNextObjectivePos(player, match, isBlue);
        const distToTower = AIUtils.dist(player, towerPos);
        
        // 타워 근처면 공성 모드
        if (distToTower < 15) {
            return { action: 'PUSH', targetPos: towerPos, reason: '공성' };
        } 
        // 아니면 이동하며 파밍
        else {
            const nextPath = PathSystem.getNextWaypoint(player, isBlue);
            return { action: 'FARM', targetPos: nextPath, reason: '라인 복귀' };
        }
    }

    // 정글러
    const nextPath = PathSystem.getNextWaypoint(player, isBlue);
    return { action: 'FARM', targetPos: nextPath, reason: '정글링' };
  }
}
