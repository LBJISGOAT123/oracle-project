// ==========================================
// FILE PATH: /src/engine/match/ai/MicroBrain.ts
// ==========================================
import { LivePlayer, Hero, LiveMatch } from '../../../types';
import { EvasionSystem } from './tactics/EvasionSystem';
import { TacticalComputer } from './tactics/TacticalComputer';
import { AIUtils } from './AIUtils';
import { useGameStore } from '../../../store/useGameStore';
import { ComboSystem } from './mechanics/ComboSystem';
import { SkillBrain } from './tactics/SkillBrain';
import { ObservationSystem } from './perception/ObservationSystem'; 
import { TeamCoordination } from './mechanics/TeamCoordination'; // [신규]

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
    
    let match: LiveMatch | undefined;
    try { 
        match = useGameStore.getState().gameState.liveMatches.find(m => 
            m.blueTeam.includes(player) || m.redTeam.includes(player)
        );
    } catch(e){}

    if (!match) return { type: 'MOVE', targetPos: {x: target.x, y: target.y} };

    ObservationSystem.updateObservations(player, match);

    // 1. 투사체 회피
    const dodgePos = EvasionSystem.getDodgeVector(player, match);
    if (dodgePos) return { type: 'MOVE', targetPos: dodgePos };

    // 2. 콤보 및 스킬 사용
    const dist = AIUtils.dist(player, target);
    let bestSkill: string | null = null;

    bestSkill = ComboSystem.getNextSkill(player, target, hero, dist, match.currentDuration);

    if (!bestSkill) {
        bestSkill = SkillBrain.getBestSkill(player, target, hero, dist);
    }

    if (bestSkill) {
        // [핵심] CC 연계 판단 (TeamCoordination)
        // 아군이 기절을 걸어놨으면 내 CC기는 아낌 (Hold)
        const skillInfo = hero.skills[bestSkill as 'q'|'w'|'e'|'r'];
        
        if (TeamCoordination.shouldHoldCC(target, skillInfo.mechanic)) {
            // 스킬 쓰는 대신 평타나 무빙 (기다림)
            // 그냥 공격 사거리 안이면 평타, 아니면 접근
            const range = (hero.stats.range / 100);
            if (dist <= range + 1.0) {
                return { type: 'ATTACK', targetPos: { x: target.x, y: target.y } };
            }
            return { type: 'MOVE', targetPos: { x: target.x, y: target.y } };
        }

        // 예측 사격
        const aimPos = ObservationSystem.getPredictedPosition(player, target, 15.0);
        
        return { 
            type: 'ATTACK', 
            targetPos: aimPos, 
            skillKey: bestSkill 
        };
    }

    // 3. 스마트 포지셔닝 (카이팅)
    const range = (hero.stats.range / 100);
    const optimalPos = TacticalComputer.getSiegePosition(player, target, match, range);

    const distToOptimal = AIUtils.dist(player, optimalPos);
    
    if (distToOptimal < 2.0 && dist <= range + 1.0) {
        return { type: 'ATTACK', targetPos: { x: target.x, y: target.y } };
    }

    return { type: 'MOVE', targetPos: optimalPos };
  }
}
