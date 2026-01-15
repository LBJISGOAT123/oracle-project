// ==========================================
// FILE PATH: /src/engine/match/logics/LaningLogic.ts
// ==========================================
import { LivePlayer, LiveMatch, Hero } from '../../../types';
import { AIUtils } from '../ai/AIUtils';
import { PathSystem } from '../systems/PathSystem'; 
import { MacroDecision } from '../ai/MacroBrain';
import { Collision } from '../utils/Collision';
import { TOWER_COORDS } from '../constants/MapConstants';

export class LaningLogic {
  
  static decide(player: LivePlayer, match: LiveMatch, hero: Hero): MacroDecision | null {
    if (player.lane === 'JUNGLE') return null;

    const isBlue = match.blueTeam.includes(player);
    
    // [1. 생존 우선] 체력이 30% 이하면 무조건 후퇴 (Wait/Recall)
    if (AIUtils.hpPercent(player) < 0.3) {
        // 아군 타워로 후퇴
        const myTower = this.getMyFrontTower(player.lane, isBlue, match);
        return { action: 'FLEE', targetPos: myTower, reason: '체력 부족' };
    }

    // 시야 범위 (45)
    const SIGHT_RANGE = 45; 
    
    // 2. 적 영웅 탐색
    const enemies = isBlue ? match.redTeam : match.blueTeam;
    const nearbyEnemyHero = enemies.find(e => e.currentHp > 0 && AIUtils.dist(player, e) < SIGHT_RANGE);

    if (nearbyEnemyHero) {
        // 킬각이거나 체력이 충분하면 싸움
        return { 
            action: 'FIGHT', 
            targetPos: { x: nearbyEnemyHero.x, y: nearbyEnemyHero.y }, 
            targetUnit: nearbyEnemyHero, 
            reason: '교전' 
        };
    }

    // 3. 적 미니언 탐색 & 파밍
    const minions = match.minions || [];
    const enemyMinions = minions.filter(m => 
        m.lane === player.lane && 
        m.team !== (isBlue ? 'BLUE' : 'RED') && 
        m.hp > 0 && 
        AIUtils.dist(player, m) < SIGHT_RANGE
    );

    if (enemyMinions.length > 0) {
        const target = enemyMinions.sort((a,b) => AIUtils.dist(player, a) - AIUtils.dist(player, b))[0];
        const range = hero.stats.range / 100;
        
        if (AIUtils.dist(player, target) <= range + 2) {
             return { action: 'FARM', targetPos: { x: target.x, y: target.y }, targetUnit: target as any, reason: '파밍' };
        } else {
             return { action: 'MOVE', targetPos: { x: target.x, y: target.y }, reason: '미니언 접근' };
        }
    }

    // 4. 할 일 없으면 전선으로 이동
    const nextPos = PathSystem.getNextWaypoint(player, isBlue, match);
    return { action: 'MOVE', targetPos: nextPos, reason: '전선 복귀' };
  }

  private static getMyFrontTower(lane: string, isBlue: boolean, match: LiveMatch) {
    const stats = isBlue ? match.stats.blue : match.stats.red;
    const broken = (stats.towers as any)[lane.toLowerCase()] || 0;
    const tier = Math.min(3, broken + 1);
    
    const coords = isBlue ? TOWER_COORDS.BLUE : TOWER_COORDS.RED;
    // @ts-ignore
    return coords[lane][tier-1] || coords.NEXUS;
  }
}
