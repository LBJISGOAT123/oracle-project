// ==========================================
// FILE PATH: /src/engine/match/ai/tactics/SquadSystem.ts
// ==========================================
import { LivePlayer, LiveMatch } from '../../../../types';
import { AIUtils } from '../AIUtils';
import { Vector, Vector2 } from '../../../match/utils/Vector';
import { BASES } from '../../constants/MapConstants';

export class SquadSystem {
  
  /**
   * [전략적 집결지 계산]
   * 아군들이 모여야 할 최적의 장소를 반환합니다.
   * 1. 아군 본대가 있는 곳
   * 2. 또는 가장 많이 밀린 라인의 최전방 미니언 위치
   */
  static getAssemblyPoint(player: LivePlayer, match: LiveMatch): Vector2 | null {
    const isBlue = match.blueTeam.includes(player);
    const allies = isBlue ? match.blueTeam : match.redTeam;
    
    // 살아있는 아군들만 고려
    const activeAllies = allies.filter(a => a.currentHp > 0 && a.respawnTimer <= 0 && a !== player);
    
    if (activeAllies.length < 2) return null; // 뭉칠 아군이 없음

    // 1. 아군 군집 중심점 (Centroid) 계산
    let sumX = 0, sumY = 0;
    activeAllies.forEach(a => { sumX += a.x; sumY += a.y; });
    const centerX = sumX / activeAllies.length;
    const centerY = sumY / activeAllies.length;
    const centerPos = { x: centerX, y: centerY };

    // 2. 만약 아군들이 흩어져 있다면? -> 목표물(미드/오브젝트) 중심으로 모임
    // 아군들이 서로 30 이상 떨어져 있으면 흩어진 것으로 간주
    const spread = activeAllies.reduce((s, a) => s + AIUtils.dist(a, centerPos), 0) / activeAllies.length;
    
    if (spread > 30) {
        // 가장 잘 큰 아군(캐리)에게 합류
        const carry = activeAllies.sort((a,b) => b.gold - a.gold)[0];
        if (carry) return { x: carry.x, y: carry.y };
        
        // 아니면 미드 중앙으로
        return { x: 50, y: 50 };
    }

    return centerPos;
  }

  /**
   * [한타 개시 여부 판단]
   * 지금 싸움을 걸어야 하는가?
   */
  static shouldInitiateFight(player: LivePlayer, match: LiveMatch): boolean {
    const nearby = this.getNearbyStats(player, match, 25);
    
    // 1. 수적 우위 (5vs4, 4vs3 등)
    if (nearby.allyCount > nearby.enemyCount) return true;

    // 2. 전투력 우위 (1.2배 이상)
    if (nearby.powerRatio > 1.2) return true;

    // 3. 내가 탱커고, 아군 딜러가 뒤에 있으면 이니시
    if (player.role === '수호기사' && nearby.allyCount >= 3 && nearby.powerRatio > 0.9) return true;

    return false;
  }

  private static getNearbyStats(player: LivePlayer, match: LiveMatch, range: number) {
      const isBlue = match.blueTeam.includes(player);
      const allies = isBlue ? match.blueTeam : match.redTeam;
      const enemies = isBlue ? match.redTeam : match.blueTeam;

      const nearbyAllies = allies.filter(a => a.currentHp > 0 && AIUtils.dist(player, a) <= range);
      const nearbyEnemies = enemies.filter(e => e.currentHp > 0 && AIUtils.dist(player, e) <= range);

      const allyPower = nearbyAllies.reduce((s, a) => s + AIUtils.getCombatPower(a), 0);
      const enemyPower = nearbyEnemies.reduce((s, e) => s + AIUtils.getCombatPower(e), 0);

      return {
          allyCount: nearbyAllies.length,
          enemyCount: nearbyEnemies.length,
          powerRatio: allyPower / Math.max(1, enemyPower)
      };
  }
}
