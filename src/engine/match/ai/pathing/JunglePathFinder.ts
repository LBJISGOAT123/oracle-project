// ==========================================
// FILE PATH: /src/engine/match/ai/pathing/JunglePathFinder.ts
// ==========================================
import { LivePlayer, LiveMatch } from '../../../../types';
import { Vector2 } from '../../utils/Vector';
import { BASES } from '../../constants/MapConstants';
import { AIUtils } from '../AIUtils';

export class JunglePathFinder {
  
  static getNextCamp(player: LivePlayer, match: LiveMatch): Vector2 {
    const mobs = match.jungleMobs || [];
    const aliveMobs = mobs.filter(m => m.isAlive);

    // 몬스터 없으면 미드 강가로 이동해서 싸움 유도
    if (aliveMobs.length === 0) {
        return { x: 50, y: 50 };
    }

    let bestTarget: Vector2 | null = null;
    let minScore = 99999;

    const isBlue = match.blueTeam.includes(player);

    for (const mob of aliveMobs) {
        let dist = AIUtils.dist(player, mob);
        
        // 내 진영 정글 우선순위 (안전 지향)
        const isMySide = isBlue ? (mob.x + mob.y < 100) : (mob.x + mob.y > 100);
        if (!isMySide && player.level < 4) dist += 50; 

        // 버프 몹 우선
        if (mob.type === 'GOLEM') dist -= 20;

        if (dist < minScore) {
            minScore = dist;
            bestTarget = { x: mob.x, y: mob.y };
        }
    }

    if (bestTarget) return bestTarget;
    return isBlue ? BASES.BLUE : BASES.RED;
  }
}
