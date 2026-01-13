// ==========================================
// FILE PATH: /src/engine/match/ai/Perception.ts
// ==========================================
import { LivePlayer, LiveMatch } from '../../../types';
import { AIUtils } from './AIUtils';
import { POI, getDistance } from '../../data/MapData';
import { TOWER_COORDS } from '../constants/MapConstants';
import { Collision } from '../utils/Collision';

export interface ThreatInfo {
  isThreatened: boolean;
  enemyUnit: any; // LivePlayer | Minion
  distance: number;
}

export interface GameSituation {
  myTeamAlive: number;
  enemyTeamAlive: number;
  isEnemyWipedOut: boolean;
  powerDifference: number; 
  hasSiegeBuff: boolean; 
  isNexusVulnerable: boolean;
}

export class Perception {
  static isSafeToSiege(player: LivePlayer, match: LiveMatch, targetPos: {x:number, y:number}): boolean {
    const isBlue = match.blueTeam.includes(player);
    const myMinions = match.minions || [];
    
    const nearbyMinions = myMinions.filter(m => 
      m.team === (isBlue ? 'BLUE' : 'RED') && 
      m.hp > 0 &&
      getDistance(m, targetPos) < 15 
    );

    if (nearbyMinions.length > 0) return true; 

    if (player.level < 10) return false;
    const isTank = player.maxHp > 3000 && player.currentHp > player.maxHp * 0.8;
    return isTank; 
  }

  static analyzeSituation(player: LivePlayer, match: LiveMatch): GameSituation {
    const isBlue = match.blueTeam.includes(player);
    const allies = isBlue ? match.blueTeam : match.redTeam;
    const enemies = isBlue ? match.redTeam : match.blueTeam;
    const myStats = isBlue ? match.stats.blue : match.stats.red;
    const enemyStats = isBlue ? match.stats.red : match.stats.blue;

    const myAlive = allies.filter(p => p.currentHp > 0 && p.respawnTimer <= 0).length;
    const enemyAlive = enemies.filter(p => p.currentHp > 0 && p.respawnTimer <= 0).length;

    const getPower = (team: LivePlayer[]) => team.reduce((sum, p) => {
        if (p.currentHp <= 0) return sum;
        return sum + (p.level * 100) + (p.items.length * 200) + (p.currentHp / 10);
    }, 0);

    const myPower = getPower(allies);
    const enemyPower = getPower(enemies);

    const isNexusVulnerable = 
        enemyStats.towers.top >= 3 || 
        enemyStats.towers.mid >= 3 || 
        enemyStats.towers.bot >= 3;

    return {
        myTeamAlive: myAlive,
        enemyTeamAlive: enemyAlive,
        isEnemyWipedOut: enemyAlive === 0,
        powerDifference: myPower - enemyPower,
        hasSiegeBuff: myStats.activeBuffs.siegeUnit,
        isNexusVulnerable
    };
  }

  static needsRecall(player: LivePlayer): boolean {
    const iq = Math.max(0, Math.min(100, player.stats.brain)) / 100;
    const threshold = 0.15 + (iq * 0.25); 
    const lowMp = player.maxMp > 0 && (player.currentMp / player.maxMp) < 0.1;
    return AIUtils.hpPercent(player) < threshold || lowMp;
  }

  // [수정] 본진 위협 체크: 적 영웅 OR 적 거신병
  static isBaseUnderThreat(player: LivePlayer, match: LiveMatch, isBlue: boolean): ThreatInfo {
    const myBase = AIUtils.getMyBasePos(isBlue);
    const enemies = isBlue ? match.redTeam : match.blueTeam;
    const enemyMinions = match.minions || [];
    const myNexusHp = isBlue ? match.stats.blue.nexusHp : match.stats.red.nexusHp;
    
    const emergencyMode = myNexusHp < (isBlue ? match.stats.blue.maxNexusHp : match.stats.red.maxNexusHp) * 0.3;
    const threatRange = emergencyMode ? 40 : 25; 

    let closestThreat: any = null;
    let minDist = 999;

    // 1. 적 영웅 체크
    for (const enemy of enemies) {
      if (enemy.currentHp <= 0 || enemy.respawnTimer > 0) continue;
      const d = AIUtils.dist(myBase, {x: enemy.x, y: enemy.y});
      if (d < minDist) {
        minDist = d;
        closestThreat = enemy;
      }
    }

    // 2. 적 거신병 체크 (추가)
    const enemyColossus = enemyMinions.find(m => 
        m.team !== (isBlue ? 'BLUE' : 'RED') && 
        m.type === 'SUMMONED_COLOSSUS' && 
        m.hp > 0
    );
    if (enemyColossus) {
        const d = AIUtils.dist(myBase, {x: enemyColossus.x, y: enemyColossus.y});
        if (d < minDist) {
            minDist = d;
            closestThreat = enemyColossus; // 거신병이 더 가까우면 얘를 막으러 감
        }
    }

    if (closestThreat && minDist < threatRange) {
        return { isThreatened: true, enemyUnit: closestThreat, distance: minDist };
    }
    return { isThreatened: false, enemyUnit: null, distance: 999 };
  }

  static findThreatenedStructure(player: LivePlayer, match: LiveMatch, isBlue: boolean): { pos: {x:number, y:number}, enemy: LivePlayer } | null {
    const enemies = isBlue ? match.redTeam : match.blueTeam;
    const myTowers = isBlue ? match.stats.blue.towers : match.stats.red.towers;
    const towerCoords = isBlue ? TOWER_COORDS.BLUE : TOWER_COORDS.RED;
    const lanes = ['TOP', 'MID', 'BOT'];
    
    for (const lane of lanes) {
      const brokenCount = (myTowers as any)[lane.toLowerCase()];
      if (brokenCount >= 3) continue; 
      const currentTier = brokenCount + 1; 
      // @ts-ignore
      const tPos = towerCoords[lane][currentTier - 1]; 
      if (!tPos) continue;

      for (const enemy of enemies) {
        if (enemy.currentHp > 0 && enemy.respawnTimer <= 0) {
          const dist = getDistance({x: tPos.x, y: tPos.y}, enemy);
          if (dist < 12) {
             return { pos: tPos, enemy: enemy };
          }
        }
      }
    }
    return null;
  }

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

  static findActiveObjective(match: LiveMatch): { type: 'colossus'|'watcher', pos: {x:number, y:number} } | null {
    if (match.objectives.colossus.status === 'ALIVE') return { type: 'colossus', pos: POI.BARON };
    if (match.objectives.watcher.status === 'ALIVE') return { type: 'watcher', pos: POI.DRAGON };
    return null;
  }

  static findAllyInTrouble(player: LivePlayer, match: LiveMatch, isBlue: boolean): LivePlayer | null {
    const allies = isBlue ? match.blueTeam : match.redTeam;
    const enemies = isBlue ? match.redTeam : match.blueTeam;
    const sightRange = 25;
    const candidates = allies.filter(a => a !== player && a.currentHp > 0 && a.respawnTimer <= 0);

    for (const ally of candidates) {
      const distToAlly = AIUtils.dist(player, ally);
      if (distToAlly > sightRange) continue;
      if (AIUtils.hpPercent(ally) < 0.5) return ally;
      for (const enemy of enemies) {
        if (enemy.currentHp > 0 && AIUtils.dist(ally, enemy) < 8) {
          return ally;
        }
      }
    }
    return null;
  }
}
