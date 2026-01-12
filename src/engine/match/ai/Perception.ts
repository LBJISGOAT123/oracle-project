import { LivePlayer, LiveMatch, Hero } from '../../../types';
import { AIUtils } from './AIUtils';
import { POI } from '../../data/MapData';

export interface ThreatInfo {
  isThreatened: boolean;
  enemyUnit: LivePlayer | null;
  distance: number;
}

export class Perception {
  // [기존] 생존 체크
  static needsRecall(player: LivePlayer): boolean {
    const iq = Math.max(0, Math.min(100, player.stats.brain)) / 100;
    const threshold = 0.1 + (iq * 0.2); 
    return AIUtils.hpPercent(player) < threshold;
  }

  // [기존] 본진 위협 체크
  static isBaseUnderThreat(player: LivePlayer, match: LiveMatch, isBlue: boolean): ThreatInfo {
    const myBase = AIUtils.getMyBasePos(isBlue);
    const enemies = isBlue ? match.redTeam : match.blueTeam;
    
    let closestEnemy: LivePlayer | null = null;
    let minBaseDist = 999;

    for (const enemy of enemies) {
      if (enemy.currentHp <= 0 || enemy.respawnTimer > 0) continue;
      const d = AIUtils.dist(myBase, {x: enemy.x, y: enemy.y});
      if (d < minBaseDist) {
        minBaseDist = d;
        closestEnemy = enemy;
      }
    }

    if (closestEnemy && minBaseDist < 30) {
      return { isThreatened: true, enemyUnit: closestEnemy, distance: minBaseDist };
    }
    return { isThreatened: false, enemyUnit: null, distance: 999 };
  }

  // [기존] 적 조우 체크
  static findNearbyEnemy(player: LivePlayer, match: LiveMatch, isBlue: boolean): LivePlayer | null {
    const enemies = isBlue ? match.redTeam : match.blueTeam;
    const sightRange = 15;

    let target: LivePlayer | null = null;
    let minDist = 999;

    for (const enemy of enemies) {
      if (enemy.currentHp <= 0 || enemy.respawnTimer > 0) continue;
      const d = AIUtils.dist(player, enemy);
      if (d <= sightRange && d < minDist) {
        minDist = d;
        target = enemy;
      }
    }
    return target;
  }

  // [기존] 오브젝트 탐색
  static findActiveObjective(match: LiveMatch): { type: 'colossus'|'watcher', pos: {x:number, y:number} } | null {
    if (match.objectives.colossus.status === 'ALIVE') return { type: 'colossus', pos: POI.BARON };
    if (match.objectives.watcher.status === 'ALIVE') return { type: 'watcher', pos: POI.DRAGON };
    return null;
  }

  /**
   * [신규] 위기에 처한 아군 탐색 (백업용)
   * - 시야 범위(20) 내에 있고
   * - 체력이 50% 미만이거나
   * - 적과 매우 가까이 붙어있는(교전 중) 아군
   */
  static findAllyInTrouble(player: LivePlayer, match: LiveMatch, isBlue: boolean): LivePlayer | null {
    const allies = isBlue ? match.blueTeam : match.redTeam;
    const enemies = isBlue ? match.redTeam : match.blueTeam;
    const sightRange = 20;

    // 나는 제외
    const candidates = allies.filter(a => a !== player && a.currentHp > 0 && a.respawnTimer <= 0);

    for (const ally of candidates) {
      const distToAlly = AIUtils.dist(player, ally);
      if (distToAlly > sightRange) continue;

      // 1. 아군 체력이 낮은 경우 (구조 필요)
      if (AIUtils.hpPercent(ally) < 0.5) return ally;

      // 2. 아군이 적과 교전 중인 경우 (지원 필요)
      for (const enemy of enemies) {
        if (enemy.currentHp > 0 && AIUtils.dist(ally, enemy) < 5) {
          return ally;
        }
      }
    }
    return null;
  }
}
