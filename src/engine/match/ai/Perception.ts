import { LivePlayer, LiveMatch } from '../../../types';
import { AIUtils } from './AIUtils';
import { POI, getDistance, BASES } from '../../data/MapData';
import { TOWER_COORDS, FOUNTAIN_AREAS } from '../constants/MapConstants';

export interface ThreatInfo { isThreatened: boolean; enemyUnit: any; distance: number; }
export interface GameSituation { 
    myTeamAlive: number; 
    enemyTeamAlive: number; 
    isEnemyWipedOut: boolean; 
    hasNumberAdvantage: boolean;
    powerDifference: number; 
    combatPowerRatio: number;
    hasSiegeBuff: boolean; 
    isNexusVulnerable: boolean; 
}
export interface NearbyInfo { allies: LivePlayer[]; enemies: LivePlayer[]; allyPower: number; enemyPower: number; }

export class Perception {

  static calculateTeamPower(team: LivePlayer[]): number {
    return team.reduce((sum, p) => {
        if (!p || p.currentHp <= 0) return sum;
        let power = (p.level * 100) + ((p.gold || 0) / 10);
        power *= AIUtils.hpPercent(p);
        const cooldowns = p.cooldowns || { q:0, w:0, e:0, r:0 };
        if ((cooldowns as any).r <= 0) power *= 1.2;
        return sum + power;
    }, 0);
  }

  static analyzeNearbySituation(player: LivePlayer, match: LiveMatch, range: number = 25): NearbyInfo {
    const isBlue = match.blueTeam.includes(player);
    const myTeam = isBlue ? match.blueTeam : match.redTeam;
    const enemyTeam = isBlue ? match.redTeam : match.blueTeam;
    
    const nearbyAllies: LivePlayer[] = [];
    const nearbyEnemies: LivePlayer[] = [];

    for (const p of myTeam) {
        if (p !== player && p.currentHp > 0) {
            if (AIUtils.dist(player, p) <= range) nearbyAllies.push(p);
        }
    }

    for (const p of enemyTeam) {
        if (p.currentHp > 0) {
            if (AIUtils.dist(player, p) <= range) nearbyEnemies.push(p);
        }
    }
    
    const allyPower = this.calculateTeamPower([player, ...nearbyAllies]);
    const enemyPower = this.calculateTeamPower(nearbyEnemies);

    return { allies: nearbyAllies, enemies: nearbyEnemies, allyPower, enemyPower };
  }

  // [신규] 적이 우물(레이저 범위) 안에 있는지 확인
  static isInEnemyFountain(targetPos: {x:number, y:number}, match: LiveMatch, isBlueMyTeam: boolean): boolean {
      const enemyFountain = isBlueMyTeam ? FOUNTAIN_AREAS.RED : FOUNTAIN_AREAS.BLUE;
      // FOUNTAIN_AREAS: { x, y, w, h }
      // 우물 안쪽 깊숙이는 절대 진입 금지 (x,y 기준으로 약간 여유 둠)
      
      const inX = targetPos.x >= enemyFountain.x && targetPos.x <= enemyFountain.x + enemyFountain.w;
      const inY = targetPos.y >= enemyFountain.y && targetPos.y <= enemyFountain.y + enemyFountain.h;
      
      return inX && inY;
  }

  static isUnderTowerAggro(player: LivePlayer, match: LiveMatch): boolean {
    const isBlue = match.blueTeam.includes(player);
    const enemyStats = isBlue ? match.stats.red : match.stats.blue;
    const towerCoords = isBlue ? TOWER_COORDS.RED : TOWER_COORDS.BLUE;
    const lanes = ['top', 'mid', 'bot'] as const;

    let nearbyTowerPos = null;

    if (enemyStats.nexusHp > 0 && AIUtils.dist(player, towerCoords.NEXUS) <= 16) {
        nearbyTowerPos = towerCoords.NEXUS;
    } 
    else {
        for (const lane of lanes) {
            const brokenCount = (enemyStats.towers as any)[lane];
            if (brokenCount < 3) {
                const tier = brokenCount + 1;
                // @ts-ignore
                const tPos = towerCoords[lane.toUpperCase()][tier - 1];
                if (tPos && AIUtils.dist(player, tPos) <= 14) {
                    nearbyTowerPos = tPos;
                    break;
                }
            }
        }
    }

    if (!nearbyTowerPos) return false;

    const myMinions = match.minions || [];
    const hasMeatShield = myMinions.some(m => 
        m.team === (isBlue ? 'BLUE' : 'RED') && 
        m.hp > 0 && 
        AIUtils.dist(m, nearbyTowerPos) < 14
    );

    if (!hasMeatShield) return true;

    const lastAttackAge = match.currentDuration - (player.lastAttackTime || 0);
    if (lastAttackAge < 2.0 && player.lastAttackedTargetId) {
        const enemies = isBlue ? match.redTeam : match.blueTeam;
        const targetIsHero = enemies.some(e => e.heroId === player.lastAttackedTargetId);
        if (targetIsHero) return true; 
    }

    return false;
  }
  
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
      
      // [신규] 우물 다이브는 무조건 자살 행위 (절대 금지)
      if (this.isInEnemyFountain(targetPos, match, isBlue)) return true;

      if (this.isInActiveEnemyTowerRange(targetPos, match, isBlue)) {
          const allies = isBlue ? match.blueTeam : match.redTeam;
          const nearbyAllies = allies.filter(a => a !== player && a.currentHp > 0 && AIUtils.dist(a, targetPos) < 15);
          
          if (nearbyAllies.length >= 2 && player.maxHp > 3000 && AIUtils.hpPercent(player) > 0.6) {
              return false; 
          }

          if (AIUtils.hpPercent(player) < 0.4) return true;
          if (!this.isSafeToSiege(player, match, targetPos)) return true;
      }
      return false;
  }

  static isSafeToSiege(player: LivePlayer, match: LiveMatch, targetPos: {x:number, y:number}): boolean {
    const isBlue = match.blueTeam.includes(player);
    const myMinions = match.minions || [];
    const nearbyMinions = myMinions.filter(m => m.team === (isBlue ? 'BLUE' : 'RED') && m.hp > 0 && getDistance(m, targetPos) < 15);
    
    if (nearbyMinions.length > 0) return true; 
    if (match.currentDuration > 1500 && AIUtils.hpPercent(player) > 0.8) return true;
    
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
    
    const myPower = this.calculateTeamPower(allies);
    const enemyPower = this.calculateTeamPower(enemies);
    const powerRatio = myPower / Math.max(1, enemyPower);

    const isNexusVulnerable = enemyStats.towers.top >= 3 || enemyStats.towers.mid >= 3 || enemyStats.towers.bot >= 3;
    
    return { 
        myTeamAlive: myAlive, 
        enemyTeamAlive: enemyAlive, 
        isEnemyWipedOut: enemyAlive === 0, 
        hasNumberAdvantage: myAlive > enemyAlive, 
        powerDifference: myPower - enemyPower, 
        combatPowerRatio: powerRatio,
        hasSiegeBuff: myStats.activeBuffs.siegeUnit, 
        isNexusVulnerable 
    };
  }

  static needsRecall(player: LivePlayer): boolean {
    const brain = player.stats?.brain || 50; 
    const iq = Math.max(0, Math.min(100, brain)) / 100;
    const threshold = 0.25 - (iq * 0.15); 
    const lowMp = player.maxMp > 0 && (player.currentMp / player.maxMp) < 0.1;
    return AIUtils.hpPercent(player) < threshold || lowMp;
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
}
