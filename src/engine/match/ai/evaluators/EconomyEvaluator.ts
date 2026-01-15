// ==========================================
// FILE PATH: /src/engine/match/ai/evaluators/EconomyEvaluator.ts
// ==========================================
import { LivePlayer, LiveMatch } from '../../../../types';
import { AIUtils } from '../AIUtils';
import { Perception } from '../Perception';
import { BASES } from '../../constants/MapConstants';

export class EconomyEvaluator {

  static shouldRecallForShopping(player: LivePlayer, match: LiveMatch): boolean {
    const isBlue = match.blueTeam.includes(player);
    const myBase = isBlue ? BASES.BLUE : BASES.RED;
    
    // 1. [상태 체크] 이미 우물 근처(거리 15 이내)라면 굳이 '귀환 판단'을 내릴 필요 없음 (이미 쇼핑 가능 지역)
    if (AIUtils.dist(player, myBase) < 15) return false;

    // 2. [안전 체크] 교전 중이거나 위협받으면 쇼핑 금지
    if (this.isInCombatOrDanger(player, match)) return false;

    const itemCount = player.items.length;
    const currentGold = player.gold;
    const brain = player.stats.brain; 

    // 3. [지능형 목표 골드 설정]
    let targetGoldThreshold = 99999; // 기본값: 집에 가지 마라

    if (itemCount < 6) {
        // 템창이 남았을 때
        if (itemCount === 0) {
            targetGoldThreshold = 450; // 시작 아이템
        } else if (itemCount < 3) {
            targetGoldThreshold = 800; // 초반: 하위템 구매
        } else {
            // 중반: 코어템 완성 비용 (비싼 거 사러 감)
            targetGoldThreshold = 1200;
        }
        
        // 뇌지컬 보정: 뇌지컬이 높을수록 돈을 더 확실히 모아서 감
        if (brain > 60) targetGoldThreshold *= 1.2;

    } else {
        // [핵심 수정] 템창(6칸)이 꽉 찼으면 절대 쇼핑하러 가지 않음 (무한 루프 방지)
        // 나중에 영약이나 상위템 교체 로직이 생기면 그때 조건 추가
        return false; 
    }

    // 4. [라인 상황 판단]
    // 라인이 우리 타워에 박히고 있으면, 돈이 있어도 막으러 가야 함
    const isLineBad = this.isWavePushingMyTower(player, match);
    if (isLineBad) {
        // 라인이 급하면 필요 골드의 2.5배가 있어도 안 감
        targetGoldThreshold *= 2.5;
    }

    // 최종 판단
    return currentGold >= targetGoldThreshold;
  }

  private static isInCombatOrDanger(player: LivePlayer, match: LiveMatch): boolean {
    const now = match.currentDuration;
    // 최근 5초간 전투 했으면 금지
    if ((player.lastAttackTime && now - player.lastAttackTime < 5) || 
        (player.lastAttackedTargetId && (player as any).lastHitTime && now - (player as any).lastHitTime < 5)) {
        return true;
    }
    // 주변에 적이 있으면 금지
    const nearby = Perception.analyzeNearbySituation(player, match, 20);
    if (nearby.enemies.length > 0) return true;
    
    return false;
  }

  private static isWavePushingMyTower(player: LivePlayer, match: LiveMatch): boolean {
    if (player.lane === 'JUNGLE') return false;
    const isBlue = match.blueTeam.includes(player);
    const myTeamColor = isBlue ? 'BLUE' : 'RED';
    
    const minions = match.minions || [];
    // 내 근처(25)에 적 미니언은 있는데 아군 미니언이 없다? -> 라인 밀리는 중
    const enemyMinionsNear = minions.filter(m => m.lane === player.lane && m.team !== myTeamColor && m.hp > 0 && AIUtils.dist(player, m) < 25);
    const allyMinionsNear = minions.filter(m => m.lane === player.lane && m.team === myTeamColor && m.hp > 0 && AIUtils.dist(player, m) < 25);
    
    if (enemyMinionsNear.length > 0 && allyMinionsNear.length === 0) return true;
    return false;
  }
}
