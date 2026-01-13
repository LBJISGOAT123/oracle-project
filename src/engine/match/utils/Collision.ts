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

  // [최적화] 원형 충돌 체크
  static checkCircle(p1: Point, r1: number, p2: Point, r2: number): boolean {
    const d2 = this.distSq(p1, p2);
    const radSum = r1 + r2;
    return d2 <= radSum * radSum;
  }

  // [최적화] 사거리 체크 (거리 제곱 비교)
  static inRange(attacker: Point, target: Point, range: number): boolean {
    return this.distSq(attacker, target) <= (range * range);
  }

  // [최적화] 가장 가까운 적 찾기
  static findNearest<T extends Point>(me: Point, targets: T[], maxRange: number = 999): T | null {
    let nearest: T | null = null;
    let minDistSq = maxRange * maxRange;

    for (let i = 0; i < targets.length; i++) {
      const t = targets[i];
      const dSq = this.distSq(me, t);
      
      if (dSq < minDistSq) {
        minDistSq = dSq;
        nearest = t;
      }
    }
    return nearest;
  }
}
