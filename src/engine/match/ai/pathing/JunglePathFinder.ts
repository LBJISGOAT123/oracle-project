// ==========================================
// FILE PATH: /src/engine/match/ai/pathing/JunglePathFinder.ts
// ==========================================
import { LivePlayer, LiveMatch } from '../../../../types';
import { Vector2 } from '../../utils/Vector';
import { BASES } from '../../constants/MapConstants';
import { AIUtils } from '../AIUtils';
import { InfluenceMap } from '../map/InfluenceMap';

export class JunglePathFinder {
  
  static getNextCamp(player: LivePlayer, match: LiveMatch): Vector2 {
    const isBlue = match.blueTeam.includes(player);
    const myBase = isBlue ? BASES.BLUE : BASES.RED;

    // [핵심 추가] 생존 로직: 체력이 30% 미만이면 정글링 중단하고 본진으로 도망
    if (AIUtils.hpPercent(player) < 0.3) {
        return myBase;
    }

    const mobs = match.jungleMobs || [];
    const aliveMobs = mobs.filter(m => m.isAlive);

    // 몬스터 없으면 미드 합류
    if (aliveMobs.length === 0) {
        return { x: 50, y: 50 };
    }

    const dangerMap = InfluenceMap.getDangerMap(match, isBlue);
    const GRID_SIZE = 20;
    const CELL_SIZE = 5;

    let bestTarget: Vector2 | null = null;
    let minScore = 99999;

    for (const mob of aliveMobs) {
        let dist = AIUtils.dist(player, mob);
        
        // 1. 적 정글(카정) 위험도 체크
        const gx = Math.floor(mob.x / CELL_SIZE);
        const gy = Math.floor(mob.y / CELL_SIZE);
        
        let danger = 0;
        if (gx >= 0 && gx < GRID_SIZE && gy >= 0 && gy < GRID_SIZE) {
            danger = dangerMap[gy][gx];
        }

        // 위험하면 거리 페널티 (안 감)
        if (danger > 50) dist += 1000; 
        else if (danger > 20) dist += 100;

        // 2. 내 진영 우선순위
        const isMySide = isBlue ? (mob.x + mob.y < 100) : (mob.x + mob.y > 100);
        if (!isMySide) {
            // 카정 가려면 레벨 높거나 뇌지컬 좋아야 함
            if (player.level < 6 && player.stats.brain < 60) dist += 200;
            else dist += 30; // 기본적으로 남의 정글은 멈
        }

        // 3. 버프 몹 우선
        if (mob.type === 'GOLEM') dist -= 20;

        if (dist < minScore) {
            minScore = dist;
            bestTarget = { x: mob.x, y: mob.y };
        }
    }

    if (bestTarget && minScore < 500) return bestTarget;
    
    // 갈 곳 없으면 본진 혹은 미드 대기
    return myBase;
  }
}
