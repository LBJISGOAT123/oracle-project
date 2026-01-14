// ==========================================
// FILE PATH: /src/engine/match/ai/tactics/EvasionSystem.ts
// ==========================================
import { LivePlayer, LiveMatch, Projectile } from '../../../../types';
import { Vector, Vector2 } from '../../../match/utils/Vector';
import { AIUtils } from '../AIUtils';

export class EvasionSystem {
  
  /**
   * 날아오는 투사체를 피하기 위한 이동 벡터를 계산합니다.
   * 위협이 없으면 null 반환
   */
  static getDodgeVector(player: LivePlayer, match: LiveMatch): Vector2 | null {
    const mechanics = player.stats.mechanics; // 0 ~ 100
    
    // 피지컬이 낮으면(40 이하) 피할 생각을 안 함 (그대로 맞음)
    if (mechanics < 40) return null;

    // 감지 범위 (피지컬이 높을수록 멀리서 봄)
    const detectRange = 5 + (mechanics / 10); 

    let closestThreat: Projectile | null = null;
    let minDist = 999;

    // 1. 나에게 날아오는 적 투사체 탐색
    const enemyTeam = match.blueTeam.includes(player) ? 'RED' : 'BLUE';
    
    for (const p of match.projectiles || []) {
        if (p.team !== enemyTeam) continue; // 아군 건 무시
        
        const dist = AIUtils.dist(player, p);
        if (dist < detectRange && dist < minDist) {
            // 투사체가 나를 향하고 있는지 내적(Dot Product)으로 확인 (고급 로직)
            // 여기선 단순하게 거리만 체크
            minDist = dist;
            closestThreat = p;
        }
    }

    // 2. 회피 기동 계산 (Side Step)
    if (closestThreat) {
        // 반응속도 체크: 피지컬 100이면 100% 반응, 50이면 50% 확률로 멍때림
        if (Math.random() * 100 > mechanics) return null;

        const threatPos = { x: closestThreat.x, y: closestThreat.y };
        const myPos = { x: player.x, y: player.y };
        
        // 투사체 진행 방향
        // (투사체의 속도 벡터를 모르므로, 투사체->나의 벡터를 기준으로 삼음)
        const incomingDir = Vector.sub(myPos, threatPos);
        
        // 투사체 진행 방향의 수직 벡터(Perpendicular) 계산
        // (x, y) -> (-y, x)
        let dodgeDir = { x: -incomingDir.y, y: incomingDir.x };
        
        // 정규화 후 이동
        dodgeDir = Vector.normalize(dodgeDir);
        
        // 로그(가끔)
        if (Math.random() < 0.01) {
            // console.log(`${player.name}가 투사체 회피 시도!`);
        }

        // 현재 위치에서 회피 방향으로 3만큼 이동한 지점 반환
        return Vector.add(myPos, Vector.mult(dodgeDir, 3));
    }

    return null;
  }
}
