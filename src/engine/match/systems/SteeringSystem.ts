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
    
    // [최적화] 도착 시 완전 정지 (떨림 방지)
    if (dist < 0.5) {
        return { x: 0, y: 0 };
    }

    let seekForce = Vector.normalize(desired);
    
    // Arrival (감속)
    if (dist < MOVEMENT_SETTINGS.ARRIVAL_TOLERANCE * 5) {
      const m = (dist / (MOVEMENT_SETTINGS.ARRIVAL_TOLERANCE * 5)) * maxSpeed;
      seekForce = Vector.mult(seekForce, m);
    } else {
      seekForce = Vector.mult(seekForce, maxSpeed);
    }

    // 2. Separation (밀어내기) - [수정] 힘 대폭 약화
    let sepForce = { x: 0, y: 0 };
    let count = 0;
    
    for (const other of neighbors) {
      if (other === me || other.currentHp <= 0) continue;
      const d = Vector.dist(myPos, { x: other.x, y: other.y });
      
      if (d > 0 && d < MOVEMENT_SETTINGS.SEPARATION_DIST) {
        let diff = Vector.sub(myPos, { x: other.x, y: other.y });
        diff = Vector.normalize(diff);
        diff = Vector.div(diff, d); 
        sepForce = Vector.add(sepForce, diff);
        count++;
      }
    }
    
    if (count > 0) {
      sepForce = Vector.div(sepForce, count);
      sepForce = Vector.normalize(sepForce);
      // [수정] 밀어내는 힘을 maxSpeed만큼 주지 않고 0.5배로 줄임 (덜덜거림 방지)
      sepForce = Vector.mult(sepForce, maxSpeed * 0.5); 
    }

    // [수정] 힘의 합성 비율 조정 (이동 우선순위 높임)
    // 기존: Seek 1.0 : Sep 1.5 -> 변경: Seek 1.2 : Sep 0.6
    const totalForce = Vector.add(
      Vector.mult(seekForce, 1.2),
      Vector.mult(sepForce, 0.6) 
    );
    
    return totalForce; 
  }
}
