// ==========================================
// FILE PATH: /src/engine/match/ai/tactics/TeamTactics.ts
// ==========================================
import { LiveMatch, LivePlayer } from '../../../../types';
import { AIUtils } from '../AIUtils';
import { BASES, TOWER_COORDS } from '../../constants/MapConstants';

export type TeamOrderType = 'FREE' | 'ALL_PUSH' | 'ALL_DEFEND' | 'SIEGE_MID' | 'RETREAT';

export interface TeamOrder {
  type: TeamOrderType;
  targetPos?: { x: number, y: number };
  reason: string;
}

export class TeamTactics {
  
  /**
   * 해당 팀의 현재 전략적 상태를 결정합니다.
   */
  static analyzeTeamStrategy(match: LiveMatch, isBlueTeam: boolean): TeamOrder {
    const allies = isBlueTeam ? match.blueTeam : match.redTeam;
    const enemies = isBlueTeam ? match.redTeam : match.blueTeam;
    const enemyBase = isBlueTeam ? BASES.RED : BASES.BLUE;
    const myBase = isBlueTeam ? BASES.BLUE : BASES.RED;

    // 1. 생존자 수 비교 (수적 우위)
    const activeAllies = allies.filter(p => p.currentHp > 0 && p.respawnTimer <= 0);
    const activeEnemies = enemies.filter(p => p.currentHp > 0 && p.respawnTimer <= 0);
    
    const allyCount = activeAllies.length;
    const enemyCount = activeEnemies.length;
    const advantage = allyCount - enemyCount; // 양수면 우리가 유리

    // 2. 라인 상황 (미드 억제기 밀렸는지)
    const enemyStats = isBlueTeam ? match.stats.red : match.stats.blue;
    const myStats = isBlueTeam ? match.stats.blue : match.stats.red;
    
    const isEnemyInhibitorDown = enemyStats.towers.mid >= 3;
    const isMyInhibitorDown = myStats.towers.mid >= 3;

    // --------------------------------------------------------
    // [전략 1] 엘리전 / 끝내기 (Game Ending)
    // 조건: 적이 거의 전멸했거나(2명 이상 차이), 20분 넘었는데 수적 우위일 때
    // --------------------------------------------------------
    if (match.currentDuration > 900) { // 15분 이후
        if (enemyCount === 0 || (advantage >= 2 && isEnemyInhibitorDown)) {
            return { 
                type: 'ALL_PUSH', 
                targetPos: enemyBase, 
                reason: '🚀 적 궤멸! 전원 넥서스 돌격!' 
            };
        }
    }

    // --------------------------------------------------------
    // [전략 2] 긴급 수비 (Emergency Defense)
    // 조건: 우리 억제기가 밀렸고, 적이 우리 기지 근처에 2명 이상 있음
    // --------------------------------------------------------
    if (isMyInhibitorDown) {
        const enemiesInBase = activeEnemies.filter(e => AIUtils.dist(e, myBase) < 30).length;
        if (enemiesInBase >= 2) {
            return { 
                type: 'ALL_DEFEND', 
                targetPos: myBase, 
                reason: '🛡️ 본진 위험! 전원 수비!' 
            };
        }
    }

    // --------------------------------------------------------
    // [전략 3] 스노우볼링 (Siege)
    // 조건: 수적 우위(1명 이상) 이고 아군이 3명 이상 뭉쳐있음 -> 미드 고속도로
    // --------------------------------------------------------
    if (advantage >= 1 && allyCount >= 3) {
        const midObjective = AIUtils.getNextObjectivePos(activeAllies[0], match, isBlueTeam); // 미드 타워 좌표
        return { 
            type: 'SIEGE_MID', 
            targetPos: midObjective, 
            reason: '🔥 수적 우위! 미드 압박!' 
        };
    }

    // --------------------------------------------------------
    // [전략 4] 정비 및 분산 (Free)
    // 특별한 상황 아니면 각자 판단 (라인전, 정글링)
    // --------------------------------------------------------
    return { type: 'FREE', reason: '자유 행동' };
  }
}
