import { LivePlayer, LiveMatch, Hero } from '../../../types';
import { AIUtils } from '../ai/AIUtils';
import { BASES, TOWER_COORDS } from '../constants/MapConstants';
import { Collision } from '../utils/Collision';
import { MacroDecision } from '../ai/MacroBrain';

export class LaningLogic {
  
  static decide(player: LivePlayer, match: LiveMatch, hero: Hero): MacroDecision | null {
    // 1. 라인전 수행 조건 (엄격하게 제한)
    // - 정글러 제외
    // - 게임 시간 8분 미만 (초반)
    // - 자신의 라인 1차 타워 생존
    if (player.lane === 'JUNGLE') return null;
    if (match.currentDuration > 480) return null; // 8분

    const isBlue = match.blueTeam.includes(player);
    const myTowers = isBlue ? match.stats.blue.towers : match.stats.red.towers;
    const laneKey = player.lane.toLowerCase();
    
    // 1차 타워가 깨졌으면 라인전 종료 (자유 행동)
    if ((myTowers as any)[laneKey] >= 1) return null;

    // 2. 미니언 전선(Wave Line) 파악
    const minions = match.minions || [];
    const laneMinions = minions.filter(m => m.lane === player.lane && m.hp > 0);
    const allyMinions = laneMinions.filter(m => m.team === (isBlue ? 'BLUE' : 'RED'));
    const enemyMinions = laneMinions.filter(m => m.team !== (isBlue ? 'BLUE' : 'RED'));

    // 아군 미니언이 없으면 -> 타워 허깅 (안전 제일)
    if (allyMinions.length === 0) {
        const myTowerPos = this.getMyTowerPos(player.lane, 1, isBlue);
        // 타워보다 살짝 뒤에 서기
        return { 
            action: 'WAIT', 
            targetPos: myTowerPos, 
            reason: '라인전: 타워 허깅 (미니언 없음)' 
        };
    }

    // 3. 포지셔닝: "아군 원거리 미니언" 위치를 기준점으로 삼음
    // (탱커여도 초반엔 미니언 뒤가 안전함)
    const anchorMinion = allyMinions[allyMinions.length - 1]; // 배열 뒤쪽이 보통 원거리/늦게 온 미니언
    let idealPos = { x: anchorMinion.x, y: anchorMinion.y };

    // 4. [CS 막타] 로직 (최우선)
    const range = hero.stats.range / 100; // 맵 스케일 변환
    const farmableMinion = enemyMinions.find(em => 
        Collision.inRange(player, em, range) && em.hp < (player.level * 60 + 50)
    );

    if (farmableMinion) {
        return { 
            action: 'FIGHT', 
            targetPos: { x: farmableMinion.x, y: farmableMinion.y }, 
            targetUnit: farmableMinion as any, 
            reason: '라인전: CS 막타' 
        };
    }

    // 5. [견제] 로직 (CS가 없을 때만)
    // - 적 영웅이 사거리 내에 있음
    // - 적 미니언보다 우리 미니언이 많거나 비슷함
    const nearbyEnemyHero = this.findLaneOpponent(player, match, isBlue);
    if (nearbyEnemyHero) {
        const dist = AIUtils.dist(player, nearbyEnemyHero);
        
        // 딜교환 조건: 사거리 내 + 무리하게 쫓지 않음(타워 거리 확인)
        if (dist <= range * 1.2 && allyMinions.length >= enemyMinions.length - 1) {
            const enemyTowerPos = this.getMyTowerPos(player.lane, 1, !isBlue);
            // 적 타워 다이브 방지 (거리 15 유지)
            if (AIUtils.dist(nearbyEnemyHero, enemyTowerPos) > 15) {
                return {
                    action: 'FIGHT',
                    targetPos: { x: nearbyEnemyHero.x, y: nearbyEnemyHero.y },
                    targetUnit: nearbyEnemyHero,
                    reason: '라인전: 견제'
                };
            }
        }
    }

    // 6. [대기/이동] 할 거 없으면 미니언 뒤에서 무빙
    // 본진 방향으로 살짝 뒤로 빠져서 안정적으로 위치
    const myBase = AIUtils.getMyBasePos(isBlue);
    const dirX = myBase.x - idealPos.x;
    const dirY = myBase.y - idealPos.y;
    const len = Math.sqrt(dirX*dirX + dirY*dirY);
    
    // 약간의 랜덤 무빙 추가 (AI가 덜 딱딱해 보이게)
    const offsetX = (Math.random() - 0.5) * 2;
    const offsetY = (Math.random() - 0.5) * 2;

    idealPos.x += (dirX / len) * 3 + offsetX;
    idealPos.y += (dirY / len) * 3 + offsetY;

    return { action: 'FARM', targetPos: idealPos, reason: '라인전: 대치 및 파밍' };
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
    // 내 라인에 있고, 너무 멀지 않은 적 (거리 25 이내)
    return enemies.find(e => e.lane === player.lane && e.currentHp > 0 && AIUtils.dist(player, e) < 25);
  }
}
