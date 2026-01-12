import { LivePlayer, LiveMatch } from '../../../types';
// [수정] 경로 수정: ../../utils -> ../utils
import { Vector } from '../utils/Vector';
import { BASES } from '../constants/MapConstants';

export class AIUtils {
  static dist(a: {x:number, y:number}, b: {x:number, y:number}): number {
    return Vector.dist({x: a.x, y: a.y}, {x: b.x, y: b.y});
  }

  static hpPercent(unit: LivePlayer): number {
    return unit.maxHp > 0 ? unit.currentHp / unit.maxHp : 0;
  }

  static mpPercent(unit: LivePlayer): number {
    return unit.maxMp > 0 ? unit.currentMp / unit.maxMp : 0;
  }

  static getCombatPower(unit: LivePlayer): number {
    return (unit.level * 100) + (this.hpPercent(unit) * 1000) + (unit.items.length * 150);
  }

  static getMyBasePos(isBlue: boolean): {x: number, y: number} {
    return isBlue ? BASES.BLUE : BASES.RED;
  }

  static getNextObjectivePos(player: LivePlayer, match: LiveMatch, isBlue: boolean): {x: number, y: number} {
    if (player.lane === 'JUNGLE') return { x: 50, y: 50 }; 

    const enemyStats = isBlue ? match.stats.red : match.stats.blue;
    const laneKey = player.lane.toLowerCase(); 
    
    const brokenCount = (enemyStats.towers as any)[laneKey];

    if (brokenCount >= 3) {
      return isBlue ? BASES.RED : BASES.BLUE;
    }

    const tier = brokenCount + 1;
    return this.calculateTowerPos(player.lane, tier, !isBlue); 
  }

  private static calculateTowerPos(lane: string, tier: number, isBlueSide: boolean) {
    let start = isBlueSide ? BASES.BLUE : BASES.RED;
    let end = isBlueSide ? BASES.RED : BASES.BLUE;

    let ratio = 0;
    if (tier === 1) ratio = 0.5; 
    else if (tier === 2) ratio = 0.75;
    else ratio = 0.9;

    let tx = start.x + (end.x - start.x) * ratio;
    let ty = start.y + (end.y - start.y) * ratio;

    if (lane === 'TOP') {
        if (isBlueSide) ty = 10; else tx = 10;
    } else if (lane === 'BOT') {
        if (isBlueSide) tx = 90; else ty = 90;
    }
    
    return { x: tx, y: ty };
  }
}
