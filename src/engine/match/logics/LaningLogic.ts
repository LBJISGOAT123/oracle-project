// ==========================================
// FILE PATH: /src/engine/match/logics/LaningLogic.ts
// ==========================================
import { LivePlayer, LiveMatch, Hero } from '../../../types';
import { AIUtils } from '../ai/AIUtils';
import { TOWER_COORDS } from '../constants/MapConstants';
import { Collision } from '../utils/Collision';
import { MacroDecision } from '../ai/MacroBrain';

export class LaningLogic {
  
  static decide(player: LivePlayer, match: LiveMatch, hero: Hero): MacroDecision | null {
    if (player.lane === 'JUNGLE') return null;

    const isBlue = match.blueTeam.includes(player);
    const myTowers = isBlue ? match.stats.blue.towers : match.stats.red.towers;
    const laneKey = player.lane.toLowerCase();
    
    if ((myTowers as any)[laneKey] >= 1 || match.currentDuration > 720) return null;

    const minions = match.minions || [];
    // 내 주변(사거리 내) 미니언 수 체크
    const rangeCheck = 15; // 시야 범위
    const enemyMinions = minions.filter(m => m.lane === player.lane && m.team !== (isBlue ? 'BLUE' : 'RED') && m.hp > 0 && AIUtils.dist(player, m) < rangeCheck);
    const allyMinions = minions.filter(m => m.lane === player.lane && m.team === (isBlue ? 'BLUE' : 'RED') && m.hp > 0 && AIUtils.dist(player, m) < rangeCheck);

    // 1. [CS 막타] 최우선 (기존 유지)
    const atkRange = hero.stats.range / 100;
    const myDmg = hero.stats.ad * 2.0; 
    const farmTarget = enemyMinions.find(m => Collision.inRange(player, m, atkRange) && m.hp <= myDmg);

    if (farmTarget) {
        return { action: 'FARM', targetPos: { x: farmTarget.x, y: farmTarget.y }, targetUnit: farmTarget as any, reason: 'CS 획득' };
    }

    // 2. [근본 해결] 딜교환 조건 강화 (미니언 수 싸움)
    const enemyHero = this.findLaneOpponent(player, match, isBlue);
    if (enemyHero) {
        const dist = AIUtils.dist(player, enemyHero);
        
        // [조건 A] 적 미니언이 우리 미니언보다 많으면 절대 싸우지 않음 (초반 10분)
        // MOBA 기본: 미니언 어그로 때문에 쪽수 밀리면 짐
        if (enemyMinions.length > allyMinions.length && player.level < 6) {
             // 뒤로 빠져서 사리기
             const safePos = this.getSafePosition(player, allyMinions, isBlue);
             return { action: 'WAIT', targetPos: safePos, reason: '라인 불리 (사리기)' };
        }

        // [조건 B] 내 체력이 60% 이하면 딜교 금지 (초반 생존력 강화)
        if (player.level < 4 && AIUtils.hpPercent(player) < 0.6) {
             const myTower = this.getMyTowerPos(player.lane, 1, isBlue);
             return { action: 'WAIT', targetPos: myTower, reason: '체력 관리' };
        }

        // [조건 C] 적 타워 근처면 진입 금지
        const enemyTower = this.getMyTowerPos(player.lane, 1, !isBlue);
        if (AIUtils.dist(player, enemyTower) < 16) {
             return { action: 'WAIT', targetPos: { x: player.x, y: player.y }, reason: '적 타워 경계' };
        }

        // 위 조건을 모두 통과하고, 사거리 내에 적이 있으면 딜교
        if (dist <= atkRange + 2) {
            return { action: 'FIGHT', targetPos: { x: enemyHero.x, y: enemyHero.y }, targetUnit: enemyHero, reason: '유리한 딜교' };
        }
    }

    // 3. [대기] 아군 미니언 뒤에 숨기
    if (allyMinions.length > 0) {
        const safeMinion = allyMinions[allyMinions.length - 1]; // 가장 뒤쪽 미니언
        return { action: 'WAIT', targetPos: { x: safeMinion.x, y: safeMinion.y }, reason: '포지셔닝' };
    }

    // 4. 미니언도 없으면 타워 허깅
    const myTower = this.getMyTowerPos(player.lane, 1, isBlue);
    return { action: 'WAIT', targetPos: myTower, reason: '타워 대기' };
  }

  private static getSafePosition(player: LivePlayer, allyMinions: any[], isBlue: boolean) {
      if (allyMinions.length > 0) {
          // 아군 원거리 미니언보다 더 뒤쪽으로
          const backMinion = allyMinions[allyMinions.length - 1];
          return { x: backMinion.x + (isBlue ? -2 : 2), y: backMinion.y + (isBlue ? -2 : 2) };
      }
      return this.getMyTowerPos(player.lane, 1, isBlue);
  }

  private static getMyTowerPos(lane: string, tier: number, isBlue: boolean) {
    const coords = isBlue ? TOWER_COORDS.BLUE : TOWER_COORDS.RED;
    // @ts-ignore
    return coords[lane][tier-1] || coords.NEXUS;
  }

  private static findLaneOpponent(player: LivePlayer, match: LiveMatch, isBlue: boolean) {
    const enemies = isBlue ? match.redTeam : match.blueTeam;
    return enemies.find(e => e.lane === player.lane && e.currentHp > 0 && AIUtils.dist(player, e) < 20);
  }
}
