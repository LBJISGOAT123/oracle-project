// ==========================================
// FILE PATH: /src/engine/match/ai/Perception.ts
// ==========================================
import { LivePlayer, LiveMatch } from '../../../types';
import { AIUtils } from './AIUtils';
import { POI, getDistance } from '../../data/MapData';
import { TOWER_COORDS } from '../constants/MapConstants';

export interface ThreatInfo {
  isThreatened: boolean;
  enemyUnit: any;
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

    // 탱커나 고레벨이면 미니언 없이도 칠 수 있음
    if (player.level >= 16) return true;
    const isTank = player.maxHp > 3500 && player.currentHp > player.maxHp * 0.9;
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

  // [수정] 귀환 판단 강화 (쫄보 로직)
  static needsRecall(player: LivePlayer): boolean {
    const hpPer = AIUtils.hpPercent(player);
    const mpPer = AIUtils.mpPercent(player);
    
    // 1. 체력이 35% 미만이면 무조건 위험 (기존 15%는 너무 늦음)
    if (hpPer < 0.35) return true;

    // 2. 마나 의존도가 높은데 마나가 없으면 귀환
    if (player.maxMp > 0 && mpPer < 0.15) return true;

    // 3. 돈이 3000원 넘게 쌓였으면 템사러 감 (성장 가속)
    if (player.gold > 3000 && hpPer < 0.8) return true;

    return false;
  }

  static isBaseUnderThreat(player: LivePlayer, match: LiveMatch, isBlue: boolean): ThreatInfo {
    const myBase = AIUtils.getMyBasePos(isBlue);
    const enemies = isBlue ? match.redTeam : match.blueTeam;
    const enemyMinions = match.minions || [];
    const myNexusHp = isBlue ? match.stats.blue.nexusHp : match.stats.red.nexusHp;
    
    const emergencyMode = myNexusHp < (isBlue ? match.stats.blue.maxNexusHp : match.stats.red.maxNexusHp) * 0.5;
    const threatRange = emergencyMode ? 50 : 25; 

    let closestThreat: any = null;
    let minDist = 999;

    for (const enemy of enemies) {
      if (enemy.currentHp <= 0 || enemy.respawnTimer > 0) continue;
      const d = AIUtils.dist(myBase, {x: enemy.x, y: enemy.y});
      if (d < minDist) {
        minDist = d;
        closestThreat = enemy;
      }
    }

    const enemyColossus = enemyMinions.find(m => 
        m.team !== (isBlue ? 'BLUE' : 'RED') && 
        m.type === 'SUMMONED_COLOSSUS' && 
        m.hp > 0
    );
    if (enemyColossus) {
        const d = AIUtils.dist(myBase, {x: enemyColossus.x, y: enemyColossus.y});
        if (d < minDist) {
            minDist = d;
            closestThreat = enemyColossus;
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
          if (dist < 15) {
             return { pos: tPos, enemy: enemy };
          }
        }
      }
    }
    return null;
  }

  static findNearbyEnemy(player: LivePlayer, match: LiveMatch, isBlue: boolean): LivePlayer | null {
    const enemies = isBlue ? match.redTeam : match.blueTeam;
    const sightRange = 18; // 시야 범위 약간 증가
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
    const sightRange = 30;
    const candidates = allies.filter(a => a !== player && a.currentHp > 0 && a.respawnTimer <= 0);

    for (const ally of candidates) {
      const distToAlly = AIUtils.dist(player, ally);
      if (distToAlly > sightRange) continue;
      if (AIUtils.hpPercent(ally) < 0.4) {
          for (const enemy of enemies) {
            if (enemy.currentHp > 0 && AIUtils.dist(ally, enemy) < 10) {
              return ally;
            }
          }
      }
    }
    return null;
  }
}
