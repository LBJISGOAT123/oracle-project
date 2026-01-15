// ==========================================
// FILE PATH: /src/engine/match/ai/perception/ObservationSystem.ts
// ==========================================
import { LivePlayer, LiveMatch } from '../../../../types';
import { Vector, Vector2 } from '../../../match/utils/Vector';
import { AIUtils } from '../AIUtils';

// 적의 마지막 위치와 시간, 속도 벡터를 저장
interface TraceData {
  lastPos: Vector2;
  velocity: Vector2;
  timestamp: number;
}

const traceMemory = new WeakMap<LivePlayer, Record<string, TraceData>>();

export class ObservationSystem {

  /**
   * 매 프레임 호출되어 적들의 움직임을 추적하고 기억을 갱신합니다.
   */
  static updateObservations(observer: LivePlayer, match: LiveMatch) {
    const isBlue = match.blueTeam.includes(observer);
    const enemies = isBlue ? match.redTeam : match.blueTeam;
    
    let memory = traceMemory.get(observer);
    if (!memory) {
        memory = {};
        traceMemory.set(observer, memory);
    }

    const now = match.currentDuration;

    enemies.forEach(enemy => {
        // 시야 내에 있는 적만 정보 갱신
        const dist = AIUtils.dist(observer, enemy);
        const isVisible = dist <= 15; // 기본 시야 15

        if (isVisible && enemy.currentHp > 0) {
            // 속도 벡터 계산 (이전 위치와 비교)
            const prevData = memory![enemy.heroId];
            let velocity = { x: 0, y: 0 };
            
            if (prevData) {
                // dt가 짧아서 노이즈가 심할 수 있으므로 간단한 이동 평균 느낌으로 처리
                // (현재는 0.1초 틱이므로 단순 차이값 사용)
                velocity = Vector.sub({ x: enemy.x, y: enemy.y }, prevData.lastPos);
            }

            memory![enemy.heroId] = {
                lastPos: { x: enemy.x, y: enemy.y },
                velocity: velocity,
                timestamp: now
            };
        }
    });
  }

  /**
   * [추적] 시야에서 사라진 적의 마지막 위치를 반환합니다.
   * (3초 이내의 정보만 유효)
   */
  static getLastKnownPosition(observer: LivePlayer, targetId: string, currentTime: number): Vector2 | null {
    const memory = traceMemory.get(observer);
    if (!memory || !memory[targetId]) return null;

    const data = memory[targetId];
    // 3초가 지났으면 놓친 것으로 간주
    if (currentTime - data.timestamp > 3.0) return null;

    return data.lastPos;
  }

  /**
   * [예측 사격] 타겟의 이동 방향을 고려한 미래 좌표를 계산합니다.
   */
  static getPredictedPosition(
    observer: LivePlayer, 
    target: LivePlayer, 
    projectileSpeed: number, // 투사체 속도 (보통 15~20)
    delay: number = 0.2 // 시전 시간
  ): Vector2 {
    const memory = traceMemory.get(observer);
    const data = memory ? memory[target.heroId] : null;

    // 데이터가 없거나 속도가 거의 없으면 현재 위치 반환
    if (!data || Vector.mag(data.velocity) < 0.01) {
        return { x: target.x, y: target.y };
    }

    const dist = AIUtils.dist(observer, target);
    const travelTime = (dist / projectileSpeed) + delay;

    // [뇌지컬 보정] 
    // 뇌지컬이 높으면(>70) 예측을 정확히 하고, 낮으면(<30) 엉뚱한 곳(지나친 예측)을 쏨
    const brain = observer.stats.brain;
    let accuracy = 1.0;
    
    if (brain > 70) accuracy = 1.0; // 완벽 예측
    else if (brain < 40) accuracy = 0.5; // 반만 예측 (덜 쏨)
    else accuracy = 0.8;

    // 미래 위치 = 현재 위치 + (속도 * 시간 * 정확도)
    // velocity는 0.1초당 이동량이므로, travelTime(초)을 0.1로 나눠서 곱해야 함
    const frames = travelTime / 0.1;
    const predictionVector = Vector.mult(data.velocity, frames * accuracy);

    return Vector.add({ x: target.x, y: target.y }, predictionVector);
  }
}
