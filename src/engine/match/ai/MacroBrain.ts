// ==========================================
// FILE PATH: /src/engine/match/ai/MacroBrain.ts
// ==========================================
import { LivePlayer, LiveMatch, Hero } from '../../../types';
import { Perception } from './Perception';
import { AIUtils } from './AIUtils';
import { PathSystem } from '../systems/PathSystem';
import { GankEvaluator } from './evaluators/GankEvaluator';
import { KillEvaluator } from './evaluators/KillEvaluator';
import { EconomyEvaluator } from './evaluators/EconomyEvaluator';
import { BASES } from '../constants/MapConstants';
import { LaningLogic } from '../logics/LaningLogic';
import { RoamingLogic } from '../logics/RoamingLogic';
import { SquadSystem } from './tactics/SquadSystem';
import { TacticalScorer } from './tactics/TacticalScorer';
import { TeamTactics } from './tactics/TeamTactics';
import { ObservationSystem } from './perception/ObservationSystem'; // [신규]
import { useGameStore } from '../../../store/useGameStore';

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
    const distToBase = AIUtils.dist(player, myBase);

    // [0] 우물 복귀 완료
    if (distToBase < 5) {
      const hpP = AIUtils.hpPercent(player);
      const mpP = AIUtils.mpPercent(player);
      if (hpP < 0.95 || (player.maxMp > 0 && mpP < 0.95)) {
        return { action: 'RECALL', targetPos: myBase, reason: '우물 회복 중' };
      }
    }

    // [1] 생존 판단
    if (Perception.needsRecall(player)) {
        if (distToBase < 25) return { action: 'FLEE', targetPos: myBase, reason: '우물 이동' };
        if (Perception.analyzeNearbySituation(player, match, 15).enemies.length > 0) return { action: 'FLEE', targetPos: myBase, reason: '교전 이탈' };
        return { action: 'RECALL', targetPos: myBase, reason: '긴급 정비' };
    }
    
    if (Perception.isUnderTowerAggro(player, match)) {
        const situation = Perception.analyzeSituation(player, match);
        const isTank = player.maxHp > 3500 && AIUtils.hpPercent(player) > 0.6;
        if (!situation.isEnemyWipedOut && !isTank) {
            return { action: 'FLEE', targetPos: myBase, reason: '🚨 타워 어그로!' };
        }
    }

    // [2] 팀 오더
    const teamOrder = TeamTactics.analyzeTeamStrategy(match, isBlue);
    if (teamOrder.type !== 'FREE') {
        const targetPos = teamOrder.targetPos || myBase;
        if (teamOrder.type === 'ALL_PUSH') return { action: 'FINISH', targetPos, reason: teamOrder.reason };
        if (teamOrder.type === 'SIEGE_MID') {
            const nearby = Perception.analyzeNearbySituation(player, match, 15);
            if (nearby.enemies.length > 0) {
                const pushScore = TacticalScorer.getPushScore(player, match, targetPos);
                if (pushScore > 200) return { action: 'PUSH', targetPos, reason: '🔥 적 무시! 타워 점사!' };
                const target = nearby.enemies[0];
                return { action: 'FIGHT', targetPos: {x:target.x, y:target.y}, targetUnit: target, reason: '⚔️ 공성 중 교전' };
            }
            return { action: 'PUSH', targetPos, reason: teamOrder.reason };
        }
        if (teamOrder.type === 'ALL_DEFEND') return { action: 'DEFEND', targetPos, reason: teamOrder.reason };
    }

    // [3] 교전 & 킬각 & [신규] 추격(Chase)
    const nearby = Perception.analyzeNearbySituation(player, match, 25);
    if (nearby.enemies.length > 0) {
        if (SquadSystem.shouldInitiateFight(player, match)) {
            const target = nearby.enemies[0];
            return { action: 'FIGHT', targetPos: {x:target.x, y:target.y}, targetUnit: target, reason: '⚔️ 한타 개시!' };
        }
        for (const enemy of nearby.enemies) {
            const { battleSettings, roleSettings } = useGameStore.getState().gameState;
            const globalHeroes = useGameStore.getState().heroes;
            const killScore = KillEvaluator.evaluateKillChance(player, enemy, globalHeroes, match, battleSettings, roleSettings);
            if (killScore > 500) {
                // 공격한 적 기억 (추격용)
                player.lastAttackedTargetId = enemy.heroId;
                player.lastAttackTime = match.currentDuration;
                return { action: 'FIGHT', targetPos: {x:enemy.x, y:enemy.y}, targetUnit: enemy, reason: '🩸 킬각!' };
            }
        }
    }
    
    // [신규] 시야엔 없지만, 방금 놓친 적 추격 (Bush Checking)
    if (player.lastAttackedTargetId) {
        const lastPos = ObservationSystem.getLastKnownPosition(player, player.lastAttackedTargetId, match.currentDuration);
        if (lastPos) {
            // 내가 그 위치에 도착했으면 추격 종료
            if (AIUtils.dist(player, lastPos) < 2.0) {
                player.lastAttackedTargetId = undefined;
            } else {
                return { action: 'CHASE', targetPos: lastPos, reason: '🏃 도망친 적 추격' };
            }
        }
    }

    // [4] 경제적 귀환
    if (EconomyEvaluator.shouldRecallForShopping(player, match)) {
        return { action: 'RECALL', targetPos: myBase, reason: '💰 아이템 구매' };
    }

    // [5] 라인전/로밍
    if (player.lane !== 'JUNGLE' && match.currentDuration < 900) {
        const laningDecision = LaningLogic.decide(player, match, hero);
        if (laningDecision && !Perception.isSuicideMove(player, laningDecision.targetPos, match)) return laningDecision;
        
        const roamDecision = RoamingLogic.checkRoaming(player, match, hero);
        if (roamDecision) return roamDecision;
    }

    // [6] 기본 운영
    if (player.lane !== 'JUNGLE') {
        const towerPos = AIUtils.getNextObjectivePos(player, match, isBlue);
        if (Perception.isSafeToSiege(player, match, towerPos)) {
            return { action: 'PUSH', targetPos: towerPos, reason: '공성' };
        } else {
            const safeWaitPos = { x: towerPos.x + (isBlue ? -10 : 10), y: towerPos.y + (isBlue ? -10 : 10) };
            return { action: 'WAIT', targetPos: safeWaitPos, reason: '대기' };
        }
    }

    const nextPath = PathSystem.getNextWaypoint(player, isBlue, match);
    return { action: 'FARM', targetPos: nextPath, reason: '정글링' };
  }
}
