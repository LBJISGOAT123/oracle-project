// ==========================================
// FILE PATH: /src/engine/match/ai/tactics/TacticalScorer.ts
// ==========================================
import { LivePlayer, LiveMatch, Hero } from '../../../../types';
import { AIUtils } from '../AIUtils';
import { Perception } from '../Perception';

export class TacticalScorer {
  
  /**
   * [전투 점수] 싸움을 걸었을 때의 이득 계산
   * - 현상금이 높을수록 점수 대폭 상승
   * - 내 전투력이 높을수록 상승
   * - 내가 현상금이 많으면(제압골드 헌납 위험) 점수 하락
   */
  static getFightScore(player: LivePlayer, target: LivePlayer, match: LiveMatch): number {
    const myPower = AIUtils.getCombatPower(player);
    const enemyPower = AIUtils.getCombatPower(target);
    
    // 1. 전투력 격차 (1.0 = 동등)
    let score = (myPower / Math.max(1, enemyPower)) * 50;

    // 2. 현상금(Bounty) 매리트
    // 현상금 100골드당 10점 추가 (1000골드면 +100점 -> 눈돌아가서 덤빔)
    const enemyBounty = target.bounty || 0;
    score += (enemyBounty / 100) * 10;

    // 3. 리스크 관리 (내 목숨값)
    // 내 현상금이 높으면 몸을 사려야 함
    const myBounty = player.bounty || 0;
    if (myBounty > 300) {
        score -= (myBounty / 100) * 5; 
    }

    // 4. 체력 상황
    const hpDiff = AIUtils.hpPercent(player) - AIUtils.hpPercent(target);
    score += hpDiff * 30;

    // 5. 뇌지컬 반영 (뇌지컬이 높으면 승산 없는 싸움 점수를 깎음)
    if (player.stats.brain > 70 && myPower < enemyPower) {
        score -= 50; 
    }

    return score;
  }

  /**
   * [오브젝트 점수] 바론/용을 먹어야 하는 정도
   * - 게임 시간이 늦을수록 점수 상승
   * - 아군이 근처에 많을수록 상승
   */
  static getObjectiveScore(player: LivePlayer, match: LiveMatch, objPos: {x:number, y:number}): number {
    let score = 0;
    
    // 1. 게임 시간 가중치 (20분 넘어가면 오브젝트 중요도 급상승)
    const timeWeight = Math.min(3.0, match.currentDuration / 600); // 10분=1.0, 30분=3.0
    score += 20 * timeWeight;

    // 2. 거리 (가까울수록 유리)
    const dist = AIUtils.dist(player, objPos);
    score -= dist * 0.5;

    // 3. 아군 합류 여부
    const isBlue = match.blueTeam.includes(player);
    const allies = isBlue ? match.blueTeam : match.redTeam;
    const alliesNearObj = allies.filter(a => a.currentHp > 0 && AIUtils.dist(a, objPos) < 30).length;
    
    if (alliesNearObj >= 2) score += 40; // 뭉치면 산다

    // 4. 정글러 가중치
    if (player.lane === 'JUNGLE') score += 50;

    return score;
  }

  /**
   * [공성 점수] 타워를 밀어야 하는 정도
   * - 앞에 적이 없으면 점수 폭등
   * - 공성 버프(거신병) 있으면 점수 상승
   */
  static getPushScore(player: LivePlayer, match: LiveMatch, towerPos: {x:number, y:number}): number {
    let score = 40; // 기본 점수

    // 1. 안전 확보 여부
    if (Perception.isSafeToSiege(player, match, towerPos)) {
        score += 30;
    }

    // 2. 공성 버프 보유
    const isBlue = match.blueTeam.includes(player);
    const hasBuff = isBlue ? match.stats.blue.activeBuffs.siegeUnit : match.stats.red.activeBuffs.siegeUnit;
    if (hasBuff) score += 50; // 거신병이랑 같이 밀자

    // 3. 적 수비 부재 확인
    const nearbyEnemy = Perception.findNearbyEnemy(player, match, isBlue);
    if (!nearbyEnemy) score += 20; // 프리 공성

    return score;
  }

  /**
   * [파밍 점수] 성장해야 하는 정도
   * - 초반일수록 높음
   * - 템 살 돈이 모이기 직전이면 높음
   */
  static getFarmScore(player: LivePlayer, match: LiveMatch): number {
    let score = 30;

    // 1. 초반 가중치 (10분 전엔 파밍이 중요)
    if (match.currentDuration < 600) score += 20;

    // 2. 템 나오기 직전 (골드 애매할 때)
    const nextItemCost = 3000; // 대략적인 코어템 가격
    if (player.gold > 2000 && player.gold < 3000) score += 30;

    return score;
  }
}
