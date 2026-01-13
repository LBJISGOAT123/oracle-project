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
      // 풀피, 풀마나가 아니면 나가지 마
      if (hpP < 0.98 || (player.maxMp > 0 && mpP < 0.95)) {
        return { action: 'RECALL', targetPos: myBase, reason: '우물 회복 중' };
      }
    }

    // [1] 생존 판단 (강화됨)
    if (Perception.needsRecall(player)) {
      // 적이 근처에 있으면 일단 튀어 (FLEE), 아니면 귀환 (RECALL)
      const nearbyEnemy = Perception.findNearbyEnemy(player, match, isBlue);
      if (nearbyEnemy && AIUtils.dist(player, nearbyEnemy) < 12) {
         return { action: 'FLEE', targetPos: myBase, reason: '생존 본능 (도주)' };
      }
      return { action: 'RECALL', targetPos: myBase, reason: '정비 필요' };
    }

    const situation = Perception.analyzeSituation(player, match);
    const enemyNexusHp = isBlue ? match.stats.red.nexusHp : match.stats.blue.nexusHp;
    const distToEnemyBase = AIUtils.dist(player, enemyBase);

    // [2] 넥서스 점사 (끝내기 각)
    if (situation.isNexusVulnerable && distToEnemyBase < 30) {
        // 적이 다 죽었거나, 넥서스 피가 적으면 무시하고 점사
        if (situation.isEnemyWipedOut || enemyNexusHp < 5000) {
            return { action: 'FINISH', targetPos: enemyBase, reason: '넥서스 점사' };
        }
    }

    // [3] 본진/타워 수비 (최우선 방어)
    const baseThreat = Perception.isBaseUnderThreat(player, match, isBlue);
    if (baseThreat.isThreatened && baseThreat.enemyUnit) {
      return { action: 'DEFEND', targetPos: { x: baseThreat.enemyUnit.x, y: baseThreat.enemyUnit.y }, targetUnit: baseThreat.enemyUnit, reason: '본진 방어' };
    }
    
    // 딸피가 아니면 타워 수비
    if (AIUtils.hpPercent(player) > 0.6) {
      const towerThreat = Perception.findThreatenedStructure(player, match, isBlue);
      if (towerThreat) {
        // 내 라인 타워거나, 정글러거나, 아주 가까우면 수비
        if (player.lane === 'JUNGLE' || AIUtils.dist(player, towerThreat.pos) < 30) {
           return { action: 'DEFEND', targetPos: towerThreat.pos, targetUnit: towerThreat.enemy, reason: '타워 수비' };
        }
      }
    }

    // [4] 라인전 로직 (초반 8분)
    // 기존 기능 유지 (LaningLogic)
    const laningDecision = LaningLogic.decide(player, match, hero);
    if (laningDecision) {
        return laningDecision;
    }

    // [5] 교전 판단 (FIGHT vs FLEE) - 여기가 과잉 킬의 원흉이었음
    const nearbyEnemy = Perception.findNearbyEnemy(player, match, isBlue);
    if (nearbyEnemy) {
      const myPower = AIUtils.getCombatPower(player);
      const enemyPower = AIUtils.getCombatPower(nearbyEnemy);
      
      // [수정] 무지성 돌격 방지
      // 내 전투력이 적보다 1.2배 이상 높거나, 뇌지컬이 낮아서(aggro) 덤비는 경우만 싸움
      // 뇌지컬이 높을수록(100에 가까울수록) 킬각을 신중하게 잼
      const aggro = (100 - player.stats.brain) * 5; // 기존 10에서 5로 감소 (덜 던짐)
      
      // [신규] 적 숫자가 더 많으면(1vs2 등) 무조건 도망
      const alliesNearby = (isBlue ? match.blueTeam : match.redTeam).filter(a => a !== player && AIUtils.dist(player, a) < 15 && a.currentHp > 0).length;
      const enemiesNearby = (isBlue ? match.redTeam : match.blueTeam).filter(e => e !== nearbyEnemy && AIUtils.dist(player, e) < 15 && e.currentHp > 0).length;

      if (enemiesNearby > alliesNearby) {
          return { action: 'FLEE', targetPos: myBase, reason: '수적 열세 (도주)' };
      }

      if (myPower + aggro >= enemyPower * 1.1) {
        return { action: 'FIGHT', targetPos: { x: nearbyEnemy.x, y: nearbyEnemy.y }, targetUnit: nearbyEnemy, reason: '유리한 교전' };
      } else {
        // 불리하면 빤스런
        return { action: 'FLEE', targetPos: myBase, reason: '불리함 (후퇴)' };
      }
    }

    // [6] 갱킹 & 로밍
    if (AIUtils.hpPercent(player) > 0.7) {
        const gankTarget = GankEvaluator.evaluate(player, match, hero);
        if (gankTarget) {
            return { action: 'GANK', targetPos: { x: gankTarget.x, y: gankTarget.y }, targetUnit: gankTarget, reason: '갱킹/로밍' };
        }
    }

    // [7] 오브젝트 (바론/용)
    const activeObj = Perception.findActiveObjective(match);
    if (activeObj) {
      const isJungler = player.lane === 'JUNGLE';
      const distanceToObj = AIUtils.dist(player, activeObj.pos);
      // 정글러거나, 가까이 있으면 합류
      if ((isJungler && AIUtils.hpPercent(player) > 0.6) || (distanceToObj < 30)) {
          return { action: 'OBJECTIVE', targetPos: activeObj.pos, reason: '오브젝트' };
      }
    }

    // [8] 라인 푸쉬 (기본 행동)
    if (player.lane !== 'JUNGLE') {
        const towerPos = AIUtils.getNextObjectivePos(player, match, isBlue);
        const distToTower = AIUtils.dist(player, towerPos);
        
        // 타워 근처면 공성 여부 판단
        if (distToTower < 18) {
            if (Perception.isSafeToSiege(player, match, towerPos)) {
                return { action: 'PUSH', targetPos: towerPos, reason: '공성' };
            } else {
                // 미니언 없으면 뒤에서 대기 (무리한 다이브 방지)
                const safePos = { 
                    x: towerPos.x + (isBlue ? -8 : 8), 
                    y: towerPos.y + (isBlue ? -8 : 8) 
                };
                return { action: 'WAIT', targetPos: safePos, reason: '미니언 대기' };
            }
        } else {
            const nextPath = PathSystem.getNextWaypoint(player, isBlue);
            return { action: 'FARM', targetPos: nextPath, reason: '라인 복귀' };
        }
    }

    // 정글러는 정글링
    const nextPath = PathSystem.getNextWaypoint(player, isBlue);
    return { action: 'FARM', targetPos: nextPath, reason: '정글링' };
  }
}
