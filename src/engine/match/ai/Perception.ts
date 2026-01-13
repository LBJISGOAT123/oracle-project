// ==========================================
// FILE PATH: /src/engine/match/ai/Perception.ts
// ==========================================
import { LivePlayer, LiveMatch } from '../../../types';
import { AIUtils } from './AIUtils';
import { POI, getDistance } from '../../data/MapData';
import { TOWER_COORDS } from '../../../components/battle/spectate/map/MapConstants'; // 타워 좌표 참조

export interface ThreatInfo {
  isThreatened: boolean;
  enemyUnit: LivePlayer | null;
  distance: number;
}

export class Perception {
  // [기존 유지] 귀환 필요성 체크
  static needsRecall(player: LivePlayer): boolean {
    const iq = Math.max(0, Math.min(100, player.stats.brain)) / 100;
    const threshold = 0.15 + (iq * 0.25); // 지능이 높으면 더 일찍 감 (생존 본능)
    
    // 마나가 너무 없어도 귀환
    const lowMp = player.maxMp > 0 && (player.currentMp / player.maxMp) < 0.1;
    
    return AIUtils.hpPercent(player) < threshold || lowMp;
  }

  // [기존 유지] 본진(넥서스) 위협 체크
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

  /**
   * [신규 추가] 아군 구조물(타워/억제기)이 공격받는지 확인
   * - 단순히 본진만 보는게 아니라, 라인 전체를 감시함
   */
  static findThreatenedStructure(player: LivePlayer, match: LiveMatch, isBlue: boolean): { pos: {x:number, y:number}, enemy: LivePlayer } | null {
    const enemies = isBlue ? match.redTeam : match.blueTeam;
    const myTowers = isBlue ? match.stats.blue.towers : match.stats.red.towers;
    const towerCoords = isBlue ? TOWER_COORDS.BLUE : TOWER_COORDS.RED;

    // 각 라인별 생존한 최전방 타워 위치 파악
    const lanes = ['TOP', 'MID', 'BOT'];
    
    for (const lane of lanes) {
      const brokenCount = (myTowers as any)[lane.toLowerCase()];
      if (brokenCount >= 3) continue; // 억제기까지 밀렸으면 본진 방어 로직이 처리함

      // 현재 살아있는 타워의 티어 (1차, 2차, 3차)
      const currentTier = brokenCount + 1; 
      
      // 해당 타워의 좌표 가져오기
      // @ts-ignore
      const tPos = towerCoords[lane][currentTier - 1]; 
      if (!tPos) continue;

      // 해당 타워 근처(반경 15)에 적이 있는지?
      for (const enemy of enemies) {
        if (enemy.currentHp > 0 && enemy.respawnTimer <= 0) {
          const dist = getDistance({x: tPos.x, y: tPos.y}, enemy);
          
          // 적이 타워를 치고 있고, 나는 그 근처에 없다면(지원 필요)
          if (dist < 12) {
             // 너무 멀리 있으면(텔포 없는 뚜벅이) 포기할 수도 있지만, 일단 감지
             return { pos: tPos, enemy: enemy };
          }
        }
      }
    }
    return null;
  }

  // [기존 유지] 적 조우 체크
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

  // [기존 유지] 오브젝트 탐색
  static findActiveObjective(match: LiveMatch): { type: 'colossus'|'watcher', pos: {x:number, y:number} } | null {
    if (match.objectives.colossus.status === 'ALIVE') return { type: 'colossus', pos: POI.BARON };
    if (match.objectives.watcher.status === 'ALIVE') return { type: 'watcher', pos: POI.DRAGON };
    return null;
  }

  // [기존 유지] 위기에 처한 아군 탐색
  static findAllyInTrouble(player: LivePlayer, match: LiveMatch, isBlue: boolean): LivePlayer | null {
    const allies = isBlue ? match.blueTeam : match.redTeam;
    const enemies = isBlue ? match.redTeam : match.blueTeam;
    const sightRange = 25; // 시야 약간 상향

    const candidates = allies.filter(a => a !== player && a.currentHp > 0 && a.respawnTimer <= 0);

    for (const ally of candidates) {
      const distToAlly = AIUtils.dist(player, ally);
      if (distToAlly > sightRange) continue;

      if (AIUtils.hpPercent(ally) < 0.5) return ally;

      for (const enemy of enemies) {
        if (enemy.currentHp > 0 && AIUtils.dist(ally, enemy) < 8) { // 교전 거리 인식 완화
          return ally;
        }
      }
    }
    return null;
  }
}
