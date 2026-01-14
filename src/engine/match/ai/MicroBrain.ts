// ==========================================
// FILE PATH: /src/engine/match/ai/MicroBrain.ts
// ==========================================
import { LivePlayer, Hero, LiveMatch } from '../../../types';
import { RoleAI } from './tactics/RoleAI';
import { SkillBrain } from './tactics/SkillBrain';
import { EvasionSystem } from './tactics/EvasionSystem';
import { TacticalComputer } from './tactics/TacticalComputer';
import { AIUtils } from './AIUtils';
import { useGameStore } from '../../../store/useGameStore';

export interface MicroDecision {
  type: 'ATTACK' | 'MOVE';
  targetPos: { x: number, y: number };
  skillKey?: string; 
}

export class MicroBrain {
  static control(
    player: LivePlayer, 
    target: LivePlayer, 
    hero: Hero, 
    isBlue: boolean
  ): MicroDecision {
    
    // 0. 매치 정보 가져오기
    let match: LiveMatch | undefined;
    try { 
        match = useGameStore.getState().gameState.liveMatches.find(m => 
            m.blueTeam.includes(player) || m.redTeam.includes(player)
        );
    } catch(e){}

    // 1. 투사체 회피 (최우선)
    if (match) {
        const dodgePos = EvasionSystem.getDodgeVector(player, match);
        if (dodgePos) return { type: 'MOVE', targetPos: dodgePos };
    }

    // 2. 스킬 사용
    const dist = AIUtils.dist(player, target);
    const bestSkill = SkillBrain.getBestSkill(player, target, hero, dist);
    if (bestSkill) {
        return { type: 'ATTACK', targetPos: { x: target.x, y: target.y }, skillKey: bestSkill };
    }

    // 3. [핵심] 스마트 포지셔닝 (타워 사거리 고려)
    // TacticalComputer가 타워/미니언 상황을 고려해 '안전한 사격 위치'를 계산해줌
    const range = (hero.stats.range / 100);
    
    let optimalPos = { x: target.x, y: target.y };

    if (match) {
        optimalPos = TacticalComputer.getSiegePosition(player, target, match, range);
    }

    // 계산된 위치가 현재 내 위치와 매우 가깝고, 적이 사거리 내라면 공격
    const distToOptimal = AIUtils.dist(player, optimalPos);
    
    // 공격 가능 여부 판단
    // (1) 내가 최적 위치 근처에 있고 (2) 적이 사거리 내에 있음
    if (distToOptimal < 2.0 && dist <= range + 1.0) {
        return { type: 'ATTACK', targetPos: { x: target.x, y: target.y } };
    }

    // 아니면 최적 위치로 이동 (카이팅 or 대기)
    return { type: 'MOVE', targetPos: optimalPos };
  }
}
