// ==========================================
// FILE PATH: /src/engine/match/ai/tactics/SquadSystem.ts
// ==========================================
import { LivePlayer, LiveMatch } from '../../../../types';
import { AIUtils } from '../AIUtils';
import { Vector, Vector2 } from '../../../match/utils/Vector';

export class SquadSystem {
  
  static getGroupTarget(player: LivePlayer, match: LiveMatch): Vector2 | null {
    // 뇌지컬이 60 이상이어야 합류 판단을 함 (낮으면 마이웨이)
    if (player.stats.brain < 60) return null;

    const isBlue = match.blueTeam.includes(player);
    const allies = isBlue ? match.blueTeam : match.redTeam;
    
    // 1. 아군 밀집도 계산 (Centroid)
    let centerX = 0, centerY = 0, count = 0;
    
    for (const ally of allies) {
        if (ally === player || ally.currentHp <= 0 || ally.respawnTimer > 0) continue;
        // 우물에 있는 아군은 제외 (복귀 중인 애들)
        if (AIUtils.dist(ally, AIUtils.getMyBasePos(isBlue)) < 15) continue;

        centerX += ally.x;
        centerY += ally.y;
        count++;
    }

    if (count < 2) return null; // 2명 이하면 각자도생

    const avgX = centerX / count;
    const avgY = centerY / count;
    
    // 2. 합류 가치 판단
    // 내가 너무 멀리 있으면(거리 40 이상) 합류 포기하고 스플릿
    const distToGroup = AIUtils.dist(player, {x: avgX, y: avgY});
    if (distToGroup > 40) return null;

    // 3. 근처에 적이 있으면 합류 우선순위 상승 (한타 지원)
    // (이 로직은 Perception과 연계되어야 하나, 여기선 단순화)
    
    // 합류 지점 반환
    return { x: avgX, y: avgY };
  }
}
