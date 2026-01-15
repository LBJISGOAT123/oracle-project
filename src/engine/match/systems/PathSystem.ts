// ==========================================
// FILE PATH: /src/engine/match/systems/PathSystem.ts
// ==========================================
import { Vector2 } from '../utils/Vector';
import { BASES, TOWER_COORDS } from '../constants/MapConstants';
import { LivePlayer, LiveMatch } from '../../../types';
import { JunglePathFinder } from '../ai/pathing/JunglePathFinder';

export class PathSystem {
  
  /**
   * 플레이어의 다음 이동 목표 지점을 반환합니다.
   * - 정글러: 스마트 정글링 (살아있는 몹 추적)
   * - 라이너: "살아있는 최전방 타워"를 목표로 이동 (무지성 복귀 방지)
   */
  static getNextWaypoint(player: LivePlayer, isBlue: boolean, match?: LiveMatch): Vector2 {
    
    // 1. 정글러 로직 (기존 유지)
    if (player.lane === 'JUNGLE' && match) {
        return JunglePathFinder.getNextCamp(player, match);
    }

    // 2. 라이너 로직 (완전 개편)
    // 기존의 'pathIdx' 순차 이동 방식을 버리고, '현재 전선(Frontline)'을 찾아갑니다.
    
    const defaultTarget = isBlue ? BASES.RED : BASES.BLUE; // 적 넥서스
    if (!match) return defaultTarget;

    const lane = player.lane === 'TOP' ? 'TOP' : (player.lane === 'BOT' ? 'BOT' : 'MID');
    const laneKey = lane.toLowerCase();

    // 적 진영의 타워 상태 확인
    const enemyStats = isBlue ? match.stats.red : match.stats.blue;
    const brokenCount = (enemyStats.towers as any)[laneKey];

    // [중요] 살아있는 가장 앞쪽의 적 타워 위치를 목표로 설정
    // 0개 깨짐 -> 1차 타워가 목표
    // 1개 깨짐 -> 2차 타워가 목표
    // 2개 깨짐 -> 3차 타워가 목표
    // 3개 깨짐 -> 넥서스가 목표
    let targetPos: Vector2;

    if (brokenCount < 3) {
        const tier = brokenCount + 1;
        const coords = isBlue ? TOWER_COORDS.RED : TOWER_COORDS.BLUE;
        // @ts-ignore
        targetPos = coords[lane][tier - 1];
    } else {
        const coords = isBlue ? TOWER_COORDS.RED : TOWER_COORDS.BLUE;
        targetPos = coords.NEXUS;
    }

    // [보정] 너무 목표만 보고 달리면 타워에 들이박으므로, 
    // 타워보다 살짝 앞(아군 쪽)에 멈추도록 좌표 미세 조정
    // (여기서는 정확한 좌표만 주고, 거리 조절은 LaningLogic이나 MacroBrain의 'WAIT' 액션에서 처리함)
    
    return targetPos || defaultTarget;
  }
}
