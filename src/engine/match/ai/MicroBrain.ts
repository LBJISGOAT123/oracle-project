import { LivePlayer, Hero } from '../../../types';
import { AIUtils } from './AIUtils';
import { BASES } from '../constants/MapConstants';

export interface MicroDecision {
  type: 'ATTACK' | 'MOVE';
  targetPos: { x: number, y: number };
}

export class MicroBrain {
  static control(
    player: LivePlayer, 
    target: LivePlayer, 
    hero: Hero, 
    isBlue: boolean
  ): MicroDecision {
    const dist = AIUtils.dist(player, target);
    // 맵 크기 100 기준 보정된 사거리 (약간의 여유 둠)
    const range = (hero.stats.range / 100) * 1.1; 
    
    // 피지컬 스탯 (0~100)
    const mechanics = player.stats.mechanics;
    
    // [1] 사거리 밖 -> 추격
    if (dist > range) {
      return { type: 'MOVE', targetPos: { x: target.x, y: target.y } };
    }

    // [2] 사거리 안 -> 역할군별 행동 분기
    const isRanged = hero.role === '신살자' || hero.role === '선지자';
    
    if (isRanged) {
      // [원거리] 카이팅 로직
      // 피지컬이 50 이상이어야 카이팅 시도 (낮으면 말뚝딜)
      if (mechanics >= 50) {
        // 적이 너무 가까우면(사거리의 50%) 뒤로 빠짐
        if (dist < range * 0.5) {
          const myBase = AIUtils.getMyBasePos(isBlue);
          return { type: 'MOVE', targetPos: myBase };
        }
      }
      return { type: 'ATTACK', targetPos: { x: target.x, y: target.y } };
    } 
    else {
      // [근거리] 적에게 딱 붙기
      // 피지컬이 높으면 적의 예상 도주 경로로 움직일 수도 있겠지만(심화), 일단은 붙어서 때림
      if (dist > 1.5) { 
        return { type: 'MOVE', targetPos: { x: target.x, y: target.y } };
      }
      return { type: 'ATTACK', targetPos: { x: target.x, y: target.y } };
    }
  }
}
