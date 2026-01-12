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

    // 1. [생존] 귀환 vs 도주
    if (Perception.needsRecall(player)) {
      // 이미 본진이면 회복 대기
      if (AIUtils.dist(player, myBase) < 5) {
        return { action: 'RECALL', targetPos: myBase, reason: '회복 대기' };
      }

      // [수정됨] 주변에 적이 있는지 확인
      const nearbyEnemy = Perception.findNearbyEnemy(player, match, isBlue);
      
      // 적이 근처에 있으면 귀환(채널링) 불가 -> 걸어서 도망(FLEE)
      if (nearbyEnemy && AIUtils.dist(player, nearbyEnemy) < 15) {
         return { action: 'FLEE', targetPos: myBase, reason: '교전 이탈' };
      }

      // 안전하면 귀환
      return { action: 'RECALL', targetPos: myBase, reason: '안전 귀환' };
    }

    // 2. [수비] 본진 방어
    const threat = Perception.isBaseUnderThreat(player, match, isBlue);
    if (threat.isThreatened && threat.enemyUnit) {
      if (Math.random() * 100 < player.stats.brain) { 
        return { action: 'DEFEND', targetPos: { x: threat.enemyUnit.x, y: threat.enemyUnit.y }, targetUnit: threat.enemyUnit, reason: '본진 방어' };
      }
    }

    // 3. [지원] 동료 백업
    if (AIUtils.hpPercent(player) > 0.4) {
        const allyInTrouble = Perception.findAllyInTrouble(player, match, isBlue);
        if (allyInTrouble) {
            const baseChance = hero.role === '수호기사' ? 80 : 50;
            const chance = baseChance + (player.stats.brain * 0.3);
            if (Math.random() * 100 < chance) {
                return { action: 'SUPPORT', targetPos: { x: allyInTrouble.x, y: allyInTrouble.y }, targetUnit: allyInTrouble, reason: '아군 지원' };
            }
        }
    }

    // 4. [갱킹] 능동적 로밍
    if (AIUtils.hpPercent(player) > 0.6) {
        const gankTarget = GankEvaluator.evaluate(player, match, hero);
        if (gankTarget) {
            return { action: 'GANK', targetPos: { x: gankTarget.x, y: gankTarget.y }, targetUnit: gankTarget, reason: '갱킹' };
        }
    }

    // 5. [오브젝트]
    const activeObj = Perception.findActiveObjective(match);
    if (activeObj) {
      const isJungler = player.lane === 'JUNGLE';
      const isLateGame = match.currentDuration > 900;
      const brain = player.stats.brain;

      if (isJungler) {
        if (AIUtils.hpPercent(player) > 0.5) return { action: 'OBJECTIVE', targetPos: activeObj.pos, reason: '오브젝트' };
      }
      else if (isLateGame || brain > 70) {
         const distanceToObj = AIUtils.dist(player, activeObj.pos);
         if (distanceToObj < 30) return { action: 'OBJECTIVE', targetPos: activeObj.pos, reason: '오브젝트 합류' };
      }
    }

    // 6. [교전] 적 조우
    const nearbyEnemy = Perception.findNearbyEnemy(player, match, isBlue);
    if (nearbyEnemy) {
      const myPower = AIUtils.getCombatPower(player);
      const enemyPower = AIUtils.getCombatPower(nearbyEnemy);
      const aggro = (100 - player.stats.brain) * 5; 
      
      if (myPower + aggro >= enemyPower) {
        return { action: 'FIGHT', targetPos: { x: nearbyEnemy.x, y: nearbyEnemy.y }, targetUnit: nearbyEnemy, reason: '교전' };
      } else {
        // 이길 수 없으면 도망 (FLEE)
        return { action: 'FLEE', targetPos: myBase, reason: '후퇴' };
      }
    }

    // 7. [진격] 라인 푸쉬
    if (player.lane !== 'JUNGLE') {
        const towerPos = AIUtils.getNextObjectivePos(player, match, isBlue);
        const distToTower = AIUtils.dist(player, towerPos);
        if (distToTower > 20) {
            const nextPath = PathSystem.getNextWaypoint(player, isBlue);
            return { action: 'FARM', targetPos: nextPath, reason: '라인 이동' };
        } else {
            return { action: 'PUSH', targetPos: towerPos, reason: '공성' };
        }
    }

    const nextPath = PathSystem.getNextWaypoint(player, isBlue);
    return { action: 'FARM', targetPos: nextPath, reason: '정글링' };
  }
}
