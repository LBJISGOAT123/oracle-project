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
import { RoleAI } from './tactics/RoleAI';

export interface MicroDecision {
  type: 'ATTACK' | 'MOVE';
  targetPos: { x: number, y: number };
  skillKey?: string; 
  cancelAnimation?: boolean; // [New] 평캔 여부
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

    // 3. [피지컬 기반 카이팅 & 평캔]
    const mechanics = player.stats.mechanics;
    const range = (hero.stats.range / 100);

    // 피지컬 80 이상: 평캔 (공격 후 바로 무빙 명령을 내려 딜레이 줄임)
    const canCancel = mechanics >= 80;

    if (dist <= range) {
        // 공격
        return { 
            type: 'ATTACK', 
            targetPos: { x: target.x, y: target.y },
            cancelAnimation: canCancel 
        };
    } else {
        // 추격
        // 피지컬 높으면 적의 예상 경로로 질러감 (간단히 구현)
        return { type: 'MOVE', targetPos: { x: target.x, y: target.y } };
    }
  }
}
