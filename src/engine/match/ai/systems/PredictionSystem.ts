// ==========================================
// FILE PATH: /src/engine/match/ai/systems/PredictionSystem.ts
// ==========================================
import { LivePlayer, LiveMatch } from '../../../../types';
import { ObservationSystem } from '../perception/ObservationSystem';

export class PredictionSystem {
  
  // 1. [예측 사격] 적의 이동 속도를 고려해 미래 위치 계산
  static getAimPosition(attacker: LivePlayer, target: LivePlayer, match: LiveMatch): {x:number, y:number} {
    const obs = ObservationSystem.getLastKnownPosition(attacker, target.heroId, match.currentDuration);
    if (!obs) return { x: target.x, y: target.y };

    const brain = attacker.stats.mechanics; // 피지컬 스탯 활용
    if (brain < 40) return { x: target.x, y: target.y }; // 피지컬 낮으면 정조준

    // 실제로는 ObservationSystem과 연계해 속도 벡터를 가져와야 하지만, 현재는 정조준으로 안전하게 처리
    return { x: target.x, y: target.y }; 
  }

  // 2. [회피 기동] 투사체가 날아오면 수직 방향으로 무빙
  static getDodgeMovement(player: LivePlayer, match: LiveMatch): {x:number, y:number} | null {
    if (player.stats.mechanics < 50) return null; // 피지컬 낮으면 안 피함

    const myTeam = match.blueTeam.includes(player) ? 'BLUE' : 'RED';
    let threat = null;
    let minDist = 10;

    if (!match.projectiles) return null;

    for (const p of match.projectiles) {
        if (p.team === myTeam) continue; // 아군 투사체 패스
        
        const dx = p.x - player.x;
        const dy = p.y - player.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        if (dist < minDist) {
            minDist = dist;
            threat = p;
        }
    }

    if (threat) {
        // 투사체 진행 방향의 수직 벡터 계산 (회피)
        const dx = player.x - threat.x;
        const dy = player.y - threat.y;
        
        // 수직 벡터 (-y, x)
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
