// ==========================================
// FILE PATH: /src/engine/match/ai/systems/PredictionSystem.ts
// ==========================================
import { LivePlayer, LiveMatch } from '../../../../types';
import { ObservationSystem } from '../perception/ObservationSystem';
import { ReactionSystem } from './ReactionSystem'; // [New]

export class PredictionSystem {
  
  static getAimPosition(attacker: LivePlayer, target: LivePlayer, match: LiveMatch): {x:number, y:number} {
    const obs = ObservationSystem.getLastKnownPosition(attacker, target.heroId, match.currentDuration);
    if (!obs) return { x: target.x, y: target.y };

    const brain = attacker.stats.mechanics; 
    if (brain < 40) return { x: target.x, y: target.y }; 

    // [New] 조준 오차 적용 (손떨림)
    const error = ReactionSystem.getAimError(attacker);
    
    // 원래라면 속도 벡터 예측이 들어가야 하지만, 현재는 정조준 + 오차로 구현
    return { 
        x: target.x + error.x, 
        y: target.y + error.y 
    };
  }

  static getDodgeMovement(player: LivePlayer, match: LiveMatch): {x:number, y:number} | null {
    if (player.stats.mechanics < 20) return null; // 피지컬 너무 낮으면 포기

    const myTeam = match.blueTeam.includes(player) ? 'BLUE' : 'RED';
    let threat = null;
    let minDist = 10;

    if (!match.projectiles) return null;

    for (const p of match.projectiles) {
        if (p.team === myTeam) continue; 
        
        const dx = p.x - player.x;
        const dy = p.y - player.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        if (dist < minDist) {
            minDist = dist;
            threat = p;
        }
    }

    if (threat) {
        // [New] 반응 속도 체크 (인지했는가?)
        // 아직 반응 못했으면(딜레이 중이면) 피하지 않음
        if (!ReactionSystem.canReactToThreat(player, threat.id || 'proj', match.currentDuration)) {
            return null;
        }

        const dx = player.x - threat.x;
        const dy = player.y - threat.y;
        
        const dodgeX = -dy;
        const dodgeY = dx;
        
        const len = Math.sqrt(dodgeX*dodgeX + dodgeY*dodgeY);
        return { 
            x: player.x + (dodgeX/len) * 5, 
            y: player.y + (dodgeY/len) * 5 
        };
    }
    return null;
  }
}
