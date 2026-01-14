// ==========================================
// FILE PATH: /src/engine/match/logics/LaningLogic.ts
// ==========================================
import { LivePlayer, LiveMatch, Hero } from '../../../types';
import { AIUtils } from '../ai/AIUtils';
import { TOWER_COORDS } from '../constants/MapConstants';
import { Collision } from '../utils/Collision';
import { MacroDecision } from '../ai/MacroBrain';
import { getDistance } from '../../data/MapData';

export class LaningLogic {
  
  static decide(player: LivePlayer, match: LiveMatch, hero: Hero): MacroDecision | null {
    // 정글러는 라인전 로직 무시
    if (player.lane === 'JUNGLE') return null;

    // 게임 시간 12분 이후거나, 1차 타워가 없으면 라인전 종료 (자유 행동)
    const isBlue = match.blueTeam.includes(player);
    const myTowers = isBlue ? match.stats.blue.towers : match.stats.red.towers;
    const laneKey = player.lane.toLowerCase();
    
    if ((myTowers as any)[laneKey] >= 1 || match.currentDuration > 720) return null;

    // --- [라인전 핵심 로직] ---

    const minions = match.minions || [];
    const laneMinions = minions.filter(m => m.lane === player.lane && m.hp > 0);
    const enemyMinions = laneMinions.filter(m => m.team !== (isBlue ? 'BLUE' : 'RED'));
    const allyMinions = laneMinions.filter(m => m.team === (isBlue ? 'BLUE' : 'RED'));

    // 1. [안전 확보] 아군 미니언이 전멸했으면 무조건 타워로 후퇴 (개싸움 방지)
    if (allyMinions.length === 0 && enemyMinions.length > 0) {
        const myTower = this.getMyTowerPos(player.lane, 1, isBlue);
        return { 
            action: 'WAIT', 
            targetPos: myTower, 
            reason: '라인전: 미니언 없음 (후퇴)' 
        };
    }

    // 2. [CS 막타] 영웅 킬보다 CS가 우선 (초반 10분)
    // 개싸움을 막는 핵심: 영웅 칠 각이어도 미니언 막타가 있으면 미니언을 침
    const atkRange = hero.stats.range / 100;
    
    // 내 평타 데미지 (대략적 계산)
    const myDmg = hero.stats.ad * 2.0; 

    // 놓치면 안되는 미니언 찾기
    const farmTarget = enemyMinions.find(m => 
        Collision.inRange(player, m, atkRange) && m.hp <= myDmg
    );

    if (farmTarget) {
        return { 
            action: 'FARM', 
            targetPos: { x: farmTarget.x, y: farmTarget.y }, 
            targetUnit: farmTarget as any, 
            reason: '라인전: CS 막타 집중' 
        };
    }

    // 3. [딜교환 판단] 
    // 조건: 상대가 사거리 내에 있고 + 우리 미니언이 충분히 있을 때만
    const enemyHero = this.findLaneOpponent(player, match, isBlue);
    if (enemyHero) {
        const dist = AIUtils.dist(player, enemyHero);
        
        // 너무 깊숙히 들어가지 않기 (적 타워 거리 체크)
        const enemyTower = this.getMyTowerPos(player.lane, 1, !isBlue);
        const distToEnemyTower = AIUtils.dist(player, enemyTower);

        // (1) 적이 타워 근처면 딜교 포기하고 대기
        if (distToEnemyTower < 16) {
             return {
                action: 'WAIT', // 춤추기 (무빙)
                targetPos: { x: player.x + (Math.random()-0.5)*2, y: player.y + (Math.random()-0.5)*2 },
                reason: '라인전: 적 타워 허깅 중 (대기)'
            };
        }

        // (2) 딜교환 시도 (치고 빠지기)
        if (dist <= atkRange + 2) {
            // 내 체력이 적보다 많거나 비슷할 때만 싸움
            if (AIUtils.hpPercent(player) >= AIUtils.hpPercent(enemyHero) - 0.1) {
                return {
                    action: 'FIGHT',
                    targetPos: { x: enemyHero.x, y: enemyHero.y },
                    targetUnit: enemyHero,
                    reason: '라인전: 짧은 딜교환'
                };
            }
        }
    }

    // 4. [포지셔닝] 할 거 없으면 "아군 원거리 미니언" 옆에 서있기
    // (적을 향해 무작정 걸어가는 것 방지)
    if (allyMinions.length > 0) {
        // 원거리 미니언은 보통 리스트 뒤쪽에 있음
        const safeMinion = allyMinions[allyMinions.length - 1];
        
        // 미니언 뒤에서 좌우 무빙
        const jitterX = (Math.random() - 0.5) * 4;
        const jitterY = (Math.random() - 0.5) * 4;

        return {
            action: 'WAIT', // FIGHT가 아님 -> 공격 안하고 이동만 함
            targetPos: { x: safeMinion.x + jitterX, y: safeMinion.y + jitterY },
            reason: '라인전: 포지셔닝'
        };
    }

    // 5. 아무것도 없으면 타워 복귀
    const myTower = this.getMyTowerPos(player.lane, 1, isBlue);
    return { action: 'WAIT', targetPos: myTower, reason: '라인전: 대기' };
  }

  private static getMyTowerPos(lane: string, tier: number, isBlue: boolean) {
    const coords = isBlue ? TOWER_COORDS.BLUE : TOWER_COORDS.RED;
    if (lane === 'MID') return coords.MID[tier - 1];
    if (lane === 'TOP') return coords.TOP[tier - 1];
    if (lane === 'BOT') return coords.BOT[tier - 1];
    return coords.NEXUS;
  }

  private static findLaneOpponent(player: LivePlayer, match: LiveMatch, isBlue: boolean) {
    const enemies = isBlue ? match.redTeam : match.blueTeam;
    return enemies.find(e => e.lane === player.lane && e.currentHp > 0 && AIUtils.dist(player, e) < 20);
  }
}
