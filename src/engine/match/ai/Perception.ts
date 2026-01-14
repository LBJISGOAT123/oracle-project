// ==========================================
// FILE PATH: /src/engine/match/ai/Perception.ts
// ==========================================
import { LivePlayer, LiveMatch } from '../../../types';
import { AIUtils } from './AIUtils';
import { POI, getDistance } from '../../data/MapData';
import { TOWER_COORDS } from '../constants/MapConstants';

export interface ThreatInfo { isThreatened: boolean; enemyUnit: any; distance: number; }
export interface GameSituation { myTeamAlive: number; enemyTeamAlive: number; isEnemyWipedOut: boolean; powerDifference: number; hasSiegeBuff: boolean; isNexusVulnerable: boolean; }
export interface NearbyInfo { allies: LivePlayer[]; enemies: LivePlayer[]; allyPower: number; enemyPower: number; }

export class Perception {

  // [신규] "지금 타워가 나를 때리고 있는가?" (긴급 탈출용)
  static isUnderTowerAggro(player: LivePlayer, match: LiveMatch): boolean {
    const isBlue = match.blueTeam.includes(player);
    const enemyStats = isBlue ? match.stats.red : match.stats.blue;
    const towerCoords = isBlue ? TOWER_COORDS.RED : TOWER_COORDS.BLUE;
    const lanes = ['top', 'mid', 'bot'] as const;

    // 1. 내가 타워 사거리(13) 안에 있는지 확인
    let nearbyTowerPos = null;

    // 넥서스 체크
    if (enemyStats.nexusHp > 0 && AIUtils.dist(player, towerCoords.NEXUS) <= 13) {
        nearbyTowerPos = towerCoords.NEXUS;
    } 
    else {
        // 레인 타워 체크
        for (const lane of lanes) {
            const brokenCount = (enemyStats.towers as any)[lane];
            if (brokenCount < 3) {
                const tier = brokenCount + 1;
                // @ts-ignore
                const tPos = towerCoords[lane.toUpperCase()][tier - 1];
                if (tPos && AIUtils.dist(player, tPos) <= 13) {
                    nearbyTowerPos = tPos;
                    break;
                }
            }
        }
    }

    // 타워 근처가 아니면 안전
    if (!nearbyTowerPos) return false;

    // 2. 어그로 조건 체크
    // A. 내 주변(타워 근처)에 살아있는 아군 미니언이나 거신병이 있는가?
    const myMinions = match.minions || [];
    const hasMeatShield = myMinions.some(m => 
        m.team === (isBlue ? 'BLUE' : 'RED') && 
        m.hp > 0 && 
        AIUtils.dist(m, nearbyTowerPos) < 13
    );

    // 미니언이 없으면 -> 100% 내가 타겟임 -> 도망쳐야 함
    if (!hasMeatShield) return true;

    // B. 미니언이 있어도, 내가 최근(2초 내)에 적 영웅을 쳤는가? -> 타워가 나를 봄
    const lastAttackAge = match.currentDuration - (player.lastAttackTime || 0);
    if (lastAttackAge < 2.0 && player.lastAttackedTargetId) {
        // 내가 때린 대상이 적 영웅인지 확인
        const enemies = isBlue ? match.redTeam : match.blueTeam;
        const targetIsHero = enemies.some(e => e.heroId === player.lastAttackedTargetId);
        
        if (targetIsHero) return true; // 영웅 쳤으니 타워가 나를 찜함
    }

    return false;
  }
  
  // (기존 함수들 유지 - isInActiveEnemyTowerRange 등)
  static isInActiveEnemyTowerRange(pos: {x:number, y:number}, match: LiveMatch, isBlue: boolean): boolean {
    const enemyStats = isBlue ? match.stats.red : match.stats.blue;
    const towerCoords = isBlue ? TOWER_COORDS.RED : TOWER_COORDS.BLUE;
    const lanes = ['top', 'mid', 'bot'] as const;

    for (const lane of lanes) {
        const brokenCount = (enemyStats.towers as any)[lane];
        if (brokenCount < 3) {
            const tier = brokenCount + 1;
            // @ts-ignore
            const tPos = towerCoords[lane.toUpperCase()][tier - 1];
            if (tPos && AIUtils.dist(pos, tPos) <= 16) return true;
        }
    }
    if (enemyStats.nexusHp > 0) {
        if (AIUtils.dist(pos, towerCoords.NEXUS) <= 18) return true;
    }
    return false;
  }

  static isSuicideMove(player: LivePlayer, targetPos: {x:number, y:number}, match: LiveMatch): boolean {
      const isBlue = match.blueTeam.includes(player);
      if (this.isInActiveEnemyTowerRange(targetPos, match, isBlue)) {
          if (AIUtils.hpPercent(player) < 0.4) return true;
          if (!this.isSafeToSiege(player, match, targetPos)) return true;
      }
      return false;
  }

  static getPushPriority(player: LivePlayer, match: LiveMatch): number {
    const isBlue = match.blueTeam.includes(player);
    const enemies = isBlue ? match.redTeam : match.blueTeam;
    const allies = isBlue ? match.blueTeam : match.redTeam;
    const aliveEnemies = enemies.filter(e => e.currentHp > 0 && e.respawnTimer <= 0).length;
    const aliveAllies = allies.filter(a => a.currentHp > 0 && a.respawnTimer <= 0).length;
    let score = 0;
    if (aliveEnemies === 0) return 100;
    if (aliveAllies >= aliveEnemies + 2) score += 60;
    else if (aliveAllies > aliveEnemies) score += 30;
    if (player.kills > 5 || player.items.length >= 3) score += 20;
    const myStats = isBlue ? match.stats.blue : match.stats.red;
    if (myStats.activeBuffs.siegeUnit) score += 40;
    return score;
  }

  static analyzeNearbySituation(player: LivePlayer, match: LiveMatch, range: number = 25): NearbyInfo {
    const isBlue = match.blueTeam.includes(player);
    const myTeam = isBlue ? match.blueTeam : match.redTeam;
    const enemyTeam = isBlue ? match.redTeam : match.blueTeam;
    const nearbyAllies = myTeam.filter(p => p !== player && p.currentHp > 0 && AIUtils.dist(player, p) <= range);
    const nearbyEnemies = enemyTeam.filter(p => p.currentHp > 0 && AIUtils.dist(player, p) <= range);
    const calcPower = (units: LivePlayer[]) => units.reduce((acc, u) => acc + AIUtils.getCombatPower(u), 0);
    const myPower = AIUtils.getCombatPower(player);
    return { allies: nearbyAllies, enemies: nearbyEnemies, allyPower: calcPower(nearbyAllies) + myPower, enemyPower: calcPower(nearbyEnemies) };
  }

  static isSafeToSiege(player: LivePlayer, match: LiveMatch, targetPos: {x:number, y:number}): boolean {
    const isBlue = match.blueTeam.includes(player);
    const myMinions = match.minions || [];
    const nearbyMinions = myMinions.filter(m => m.team === (isBlue ? 'BLUE' : 'RED') && m.hp > 0 && getDistance(m, targetPos) < 15);
    if (nearbyMinions.length > 0) return true; 
    if (player.level < 13) return false;
    const isTank = player.maxHp > 3500 && player.currentHp > player.maxHp * 0.9;
    return isTank; 
  }

  static analyzeSituation(player: LivePlayer, match: LiveMatch): GameSituation {
    const isBlue = match.blueTeam.includes(player);
    const allies = isBlue ? match.blueTeam : match.redTeam;
    const enemies = isBlue ? match.redTeam : match.blueTeam;
    const enemyStats = isBlue ? match.stats.red : match.stats.blue;
    const myStats = isBlue ? match.stats.blue : match.stats.red;
    const myAlive = allies.filter(p => p.currentHp > 0 && p.respawnTimer <= 0).length;
    const enemyAlive = enemies.filter(p => p.currentHp > 0 && p.respawnTimer <= 0).length;
    const getPower = (team: LivePlayer[]) => team.reduce((sum, p) => sum + (p.currentHp <= 0 ? 0 : (p.level * 100)), 0);
    const isNexusVulnerable = enemyStats.towers.top >= 3 || enemyStats.towers.mid >= 3 || enemyStats.towers.bot >= 3;
    return { myTeamAlive: myAlive, enemyTeamAlive: enemyAlive, isEnemyWipedOut: enemyAlive === 0, powerDifference: getPower(allies) - getPower(enemies), hasSiegeBuff: myStats.activeBuffs.siegeUnit, isNexusVulnerable };
  }

  static needsRecall(player: LivePlayer): boolean {
    const iq = Math.max(0, Math.min(100, player.stats.brain)) / 100;
    const threshold = 0.25 - (iq * 0.15); 
    const lowMp = player.maxMp > 0 && (player.currentMp / player.maxMp) < 0.1;
    return AIUtils.hpPercent(player) < threshold || lowMp;
  }

  static isBaseUnderThreat(player: LivePlayer, match: LiveMatch, isBlue: boolean): ThreatInfo {
    const myBase = AIUtils.getMyBasePos(isBlue);
    const enemies = isBlue ? match.redTeam : match.blueTeam;
    const myNexusHp = isBlue ? match.stats.blue.nexusHp : match.stats.red.nexusHp;
    const emergencyMode = myNexusHp < 5000;
    const threatRange = emergencyMode ? 40 : 25; 
    let closestThreat: any = null;
    let minDist = 999;
    for (const enemy of enemies) {
      if (enemy.currentHp <= 0 || enemy.respawnTimer > 0) continue;
      const d = AIUtils.dist(myBase, {x: enemy.x, y: enemy.y});
      if (d < minDist) { minDist = d; closestThreat = enemy; }
    }
    if (closestThreat && minDist < threatRange) {
        return { isThreatened: true, enemyUnit: closestThreat, distance: minDist };
    }
    return { isThreatened: false, enemyUnit: null, distance: 999 };
  }

  static findNearbyEnemy(player: LivePlayer, match: LiveMatch, isBlue: boolean): LivePlayer | null {
    const enemies = isBlue ? match.redTeam : match.blueTeam;
    const sightRange = 20;
    let target: LivePlayer | null = null;
    let minDist = 999;
    for (const enemy of enemies) {
      if (enemy.currentHp <= 0 || enemy.respawnTimer > 0) continue;
      const d = AIUtils.dist(player, enemy);
      if (d <= sightRange && d < minDist) { minDist = d; target = enemy; }
    }
    return target;
  }

  static findActiveObjective(match: LiveMatch): { type: 'colossus'|'watcher', pos: {x:number, y:number} } | null {
    if (match.objectives.colossus.status === 'ALIVE') return { type: 'colossus', pos: POI.BARON };
    if (match.objectives.watcher.status === 'ALIVE') return { type: 'watcher', pos: POI.DRAGON };
    return null;
  }
}
