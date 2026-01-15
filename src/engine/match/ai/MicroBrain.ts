// ==========================================
// FILE PATH: /src/engine/match/ai/MicroBrain.ts
// ==========================================
import { LivePlayer, Hero, LiveMatch } from '../../../types';
import { AIUtils } from './AIUtils';
import { useGameStore } from '../../../store/useGameStore';
import { ComboSystem } from './mechanics/ComboSystem';
import { SkillBrain } from './tactics/SkillBrain';
import { ObservationSystem } from './perception/ObservationSystem'; 
import { TeamCoordination } from './mechanics/TeamCoordination';
import { PredictionSystem } from './systems/PredictionSystem';
import { RoleAI } from './tactics/RoleAI'; // [New] 연결

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

    // 1. [회피 기동]
    const dodgePos = PredictionSystem.getDodgeMovement(player, match);
    if (dodgePos) return { type: 'MOVE', targetPos: dodgePos };

    // 2. [콤보 및 스킬]
    const dist = AIUtils.dist(player, target);
    let bestSkill: string | null = null;

    bestSkill = ComboSystem.getNextSkill(player, target, hero, dist, match.currentDuration);
    if (!bestSkill) bestSkill = SkillBrain.getBestSkill(player, target, hero, dist);

    if (bestSkill) {
        const skillInfo = hero.skills[bestSkill as 'q'|'w'|'e'|'r'];
        if (TeamCoordination.shouldHoldCC(target, skillInfo.mechanic)) {
            const range = (hero.stats.range / 100);
            if (dist <= range + 1.0) return { type: 'ATTACK', targetPos: { x: target.x, y: target.y } };
            return { type: 'MOVE', targetPos: { x: target.x, y: target.y } };
        }

        const aimPos = PredictionSystem.getAimPosition(player, target, match);
        return { type: 'ATTACK', targetPos: aimPos, skillKey: bestSkill };
    }

    // 3. [역할군별 전투 무빙] (RoleAI 위임)
    return RoleAI.getDecision(player, target, hero, match);
  }
}
