// ==========================================
// FILE PATH: /src/engine/match/ai/systems/RiskAssessment.ts
// ==========================================
import { LivePlayer, LiveMatch } from '../../../../types';
import { AIUtils } from '../AIUtils';
import { Perception } from '../Perception';
import { InfluenceMap } from '../map/InfluenceMap';

export class RiskAssessment {
  
  /**
   * [위험도 측정]
   * 특정 위치(targetPos)로 이동했을 때의 위험도를 0~100점으로 반환
   */
  static calculateRisk(player: LivePlayer, targetPos: {x:number, y:number}, match: LiveMatch): number {
    let risk = 0;
    const isBlue = match.blueTeam.includes(player);

    // 1. [지형 위험도] InfluenceMap 활용
    // 적 타워 근처, 적 본진 근처면 위험도 급상승
    const dangerMap = InfluenceMap.getDangerMap(match, isBlue);
    const gx = Math.floor(Math.max(0, Math.min(99, targetPos.x)) / 5);
    const gy = Math.floor(Math.max(0, Math.min(99, targetPos.y)) / 5);
    
    // InfluenceMap 값이 보통 0~200 사이로 나옴 -> 0~50으로 스케일링
    if (dangerMap[gy] && dangerMap[gy][gx]) {
        risk += Math.min(50, dangerMap[gy][gx] / 4);
    }

    // 2. [수적 열세] 주변 적 vs 아군 수
    // 타겟 지점 반경 15 내의 상황 파악
    const enemies = isBlue ? match.redTeam : match.blueTeam;
    const allies = isBlue ? match.blueTeam : match.redTeam;

    const nearbyEnemies = enemies.filter(e => e.currentHp > 0 && AIUtils.dist({x:e.x, y:e.y}, targetPos) < 15).length;
    const nearbyAllies = allies.filter(a => a !== player && a.currentHp > 0 && AIUtils.dist({x:a.x, y:a.y}, targetPos) < 15).length;

    // 나 혼자(0) vs 적(N) 상황
    // 1:2 -> 위험도 +30
    // 1:3 -> 위험도 +60
    // 1:1 -> 위험도 +0
    if (nearbyEnemies > nearbyAllies + 1) { // 나 포함하면 nearbyAllies+1
        risk += (nearbyEnemies - (nearbyAllies + 1)) * 30;
    }

    // 3. [체력 상태] 내 피가 적을수록 모든 상황이 위험함
    const hpPercent = AIUtils.hpPercent(player);
    if (hpPercent < 0.3) risk += 40;
    else if (hpPercent < 0.5) risk += 20;

    // 4. [고립 여부] 아군 타워/본진과의 거리
    const myBase = AIUtils.getMyBasePos(isBlue);
    const distToBase = AIUtils.dist(targetPos, myBase);
    
    // 적진 깊숙한 곳(거리가 70 이상)이면 위험
    if (distToBase > 70) risk += 10;

    return Math.min(100, Math.max(0, risk));
  }
}
