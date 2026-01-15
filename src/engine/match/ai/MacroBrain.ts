// ==========================================
// FILE PATH: /src/engine/match/ai/MacroBrain.ts
// ==========================================
import { LivePlayer, LiveMatch, Hero } from '../../../types';
import { Perception } from './Perception';
import { AIUtils } from './AIUtils';
import { PathSystem } from '../systems/PathSystem';
import { EconomyEvaluator } from './evaluators/EconomyEvaluator';
import { BASES } from '../constants/MapConstants';
import { LaningLogic } from '../logics/LaningLogic';
import { RoamingLogic } from '../logics/RoamingLogic';
import { SquadSystem } from './tactics/SquadSystem';
import { TeamTactics } from './tactics/TeamTactics';

export type MacroAction = 'RECALL' | 'DEFEND' | 'FIGHT' | 'FARM' | 'PUSH' | 'WAIT' | 'OBJECTIVE' | 'SUPPORT' | 'GANK' | 'FLEE' | 'FINISH' | 'ASSEMBLE' | 'LANING' | 'CHASE';

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
    const enemyBase = AIUtils.getMyBasePos(!isBlue);
    const distToBase = AIUtils.dist(player, myBase);

    // =================================================================
    // [0] 우물 탈출 로직 (최우선 순위 - 멍청하게 왔다갔다 방지)
    // =================================================================
    // 우물 근처(12)에 있는데 체력/마나가 충분하다면? 뒤도 돌아보지 말고 나간다.
    if (distToBase < 12) { 
      const hpP = AIUtils.hpPercent(player);
      const mpP = AIUtils.mpPercent(player);
      
      // 회복이 덜 됐으면 대기 (95% 미만)
      if (hpP < 0.95 || (player.maxMp > 0 && mpP < 0.95)) {
        return { action: 'RECALL', targetPos: myBase, reason: '우물 회복 중' };
      }
      
      // [핵심] 회복 다 됐으면? -> EconomyEvaluator(쇼핑 체크)를 건너뛰고 강제 출격
      // 여기서 쇼핑 체크를 하면 "나가는 중에 돈이 모임 -> 다시 백" 하는 현상 발생
      const pathPos = PathSystem.getNextWaypoint(player, isBlue, match);
      return { action: 'PUSH', targetPos: pathPos, reason: '전선 복귀' };
    }

    // =================================================================
    // [1] 생존 판단 (Low HP)
    // =================================================================
    if (Perception.needsRecall(player)) {
        // 적이 근처에 있으면 도망, 없으면 귀환
        if (Perception.analyzeNearbySituation(player, match, 15).enemies.length > 0) {
            return { action: 'FLEE', targetPos: myBase, reason: '교전 이탈' };
        }
        return { action: 'RECALL', targetPos: myBase, reason: '긴급 정비' };
    }
    
    // =================================================================
    // [2] 팀 오더 (넥서스 점사 등)
    // =================================================================
    const teamOrder = TeamTactics.analyzeTeamStrategy(match, isBlue);
    if (teamOrder.type === 'ALL_PUSH') {
        return { action: 'FINISH', targetPos: enemyBase, reason: '넥서스 파괴' };
    }

    if (teamOrder.type === 'SIEGE_MID') {
        const nearby = Perception.analyzeNearbySituation(player, match, 15);
        if (nearby.enemies.length > 0) {
             const target = nearby.enemies[0];
             return { action: 'FIGHT', targetPos: {x:target.x, y:target.y}, targetUnit: target, reason: '공성 교전' };
        }
        return { action: 'PUSH', targetPos: teamOrder.targetPos!, reason: '미드 공성' };
    }

    if (teamOrder.type === 'ALL_DEFEND') {
        return { action: 'DEFEND', targetPos: myBase, reason: '본진 수비' };
    }

    // =================================================================
    // [3] 교전 & 킬각
    // =================================================================
    const nearby = Perception.analyzeNearbySituation(player, match, 25);
    if (nearby.enemies.length > 0) {
        // 한타 각?
        if (SquadSystem.shouldInitiateFight(player, match)) {
            const target = nearby.enemies[0];
            return { action: 'FIGHT', targetPos: {x:target.x, y:target.y}, targetUnit: target, reason: '한타 개시' };
        }
        // 짤라먹기 각?
        for (const enemy of nearby.enemies) {
             if (AIUtils.hpPercent(enemy) < 0.4) {
                 player.lastAttackedTargetId = enemy.heroId;
                 player.lastAttackTime = match.currentDuration;
                 return { action: 'FIGHT', targetPos: {x:enemy.x, y:enemy.y}, targetUnit: enemy, reason: '킬각' };
             }
        }
    }

    // =================================================================
    // [4] 경제적 귀환 (돈 많으면 집)
    // =================================================================
    // 기지를 막 벗어난 상태(거리 30 이내)에서는 웬만하면 다시 집에 가지 않음 (깜빡한 물건 사러가는 짓 방지)
    if (distToBase > 30 && EconomyEvaluator.shouldRecallForShopping(player, match)) {
        return { action: 'RECALL', targetPos: myBase, reason: '아이템 구매' };
    }

    // =================================================================
    // [5] 라인전 & 기본 운영
    // =================================================================
    
    // 라인전 단계
    if (player.lane !== 'JUNGLE' && match.currentDuration < 900) {
        const laningDecision = LaningLogic.decide(player, match, hero);
        if (laningDecision && !Perception.isSuicideMove(player, laningDecision.targetPos, match)) return laningDecision;
        
        const roamDecision = RoamingLogic.checkRoaming(player, match, hero);
        if (roamDecision) return roamDecision;
    }

    // 기본 운영 (푸쉬)
    if (player.lane !== 'JUNGLE') {
        const towerPos = AIUtils.getNextObjectivePos(player, match, isBlue);
        if (Perception.isSafeToSiege(player, match, towerPos)) {
            return { action: 'PUSH', targetPos: towerPos, reason: '라인 푸쉬' };
        } else {
            // 안전하지 않으면 타워 사거리 밖에서 대기 (집에 가지 말고)
            const safeWaitPos = { x: towerPos.x + (isBlue ? -12 : 12), y: towerPos.y + (isBlue ? -12 : 12) };
            return { action: 'WAIT', targetPos: safeWaitPos, reason: '대기' };
        }
    }

    // 정글링
    const nextPath = PathSystem.getNextWaypoint(player, isBlue, match);
    return { action: 'FARM', targetPos: nextPath, reason: '정글링' };
  }
}
