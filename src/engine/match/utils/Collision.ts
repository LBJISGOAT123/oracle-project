// ==========================================
// FILE PATH: /src/engine/match/utils/Collision.ts
// ==========================================

export interface Point { x: number; y: number; }

export class Collision {
  // [최적화] 거리 제곱 계산 (루트 연산 제거)
  static distSq(p1: Point, p2: Point): number {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return dx * dx + dy * dy;
  }

  // [최적화] 사거리 체크 (거리 제곱 비교)
  // range * range를 미리 계산해서 넘기면 더 빠름
  static inRange(attacker: Point, target: Point, range: number): boolean {
    return this.distSq(attacker, target) <= (range * range);
  }

  // [최적화] 가장 가까운 적 찾기
  static findNearest<T extends Point>(me: Point, targets: T[], maxRange: number = 999): T | null {
    let nearest: T | null = null;
    let minDistSq = maxRange * maxRange;

    // for-of 대신 for loop 사용 (미세하지만 더 빠름)
    for (let i = 0; i < targets.length; i++) {
      const t = targets[i];
      // 같은 팀 제외 로직 등은 상위에서 필터링된 배열을 넘겨받는다고 가정
      const dSq = this.distSq(me, t);
      
      if (dSq < minDistSq) {
        minDistSq = dSq;
        nearest = t;
      }
    }
    return nearest;
  }
}
