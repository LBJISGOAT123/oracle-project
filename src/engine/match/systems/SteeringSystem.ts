// ==========================================
// FILE PATH: /src/engine/match/systems/SteeringSystem.ts
// ==========================================
import { Vector, Vector2 } from '../utils/Vector';
import { LivePlayer } from '../../../types';
import { MOVEMENT_SETTINGS } from '../constants/MapConstants';

export class SteeringSystem {
  static calculateSteering(
    me: LivePlayer, 
    target: Vector2, 
    neighbors: LivePlayer[], 
    maxSpeed: number
  ): Vector2 {
    const myPos = { x: me.x, y: me.y };
    
    // 1. Seek (목적지 이동)
    const desired = Vector.sub(target, myPos);
    const dist = Vector.mag(desired);
    
    // 도착 시 완전 정지 (떨림 방지)
    if (dist < 0.5) {
        // [수정] 도착했더라도, 주변에 아군이 너무 가까우면(겹쳐있으면) 밀어내는 힘은 작동해야 함
        // 바로 리턴하지 않고 separation 로직으로 넘김
    }

    let seekForce = { x: 0, y: 0 };
    
    if (dist >= 0.5) {
        seekForce = Vector.normalize(desired);
        // Arrival (감속)
        if (dist < MOVEMENT_SETTINGS.ARRIVAL_TOLERANCE * 5) {
          const m = (dist / (MOVEMENT_SETTINGS.ARRIVAL_TOLERANCE * 5)) * maxSpeed;
          seekForce = Vector.mult(seekForce, m);
        } else {
          seekForce = Vector.mult(seekForce, maxSpeed);
        }
    }

    // 2. Separation (밀어내기) - [핵심 수정]
    let sepForce = { x: 0, y: 0 };
    let count = 0;
    
    for (const other of neighbors) {
      if (other === me || other.currentHp <= 0) continue;
      const d = Vector.dist(myPos, { x: other.x, y: other.y });
      
      // 분리 거리 체크 (기본값 2.0)
      if (d > 0 && d < MOVEMENT_SETTINGS.SEPARATION_DIST) {
        let diff = Vector.sub(myPos, { x: other.x, y: other.y });
        diff = Vector.normalize(diff);
        
        // 거리가 가까울수록 더 강하게 밀어냄 (제곱 반비례)
        // d가 0.5 미만이면 아주 강하게 밀어내서 절대 겹치지 않게 함
        const weight = d < 0.5 ? 5.0 : 1.0; 
        
        diff = Vector.div(diff, d); 
        sepForce = Vector.add(sepForce, Vector.mult(diff, weight));
        count++;
      }
    }
    
    if (count > 0) {
      sepForce = Vector.div(sepForce, count);
      sepForce = Vector.normalize(sepForce);
      // [수정] 밀어내는 힘을 강화 (0.5 -> 0.8)
      sepForce = Vector.mult(sepForce, maxSpeed * 0.8); 
    }

    // 힘의 합성
    // 이동하려는 힘(1.0)과 안 겹치려는 힘(0.8)을 적절히 섞음
    const totalForce = Vector.add(
      Vector.mult(seekForce, 1.0),
      Vector.mult(sepForce, 0.8) 
    );
    
    return totalForce; 
  }
}
