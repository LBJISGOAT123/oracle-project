// ==========================================
// FILE PATH: /src/engine/match/ai/evaluators/EconomyEvaluator.ts
// ==========================================
import { LivePlayer, LiveMatch } from '../../../../types';
import { AIUtils } from '../AIUtils';
import { Perception } from '../Perception';

/**
 * 경제(Economy) 상태를 분석하여 쇼핑을 위한 귀환 여부를 결정합니다.
 */
export class EconomyEvaluator {

  /**
   * 쇼핑을 위해 귀환해야 하는지 판단합니다.
   * @param player 플레이어
   * @param match 매치 정보
   * @returns 귀환 필요 여부 (true/false)
   */
  static shouldRecallForShopping(player: LivePlayer, match: LiveMatch): boolean {
    // 1. [절대 불가 조건] 교전 중이거나 위험한 상황이면 쇼핑 금지
    if (this.isInCombatOrDanger(player, match)) return false;

    // 2. [기본 조건] 골드가 너무 적으면 고려 가치 없음
    if (player.gold < 500) return false;

    const brain = player.stats.brain; // 0 ~ 100
    const itemCount = player.items.length;
    const currentGold = player.gold;

    // 3. [지능형 판단] 아이템 보유 상황에 따른 목표 골드 설정
    let targetGoldThreshold = 99999;

    if (itemCount === 0) {
      // 시작 아이템도 없다면 빠르게 복귀 (보통 게임 시작 직후)
      targetGoldThreshold = 500;
    } 
    else if (itemCount < 2) {
      // 초반: 하위템 하나 살 돈 (롱소드/증폭의고서 급 + @)
      targetGoldThreshold = 1100; 
    } 
    else if (itemCount < 6) {
      // 중후반: 코어 아이템 완성 비용 (대략 2800~3200 사이)
      // 이미 가진 돈이 많으면 바로 감
      targetGoldThreshold = 2500;
    } 
    else {
      // 풀템: 영약이나 상위템 교체용 (매우 높은 골드 필요)
      targetGoldThreshold = 3500;
    }

    // [뇌지컬 보정]
    // 뇌지컬이 높으면(>70), 돈이 딱 모였을 때 칼같이 집에 감 (효율성)
    // 뇌지컬이 낮으면(<40), 돈이 많아도 라인 더 먹으려고 버팀 (탐욕)
    if (brain > 70) targetGoldThreshold *= 0.9; // 10% 일찍 감
    else if (brain < 40) targetGoldThreshold *= 1.5; // 50% 더 모아야 감

    // 4. [상황 판단] 라인 상태 체크 (Wave Management)
    // 돈이 있어도 라인이 우리 타워에 박히고 있으면 가면 안됨 (경험치 손실)
    const isLineBad = this.isWavePushingMyTower(player, match);
    
    // 뇌지컬이 좋으면 라인 손실을 걱정해서 귀환을 미룸
    if (brain > 50 && isLineBad && currentGold < targetGoldThreshold * 1.5) {
        return false;
    }

    // 5. 최종 결정
    return currentGold >= targetGoldThreshold;
  }

  /**
   * 현재 교전 중이거나 위협을 받고 있는지 확인
   */
  private static isInCombatOrDanger(player: LivePlayer, match: LiveMatch): boolean {
    // 최근에 공격했거나 공격받음 (5초 이내)
    const now = match.currentDuration;
    if ((player.lastAttackTime && now - player.lastAttackTime < 5) || 
        (player.lastAttackedTargetId && now - (player as any).lastHitTime < 5)) {
        return true;
    }

    // 주변에 적이 있음 (시야 범위 내)
    const nearby = Perception.analyzeNearbySituation(player, match, 15);
    if (nearby.enemies.length > 0) return true;

    // 타워 어그로
    if (Perception.isUnderTowerAggro(player, match)) return true;

    return false;
  }

  /**
   * 적 미니언이 우리 타워 근처에 있는지 확인 (라인 손실 방지)
   */
  private static isWavePushingMyTower(player: LivePlayer, match: LiveMatch): boolean {
    if (player.lane === 'JUNGLE') return false;

    const isBlue = match.blueTeam.includes(player);
    const myTeamColor = isBlue ? 'BLUE' : 'RED';
    const checkRange = 20;

    // 내 타워 위치 추정 (간략화: 현재 내 위치가 타워 근처라고 가정하거나, 기지 거리로 판단)
    // 정확히는 MapConstants의 타워 좌표를 가져와야 하지만, 
    // 여기서는 플레이어가 라인에 서 있다고 가정하고 주변 적 미니언 수를 봅니다.
    
    const minions = match.minions || [];
    const enemyMinionsNearMe = minions.filter(m => 
        m.lane === player.lane && 
        m.team !== myTeamColor && 
        m.hp > 0 && 
        AIUtils.dist(player, m) < checkRange
    );

    // 내 주변에 적 미니언이 3마리 이상이면 "라인이 형성되어 있다"고 판단
    // 여기서 아군 미니언이 없으면 "박히는 라인"임.
    if (enemyMinionsNearMe.length >= 3) {
        const allyMinionsNearMe = minions.filter(m => 
            m.lane === player.lane && 
            m.team === myTeamColor && 
            m.hp > 0 && 
            AIUtils.dist(player, m) < checkRange
        );
        
        // 적 미니언은 있는데 아군 미니언이 적다 -> 라인이 밀리는 중 -> 집 가지 마라
        if (allyMinionsNearMe.length < 2) return true;
    }

    return false;
  }
}
