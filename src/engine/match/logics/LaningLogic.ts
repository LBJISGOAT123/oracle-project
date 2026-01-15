// ==========================================
// FILE PATH: /src/engine/match/logics/LaningLogic.ts
// ==========================================
import { LivePlayer, LiveMatch, Hero } from '../../../types';
import { AIUtils } from '../ai/AIUtils';
import { PathSystem } from '../systems/PathSystem'; 
import { MacroDecision } from '../ai/MacroBrain';
import { TOWER_COORDS } from '../constants/MapConstants';
import { InfluenceMap } from '../ai/map/InfluenceMap';

export class LaningLogic {
  
  static decide(player: LivePlayer, match: LiveMatch, hero: Hero): MacroDecision | null {
    if (player.lane === 'JUNGLE') return null;

    const isBlue = match.blueTeam.includes(player);
    
    // [1. 생존 우선] 체력 부족 시 후퇴
    if (AIUtils.hpPercent(player) < 0.3) {
        const myTower = this.getMyFrontTower(player.lane, isBlue, match);
        return { action: 'FLEE', targetPos: myTower, reason: '체력 부족' };
    }

    // [2. 갱킹 감지 - New]
    // 내 위치의 위험도가 갑자기 높아지면(적 정글 출현 등) 타워로 도망
    const dangerMap = InfluenceMap.getDangerMap(match, isBlue);
    const gx = Math.floor(player.x / 5); // Grid Size 20 기준 (100/20 = 5)
    const gy = Math.floor(player.y / 5);
    
    // 위험도 30 이상이면 갱킹 위협으로 간주 (적 영웅 1명이 50점이나, 거리 감쇠 고려)
    if (dangerMap[gy] && dangerMap[gy][gx] > 30) {
        const myTower = this.getMyFrontTower(player.lane, isBlue, match);
        return { action: 'FLEE', targetPos: myTower, reason: '갱킹 회피' };
    }

    const SIGHT_RANGE = 45; 
    
    // 3. 적 영웅 탐색 (맞딜)
    const enemies = isBlue ? match.redTeam : match.blueTeam;
    const nearbyEnemyHero = enemies.find(e => e.currentHp > 0 && AIUtils.dist(player, e) < SIGHT_RANGE);

    if (nearbyEnemyHero) {
        return { 
            action: 'FIGHT', 
            targetPos: { x: nearbyEnemyHero.x, y: nearbyEnemyHero.y }, 
            targetUnit: nearbyEnemyHero, 
            reason: '교전' 
        };
    }

    // 4. 파밍
    const minions = match.minions || [];
    const enemyMinions = minions.filter(m => 
        m.lane === player.lane && m.team !== (isBlue ? 'BLUE' : 'RED') && m.hp > 0 && AIUtils.dist(player, m) < SIGHT_RANGE
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

    // 5. 전선 복귀
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
