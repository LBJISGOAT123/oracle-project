import { Vector, Vector2 } from '../utils/Vector';
import { BASES, MOVEMENT_SETTINGS } from '../constants/MapConstants';
import { LivePlayer } from '../../../types';

// MapConstants에서 정의한 좌표를 역으로 가져와서 경로로 사용
// (순환 참조 방지를 위해 값 하드코딩 대신 로직으로 처리)
const LANE_TARGETS = {
  BLUE: {
    TOP: [{x: 8, y: 35}, {x: 8, y: 55}, {x: 10, y: 75}, {x: 12, y: 88}],
    MID: [{x: 40, y: 60}, {x: 30, y: 70}, {x: 22, y: 78}, {x: 12, y: 88}],
    BOT: [{x: 75, y: 92}, {x: 50, y: 90}, {x: 25, y: 88}, {x: 12, y: 88}]
  },
  RED: {
    TOP: [{x: 45, y: 10}, {x: 65, y: 12}, {x: 80, y: 15}, {x: 88, y: 12}],
    MID: [{x: 60, y: 40}, {x: 70, y: 30}, {x: 78, y: 22}, {x: 88, y: 12}],
    BOT: [{x: 92, y: 65}, {x: 92, y: 45}, {x: 88, y: 25}, {x: 88, y: 12}]
  }
};

export class PathSystem {
  static getNextWaypoint(player: LivePlayer, isBlue: boolean): Vector2 {
    const lane = player.lane === 'JUNGLE' ? 'MID' : player.lane;
    
    // 내가 가야할 목표 타워 리스트 (적 진영의 타워 위치)
    // 블루팀이면 RED 진영의 타워를 1차->2차->3차 순으로 가야 함
    const targets = isBlue ? LANE_TARGETS.RED[lane] : LANE_TARGETS.BLUE[lane];
    
    // 현재 도달해야 할 타워 인덱스 (pathIdx)
    let currentIdx = (player as any).pathIdx || 0;
    
    // 만약 다 깼으면 마지막(넥서스) 유지
    if (currentIdx >= targets.length) {
      return targets[targets.length - 1];
    }
    
    const target = targets[currentIdx];
    const dist = Vector.dist({ x: player.x, y: player.y }, target);
    
    // 타워 근처에 도달했으면 다음 타워로 목표 변경
    // 단, 타워가 실제로 깨졌는지 확인하는 로직은 SiegePhase에서 처리하므로
    // 여기서는 단순히 "도착하면 다음거"가 아니라, "도착했고 + 타워가 없으면 다음거" 로 가야 완벽하지만
    // 시뮬레이션 단순화를 위해 "도착하면 일단 멈춰서 싸우고(SiegePhase), 시간 지나면 다음거" 로직으로 감.
    
    if (dist < MOVEMENT_SETTINGS.WAYPOINT_TOLERANCE) {
      // 여기서 강제로 다음 인덱스로 넘기면 타워 무시하고 지나가버림.
      // 따라서 SiegePhase에서 타워가 깨질 때 pathIdx를 증가시켜주는게 맞음.
      // 임시로: 타워 근처에선 속도를 늦추거나 대기하게 됨 (DecisionEngine에서 처리)
      return target; 
    }
    
    return target;
  }
}
