// ==========================================
// FILE PATH: /src/engine/match/systems/PathSystem.ts
// ==========================================
import { Vector2 } from '../utils/Vector';
import { BASES, TOWER_COORDS, LANE_FRONTS } from '../constants/MapConstants';
import { LivePlayer, LiveMatch } from '../../../types';
import { JunglePathFinder } from '../ai/pathing/JunglePathFinder';
import { AIUtils } from '../ai/AIUtils';

export class PathSystem {
  
  static getNextWaypoint(player: LivePlayer, isBlue: boolean, match?: LiveMatch): Vector2 {
    
    // 1. 정글러
    if (player.lane === 'JUNGLE' && match) {
        return JunglePathFinder.getNextCamp(player, match);
    }

    // 2. 라이너
    const defaultTarget = isBlue ? BASES.RED : BASES.BLUE;
    if (!match) return defaultTarget;

    // 미니언 추적
    const myMinions = match.minions?.filter(m => 
        m.lane === player.lane && 
        m.team === (isBlue ? 'BLUE' : 'RED') && 
        m.hp > 0
    ) || [];

    if (myMinions.length > 0) {
        // 가장 앞에 있는 미니언 따라가기
        myMinions.sort((a, b) => AIUtils.dist(a, defaultTarget) - AIUtils.dist(b, defaultTarget));
        const frontMinion = myMinions[0];
        
        // 미니언과 겹치지 않게 살짝 분산
        const offsetX = (Math.random() - 0.5) * 4;
        const offsetY = (Math.random() - 0.5) * 4;
        return { x: frontMinion.x + offsetX, y: frontMinion.y + offsetY };
    }

    // [핵심] 미니언이 없으면? -> 타워가 아니라 '라인 격전지'로 직행
    // 타워가 깨졌는지 확인
    const laneKey = player.lane.toLowerCase();
    const myStats = isBlue ? match.stats.blue : match.stats.red;
    const brokenCount = (myStats.towers as any)[laneKey];

    // 1차 타워가 아직 있으면 -> 라인 중앙(격전지)으로 이동
    if (brokenCount === 0) {
        // @ts-ignore
        return LANE_FRONTS[player.lane] || LANE_FRONTS.MID;
    }

    // 1차가 깨졌으면 -> 그 다음 타워 앞에서 수비
    return this.getTowerPos(player.lane, brokenCount + 1, isBlue);
  }

  private static getTowerPos(lane: string, tier: number, isBlue: boolean) {
      if (tier > 3) return isBlue ? BASES.BLUE : BASES.RED; 
      const coords = isBlue ? TOWER_COORDS.BLUE : TOWER_COORDS.RED;
      // @ts-ignore
      return coords[lane][tier - 1] || coords.NEXUS;
  }
}
