// ==========================================
// FILE PATH: /src/engine/match/ai/tactics/TacticalComputer.ts
// ==========================================
import { LivePlayer, LiveMatch } from '../../../../types';
import { Vector, Vector2 } from '../../../match/utils/Vector';
import { AIUtils } from '../AIUtils';
import { InfluenceMap } from '../map/InfluenceMap'; // [New]

export class TacticalComputer {

  /**
   * [지능형 카이팅]
   * 단순히 뒤로 빠지는 게 아니라, '영향력 지도(InfluenceMap)'상 안전한 곳으로 무빙샷
   */
  static getOptimalKitingPosition(
    player: LivePlayer, 
    target: LivePlayer, 
    match: LiveMatch,
    range: number
  ): Vector2 {
    const myPos = { x: player.x, y: player.y };
    
    // 1. 기본 카이팅 방향 (타겟 반대)
    let kitingDir = Vector.normalize(Vector.sub(myPos, {x: target.x, y: target.y}));
    
    // 2. Influence Map을 이용해 '안전하면서도 사거리가 닿는' 위치 탐색
    // 현재 위치 주변 8방향 중 가장 안전한 곳 찾기
    const safePos = InfluenceMap.getOptimalPos(player, match, {x: target.x, y: target.y});
    
    // 안전한 위치 쪽으로 힘을 줌
    const safetyDir = Vector.normalize(Vector.sub(safePos, myPos));
    
    // 카이팅 벡터와 안전 벡터 합성
    const finalDir = Vector.normalize(Vector.add(kitingDir, Vector.mult(safetyDir, 1.5)));
    
    return Vector.add(myPos, Vector.mult(finalDir, 3.0));
  }

  /**
   * [암살자 로직]
   * 적의 후방(Flank)을 노리는 위치 계산
   */
  static getFlankingPosition(player: LivePlayer, target: LivePlayer): Vector2 {
    const isBlue = player.lane !== 'JUNGLE' ? player.x < 50 : true;
    // 적의 뒤쪽 대각선 방향
    const flankOffsetX = isBlue ? 10 : -10;
    const flankOffsetY = (Math.random() - 0.5) * 10;
    return { x: target.x + flankOffsetX, y: target.y + flankOffsetY };
  }

  /**
   * [탱커 로직]
   * 아군 딜러와 적 사이에 위치 (Peeling)
   */
  static getPeelingPosition(player: LivePlayer, allyCarry: LivePlayer, nearestEnemy: LivePlayer): Vector2 {
    const allyPos = { x: allyCarry.x, y: allyCarry.y };
    const enemyPos = { x: nearestEnemy.x, y: nearestEnemy.y };
    // 아군 3 : 적 7 지점 (적 쪽에 좀 더 가깝게 비벼줌)
    return Vector.lerp(allyPos, enemyPos, 0.7);
  }
}
