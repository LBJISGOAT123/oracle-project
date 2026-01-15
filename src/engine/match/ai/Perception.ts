// ==========================================
// FILE PATH: /src/engine/match/ai/Perception.ts
// ==========================================
import { LivePlayer, LiveMatch } from '../../../types';
import { AIUtils } from './AIUtils';
import { POI, getDistance } from '../../data/MapData';
import { TOWER_COORDS } from '../constants/MapConstants';

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

  // [전투력 계산] 안전장치 추가됨
  static calculateTeamPower(team: LivePlayer[]): number {
    return team.reduce((sum, p) => {
        if (!p || p.currentHp <= 0) return sum;
        
        // 1. 기본: 레벨 + 아이템 가치
        let power = (p.level * 100) + ((p.gold || 0) / 10);
        
        // 2. 체력 상태 반영
        power *= AIUtils.hpPercent(p);

        // 3. 주요 스킬(궁극기) 보유 여부 (안전장치 추가: cooldowns가 없으면 0으로 취급)
        const cooldowns = p.cooldowns || { q:0, w:0, e:0, r:0 };
        if ((cooldowns as any).r <= 0) power *= 1.2;

        return sum + power;
    }, 0);
  }

  static isUnderTowerAggro(player: LivePlayer, match: LiveMatch): boolean {
    const isBlue = match.blueTeam.includes(player);
    const enemyStats = isBlue ? match.stats.red : match.stats.blue;
    const towerCoords = isBlue ? TOWER_COORDS.RED : TOWER_COORDS.BLUE;
    const lanes = ['top', 'mid', 'bot'] as const;

    let nearbyTowerPos = null;

    if (enemyStats.nexusHp > 0 && AIUtils.dist(player, towerCoords.NEXUS) <= 13) {
        nearbyTowerPos = towerCoords.NEXUS;
    } 
    else {
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

    if (!nearbyTowerPos) return false;

    const myMinions = match.minions || [];
    const hasMeatShield = myMinions.some(m => 
        m.team === (isBlue ? 'BLUE' : 'RED') && 
        m.hp > 0 && 
        AIUtils.dist(m, nearbyTowerPos) < 13
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

  static getPushPriority(player: LivePlayer, match: LiveMatch): number {
    const isBlue = match.blueTeam.includes(player);
    const enemies = isBlue ? match.redTeam : match.blueTeam;
    const allies = isBlue ? match.blueTeam : match.redTeam;
    
    const aliveEnemies = enemies.filter(e => e.currentHp > 0 && e.respawnTimer <= 0).length;
    const aliveAllies = allies.filter(a => a.currentHp > 0 && a.respawnTimer <= 0).length;
    
    let score = 0;
    const timeBonus = Math.max(0, (match.currentDuration - 900) / 60); 
    score += timeBonus;

    if (aliveEnemies === 0) return 200; 
    
    if (aliveAllies > aliveEnemies) score += (aliveAllies - aliveEnemies) * 40; 
    
    const myStats = isBlue ? match.stats.blue : match.stats.red;
    if (myStats.activeBuffs.siegeUnit) score += 50; 

    return score;
  }

  static analyzeNearbySituation(player: LivePlayer, match: LiveMatch, range: number = 25): NearbyInfo {
    const isBlue = match.blueTeam.includes(player);
    const myTeam = isBlue ? match.blueTeam : match.redTeam;
    const enemyTeam = isBlue ? match.redTeam : match.blueTeam;
    
    const nearbyAllies = myTeam.filter(p => p !== player && p.currentHp > 0 && AIUtils.dist(player, p) <= range);
    const nearbyEnemies = enemyTeam.filter(p => p.currentHp > 0 && AIUtils.dist(player, p) <= range);
    
    const allyPower = this.calculateTeamPower([player, ...nearbyAllies]);
    const enemyPower = this.calculateTeamPower(nearbyEnemies);

    return { allies: nearbyAllies, enemies: nearbyEnemies, allyPower, enemyPower };
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
    const brain = player.stats?.brain || 50; // 안전장치
    const iq = Math.max(0, Math.min(100, brain)) / 100;
    const threshold = 0.25 - (iq * 0.15); 
    const lowMp = player.maxMp > 0 && (player.currentMp / player.maxMp) < 0.1;
    return AIUtils.hpPercent(player) < threshold || lowMp;
  }

  static isBaseUnderThreat(player: LivePlayer, match: LiveMatch, isBlue: boolean): ThreatInfo {
    const myBase = AIUtils.getMyBasePos(isBlue);
    const enemies = isBlue ? match.redTeam : match.blueTeam;
    const myNexusHp = isBlue ? match.stats.blue.nexusHp : match.stats.red.nexusHp;
    
    const emergencyMode = myNexusHp < 5000;
    const threatRange = emergencyMode ? 60 : 30; 
    
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
