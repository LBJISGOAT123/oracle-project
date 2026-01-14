// ==========================================
// FILE PATH: /src/engine/match/ai/tactics/TacticalComputer.ts
// ==========================================
import { LivePlayer, LiveMatch, Hero } from '../../../../types';
import { Vector, Vector2 } from '../../../match/utils/Vector';
import { AIUtils } from '../AIUtils';
import { TOWER_COORDS } from '../../../match/constants/MapConstants';
import { Perception } from '../Perception';

export class TacticalComputer {

  /**
   * [카이팅/무빙 로직]
   * 적의 위협을 피하면서 공격 사거리를 유지하는 최적의 위치를 계산합니다.
   */
  static getOptimalKitingPosition(
    player: LivePlayer, 
    target: LivePlayer, 
    enemies: LivePlayer[], 
    range: number
  ): Vector2 {
    const myPos = { x: player.x, y: player.y };
    const targetPos = { x: target.x, y: target.y };
    
    // 1. 기본 벡터: 타겟을 향한 방향
    let moveDir = Vector.sub(targetPos, myPos);
    const distToTarget = Vector.mag(moveDir);
    
    // 사거리 유지
    const optimalDist = range * (0.8 + (player.stats.brain / 500)); 

    if (distToTarget < optimalDist) {
        // 너무 가까우면 뒤로 빠짐
        moveDir = Vector.mult(moveDir, -1);
    }

    // 2. 위협 회피
    let avoidForce = { x: 0, y: 0 };
    for (const enemy of enemies) {
        if (enemy === target) continue;
        const dist = AIUtils.dist(player, enemy);
        const awarenessRange = 5 + (player.stats.brain / 10);
        
        if (dist < awarenessRange) {
            let push = Vector.sub(myPos, { x: enemy.x, y: enemy.y });
            push = Vector.normalize(push);
            push = Vector.mult(push, (awarenessRange - dist) * 2.0);
            avoidForce = Vector.add(avoidForce, push);
        }
    }

    const finalDir = Vector.add(Vector.normalize(moveDir), avoidForce);
    return Vector.add(myPos, Vector.mult(Vector.normalize(finalDir), 5));
  }

  /**
   * [암살자 로직]
   * 적의 측면이나 후방을 노리는 벡터를 계산합니다.
   */
  static getFlankingPosition(player: LivePlayer, target: LivePlayer): Vector2 {
    const isBlue = player.lane !== 'JUNGLE' ? player.x < 50 : true;
    const flankOffsetX = isBlue ? 10 : -10;
    return { x: target.x + flankOffsetX, y: target.y + (Math.random() * 10 - 5) };
  }

  /**
   * [탱커 로직]
   * 아군 딜러와 적 사이에 위치하려는 좌표 계산
   */
  static getPeelingPosition(player: LivePlayer, allyCarry: LivePlayer, nearestEnemy: LivePlayer): Vector2 {
    const allyPos = { x: allyCarry.x, y: allyCarry.y };
    const enemyPos = { x: nearestEnemy.x, y: nearestEnemy.y };
    return Vector.lerp(allyPos, enemyPos, 0.3);
  }

  /**
   * [스마트 타워 공략]
   * 적이 타워 안에 있을 때, 내가 서 있어야 할 최적의 위치를 계산합니다.
   */
  static getSiegePosition(
    player: LivePlayer, 
    target: LivePlayer, 
    match: LiveMatch,
    attackRange: number
  ): Vector2 {
    const isBlue = match.blueTeam.includes(player);
    const myPos = { x: player.x, y: player.y };
    const targetPos = { x: target.x, y: target.y };

    // 1. 가장 가까운 위협적인 적 타워 찾기
    const towerInfo = this.getNearestEnemyTower(player, match, isBlue);
    if (!towerInfo) return targetPos;

    const towerPos = towerInfo.pos;
    const towerRange = 13.0; 

    const targetDistToTower = AIUtils.dist(target, towerPos);

    // 2. 상황별 위치 선정
    
    // Case A: 미니언이 어그로를 끌어주고 있음 -> 안전하게 진입
    if (Perception.isSafeToSiege(player, match, towerPos)) {
        return targetPos;
    }

    // Case B: 미니언 없음 (맨몸)
    if (player.stats.brain < 30) return targetPos; // 멍청하면 그냥 들어감

    // (1) 적이 타워 깊숙이 있음 (못 때리는 위치) -> 타워 사거리 밖 대기
    if (targetDistToTower < towerRange - attackRange) {
        return this.getPointOnCircleEdge(towerPos, myPos, towerRange + 1.0);
    }

    // (2) 적이 타워 가장자리에 있음 -> 밖에서 칠 수 있으면 침
    if (attackRange > 5.0) { // 원거리
        const safeSpot = this.getPointOnCircleEdge(towerPos, targetPos, towerRange + 0.5);
        if (AIUtils.dist(safeSpot, targetPos) <= attackRange) {
            return safeSpot;
        }
    }

    // (3) 근거리인데 미니언 없음 -> 대기
    return this.getPointOnCircleEdge(towerPos, targetPos, towerRange + 1.5);
  }

  // 원의 중심(center)에서 target을 바라보는 방향으로 radius만큼 떨어진 지점 반환
  private static getPointOnCircleEdge(center: Vector2, target: Vector2, radius: number): Vector2 {
    const dir = Vector.normalize(Vector.sub(target, center));
    return Vector.add(center, Vector.mult(dir, radius));
  }

  private static getNearestEnemyTower(player: LivePlayer, match: LiveMatch, isBlue: boolean) {
      const enemyStats = isBlue ? match.stats.red : match.stats.blue;
      const towerCoords = isBlue ? TOWER_COORDS.RED : TOWER_COORDS.BLUE;
      const lanes = ['top', 'mid', 'bot'] as const;
      
      let nearest = null;
      let minDist = 999;

      // 레인 타워
      for (const lane of lanes) {
          const brokenCount = (enemyStats.towers as any)[lane];
          if (brokenCount < 3) {
              const tier = brokenCount + 1;
              // @ts-ignore
              const tPos = towerCoords[lane.toUpperCase()][tier - 1];
              const d = AIUtils.dist(player, tPos);
              if (d < minDist) { minDist = d; nearest = { pos: tPos }; }
          }
      }
      // 넥서스
      if (enemyStats.nexusHp > 0) {
          const d = AIUtils.dist(player, towerCoords.NEXUS);
          if (d < minDist) { minDist = d; nearest = { pos: towerCoords.NEXUS }; }
      }

      if (minDist > 30) return null;
      return nearest;
  }
}
