// ==========================================
// FILE PATH: /src/engine/match/ai/tactics/TeamTactics.ts
// ==========================================
import { LiveMatch, LivePlayer } from '../../../../types';
import { AIUtils } from '../AIUtils';
import { BASES, POI } from '../../constants/MapConstants';

export type TeamOrderType = 'FREE' | 'ALL_PUSH' | 'ALL_DEFEND' | 'SIEGE_MID' | 'RETREAT' | 'TAKE_BARON' | 'TAKE_DRAGON';

export interface TeamOrder {
  type: TeamOrderType;
  targetPos?: { x: number, y: number };
  reason: string;
}

export class TeamTactics {
  
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
    const advantage = allyCount - enemyCount; 

    // 2. 라인 상황
    const enemyStats = isBlueTeam ? match.stats.red : match.stats.blue;
    const myStats = isBlueTeam ? match.stats.blue : match.stats.red;
    const isEnemyInhibitorDown = enemyStats.towers.mid >= 3;
    const isMyInhibitorDown = myStats.towers.mid >= 3;

    // --------------------------------------------------------
    // [전략 1] 엘리전 / 끝내기 (Game Ending)
    // --------------------------------------------------------
    if (match.currentDuration > 1200) { // 20분 이후
        if (enemyCount === 0 || (advantage >= 2 && isEnemyInhibitorDown)) {
            return { type: 'ALL_PUSH', targetPos: enemyBase, reason: '🚀 적 궤멸! 넥서스 점사!' };
        }
    }

    // --------------------------------------------------------
    // [전략 2] 긴급 수비 (Emergency)
    // --------------------------------------------------------
    if (isMyInhibitorDown) {
        const enemiesInBase = activeEnemies.filter(e => AIUtils.dist(e, myBase) < 30).length;
        if (enemiesInBase >= 1) { // 1명이라도 들어오면 수비
            return { type: 'ALL_DEFEND', targetPos: myBase, reason: '🛡️ 본진 방어!' };
        }
    }

    // --------------------------------------------------------
    // [전략 3] 오브젝트 오더 (Baron / Dragon) - New
    // --------------------------------------------------------
    // 수적 우위 2명 이상 & 정글러 살아있음 & 강타 싸움 가능
    const myJungler = activeAllies.find(p => p.lane === 'JUNGLE');
    if (advantage >= 2 && myJungler) {
        // 거신병(바론) 확인
        const colossus = match.objectives.colossus;
        if (colossus.status === 'ALIVE' && match.currentDuration > 900) { // 15분 이후
            return { type: 'TAKE_BARON', targetPos: POI.BARON, reason: '🤖 수적 우위! 거신병 사냥!' };
        }
        
        // 주시자(용) 확인
        const watcher = match.objectives.watcher;
        if (watcher.status === 'ALIVE') {
            return { type: 'TAKE_DRAGON', targetPos: POI.DRAGON, reason: '👁️ 주시자 사냥!' };
        }
    }

    // --------------------------------------------------------
    // [전략 4] 스노우볼링 (미드 모여)
    // --------------------------------------------------------
    if (advantage >= 1 && allyCount >= 3) {
        const midObjective = AIUtils.getNextObjectivePos(activeAllies[0], match, isBlueTeam);
        return { type: 'SIEGE_MID', targetPos: midObjective, reason: '🔥 미드 고속도로!' };
    }

    // --------------------------------------------------------
    // [전략 5] 자유 행동
    // --------------------------------------------------------
    return { type: 'FREE', reason: '자유 행동' };
  }
}
