// ==========================================
// FILE PATH: /src/engine/match/ai/pathing/JunglePathFinder.ts
// ==========================================
import { LivePlayer, LiveMatch } from '../../../../types';
// [수정] 경로 깊이 수정 (../../../ -> ../../)
import { Vector2 } from '../../utils/Vector';
import { BASES } from '../../constants/MapConstants';
// [수정] AIUtils는 상위 폴더(ai)에 있음 (../../ -> ../)
import { AIUtils } from '../AIUtils';

export class JunglePathFinder {
  
  /**
   * 정글러의 다음 이동 목표를 계산합니다.
   * 1. 살아있는 정글 몹 중 가장 가까운 곳
   * 2. (없으면) 강가(오브젝트 근처) 대기
   */
  static getNextCamp(player: LivePlayer, match: LiveMatch): Vector2 {
    const mobs = match.jungleMobs || [];
    
    // 1. 살아있는 몬스터만 필터링
    const aliveMobs = mobs.filter(m => m.isAlive);

    // 2. 몬스터가 하나도 없으면? -> 강가(오브젝트) 근처로 이동해서 대기
    if (aliveMobs.length === 0) {
        return this.getFallbackPosition(match);
    }

    // 3. 거리 기반 최적 캠프 탐색
    // (단순 거리뿐만 아니라, 버프 몹에게 가중치 부여)
    let bestTarget: Vector2 | null = null;
    let minScore = 99999;

    for (const mob of aliveMobs) {
        // 내 진영의 정글만 돌도록 유도 (초반)
        // 맵의 절반(50)을 기준으로 아군 정글 판단
        const isBlue = match.blueTeam.includes(player);
        const isMyJungle = isBlue ? (mob.x + mob.y < 100) : (mob.x + mob.y > 100);
        
        // 레벨 5 이하면 남의 정글 안 감 (안전 지향)
        if (player.level < 5 && !isMyJungle) continue;

        let dist = AIUtils.dist(player, mob);
        
        // [가중치] 버프 몹이면 거리를 30% 가깝게 인식 (우선순위 높임)
        if (mob.type === 'GOLEM') { 
            dist *= 0.7; 
        }

        if (dist < minScore) {
            minScore = dist;
            bestTarget = { x: mob.x, y: mob.y };
        }
    }

    // 갈 곳을 찾았으면 이동
    if (bestTarget) return bestTarget;

    // 갈 곳 없으면(적 정글만 남았는데 레벨 낮음 등) 집 근처 대기
    return isBlueSide(player, match) ? BASES.BLUE : BASES.RED;
  }

  private static getFallbackPosition(match: LiveMatch): Vector2 {
    // 바론/용 쪽 강가 중간 지점
    // 시간이 늦으면(10분 이후) 전장 중앙, 초반엔 바위게 위치
    if (match.currentDuration > 600) return { x: 50, y: 50 };
    return { x: 40, y: 60 }; // 미드 근처 강가
  }
}

function isBlueSide(player: LivePlayer, match: LiveMatch) {
    return match.blueTeam.includes(player);
}
