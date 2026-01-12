import { Vector, Vector2 } from '../utils/Vector';
import { LivePlayer } from '../../../types';
import { MOVEMENT_SETTINGS } from '../constants/MapConstants';

export class SteeringSystem {
  /**
   * 목표 지점으로 향하는 힘(Seek)과 
   * 동료들과 겹치지 않으려는 힘(Separation)을 합쳐서
   * 최종 이동 벡터를 계산합니다.
   */
  static calculateSteering(
    me: LivePlayer, 
    target: Vector2, 
    neighbors: LivePlayer[], 
    maxSpeed: number
  ): Vector2 {
    const myPos = { x: me.x, y: me.y };
    
    // 1. Seek (목표 지점으로 가려는 힘)
    const desired = Vector.sub(target, myPos);
    const dist = Vector.mag(desired);
    
    let seekForce = Vector.normalize(desired);
    
    // 도착 지점에 가까워지면 감속 (Arrive 동작)
    if (dist < MOVEMENT_SETTINGS.ARRIVAL_TOLERANCE * 5) {
      const m = (dist / (MOVEMENT_SETTINGS.ARRIVAL_TOLERANCE * 5)) * maxSpeed;
      seekForce = Vector.mult(seekForce, m);
    } else {
      seekForce = Vector.mult(seekForce, maxSpeed);
    }

    // 2. Separation (동료와 거리두기)
    let sepForce = { x: 0, y: 0 };
    let count = 0;
    
    for (const other of neighbors) {
      if (other === me || other.currentHp <= 0) continue;
      const d = Vector.dist(myPos, { x: other.x, y: other.y });
      
      if (d > 0 && d < MOVEMENT_SETTINGS.SEPARATION_DIST) {
        let diff = Vector.sub(myPos, { x: other.x, y: other.y });
        diff = Vector.normalize(diff);
        diff = Vector.div(diff, d); // 가까울수록 더 강하게 밀어냄
        sepForce = Vector.add(sepForce, diff);
        count++;
      }
    }
    
    if (count > 0) {
      sepForce = Vector.div(sepForce, count);
      sepForce = Vector.normalize(sepForce);
      sepForce = Vector.mult(sepForce, maxSpeed); // 분리력 최대화
    }

    // 3. 힘의 합성 (목적지 60% + 분리 40%)
    // 정글러나 라인전 상황에 따라 가중치 조절 가능
    const totalForce = Vector.add(
      Vector.mult(seekForce, 1.0),
      Vector.mult(sepForce, 1.5) // 겹치는걸 싫어하도록 가중치 높임
    );
    
    return totalForce; // 정규화하지 않고 속도로 바로 사용 (간소화)
  }
}
