// ==========================================
// FILE PATH: /src/engine/match/ai/MacroBrain.ts
// ==========================================
import { LivePlayer, LiveMatch, Hero, BattleSettings, RoleSettings } from '../../../types';
import { Perception } from './Perception';
import { AIUtils } from './AIUtils';
import { PathSystem } from '../systems/PathSystem';
import { GankEvaluator } from './evaluators/GankEvaluator';
import { KillEvaluator } from './evaluators/KillEvaluator';
import { BASES } from '../constants/MapConstants';
import { LaningLogic } from '../logics/LaningLogic';
import { RoamingLogic } from '../logics/RoamingLogic';
import { useGameStore } from '../../../store/useGameStore';

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

    const { battleSettings, roleSettings } = useGameStore.getState().gameState;
    const globalHeroes = useGameStore.getState().heroes;

    // [0] 우물 복귀 완료
    if (distToBase < 5) {
      const hpP = AIUtils.hpPercent(player);
      const mpP = AIUtils.mpPercent(player);
      if (hpP < 0.95 || (player.maxMp > 0 && mpP < 0.95)) {
        return { action: 'RECALL', targetPos: myBase, reason: '우물 회복 중' };
      }
    }

    // [1] 긴급 생존: 타워 어그로
    if (Perception.isUnderTowerAggro(player, match)) {
        return { action: 'FLEE', targetPos: myBase, reason: '🚨 타워 어그로! 긴급 탈출!' };
    }

    // [2] 긴급 생존: 수적 열세 (Outnumbered) - 잘리기 방지
    // 주변(25범위)에 적은 2명 이상인데 아군은 나 혼자면 도망
    const nearby = Perception.analyzeNearbySituation(player, match, 25);
    if (nearby.enemies.length >= 2 && nearby.allies.length === 0) {
        // 내가 압도적으로 잘 컸으면(레벨+3) 싸워볼만 함
        const avgEnemyLvl = nearby.enemies.reduce((s, e) => s + e.level, 0) / nearby.enemies.length;
        if (player.level < avgEnemyLvl + 3) {
            return { action: 'FLEE', targetPos: myBase, reason: '🏃‍♂️ 1vs다수! 도망쳐!' };
        }
    }

    // [3] 자살 방지 (타워 다이브 금지)
    const myPos = { x: player.x, y: player.y };
    if (Perception.isSuicideMove(player, myPos, match)) {
        return { action: 'FLEE', targetPos: myBase, reason: '🚫 타워 위험! 긴급 회피!' };
    }

    // [4] 스노우볼링 (Push)
    const pushScore = Perception.getPushPriority(player, match);
    if (pushScore >= 60 && AIUtils.hpPercent(player) > 0.2) {
        const towerPos = AIUtils.getNextObjectivePos(player, match, isBlue);
        if (!Perception.isSuicideMove(player, towerPos, match)) {
            return { action: 'PUSH', targetPos: towerPos, reason: '🔥 수적 우위! 진격하라!' };
        }
    }

    // [5] 킬 캐치 (Kill)
    let bestKillTarget: LivePlayer | null = null;
    let bestKillScore = 0;

    for (const enemy of nearby.enemies) {
        const killScore = KillEvaluator.evaluateKillChance(player, enemy, globalHeroes, match, battleSettings, roleSettings);
        if (killScore > 500 && KillEvaluator.isWorthTrading(player, enemy)) {
            if (killScore > bestKillScore) {
                bestKillScore = killScore;
                bestKillTarget = enemy;
            }
        }
    }

    if (bestKillTarget) {
        const targetPos = { x: bestKillTarget.x, y: bestKillTarget.y };
        if (Perception.isSuicideMove(player, targetPos, match)) {
             if (player.stats.brain > 30) {
                 return { action: 'WAIT', targetPos: { x: player.x, y: player.y }, reason: '킬각이나 타워 위험 (대기)' };
             }
        }
        return { action: 'FIGHT', targetPos: targetPos, targetUnit: bestKillTarget, reason: `🩸 킬각 포착!` };
    }

    // [6] 생존 (Recall)
    if (Perception.needsRecall(player)) {
      if (distToBase < 25) return { action: 'FLEE', targetPos: myBase, reason: '우물로 도보 이동' };
      if (nearby.enemies.length > 0 && AIUtils.dist(player, nearby.enemies[0]) < 15) {
         return { action: 'FLEE', targetPos: myBase, reason: '교전 이탈' };
      }
      return { action: 'RECALL', targetPos: myBase, reason: '정비 필요' };
    }

    // [7] 라인전 & 로밍
    if (player.lane !== 'JUNGLE' && match.currentDuration < 900) {
        const laningDecision = LaningLogic.decide(player, match, hero);
        if (laningDecision && Perception.isSuicideMove(player, laningDecision.targetPos, match)) {
             return { action: 'WAIT', targetPos: myBase, reason: '라인전: 무리하지 않음' };
        }
        if (laningDecision?.action === 'WAIT' || !laningDecision) {
            const roamDecision = RoamingLogic.checkRoaming(player, match, hero);
            if (roamDecision) return roamDecision;
        }
        if (laningDecision) return laningDecision;
    }

    // --- 중후반 운영 ---
    
    // [8] 끝내기
    const situation = Perception.analyzeSituation(player, match);
    if (situation.isEnemyWipedOut && AIUtils.hpPercent(player) > 0.3 && situation.isNexusVulnerable) {
        return { action: 'FINISH', targetPos: enemyBase, reason: '적 전멸! 끝내자!' };
    }

    // [9] 수비
    const baseThreat = Perception.isBaseUnderThreat(player, match, isBlue);
    if (baseThreat.isThreatened && baseThreat.enemyUnit) {
      return { action: 'DEFEND', targetPos: { x: baseThreat.enemyUnit.x, y: baseThreat.enemyUnit.y }, targetUnit: baseThreat.enemyUnit, reason: '본진 방어' };
    }

    // [10] 정글
    if (player.lane === 'JUNGLE' && AIUtils.hpPercent(player) > 0.6) {
        const gankTarget = GankEvaluator.evaluate(player, match, hero);
        if (gankTarget) return { action: 'GANK', targetPos: { x: gankTarget.x, y: gankTarget.y }, targetUnit: gankTarget, reason: '갱킹 시도' };
    }

    // [11] 오브젝트
    const activeObj = Perception.findActiveObjective(match);
    if (activeObj) {
      const isJungler = player.lane === 'JUNGLE';
      const distanceToObj = AIUtils.dist(player, activeObj.pos);
      if ((isJungler || distanceToObj < 40) && AIUtils.hpPercent(player) > 0.5) {
          return { action: 'OBJECTIVE', targetPos: activeObj.pos, reason: '오브젝트 합류' };
      }
    }

    // [12] 교전 (일반)
    const nearbyEnemy = Perception.findNearbyEnemy(player, match, isBlue);
    if (nearbyEnemy) {
        if (Perception.isSuicideMove(player, {x: nearbyEnemy.x, y: nearbyEnemy.y}, match)) {
             if (player.stats.brain > 30) return { action: 'FLEE', targetPos: myBase, reason: '적 타워 유인 무시' };
        }
        return { action: 'FIGHT', targetPos: { x: nearbyEnemy.x, y: nearbyEnemy.y }, targetUnit: nearbyEnemy, reason: '교전' };
    }

    // [13] 운영
    if (player.lane !== 'JUNGLE') {
        const towerPos = AIUtils.getNextObjectivePos(player, match, isBlue);
        if (Perception.isSafeToSiege(player, match, towerPos) || pushScore > 30) {
            return { action: 'PUSH', targetPos: towerPos, reason: '공성' };
        } else {
            const waitPos = { x: towerPos.x + (isBlue ? -5 : 5), y: towerPos.y + (isBlue ? -5 : 5) };
            return { action: 'WAIT', targetPos: waitPos, reason: '웨이브 대기' };
        }
    }

    const nextPath = PathSystem.getNextWaypoint(player, isBlue);
    return { action: 'FARM', targetPos: nextPath, reason: '정글링' };
  }
}
