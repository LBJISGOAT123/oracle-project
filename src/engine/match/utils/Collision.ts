// ==========================================
// FILE PATH: /src/engine/match/utils/Collision.ts
// ==========================================

export interface Point { x: number; y: number; }

export class Collision {
  // 원형 충돌 체크 (거리 기반)
  static checkCircle(p1: Point, r1: number, p2: Point, r2: number): boolean {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    const distSq = dx*dx + dy*dy;
    const radSum = r1 + r2;
    return distSq <= radSum * radSum;
  }

  // 점이 사거리 안에 있는지 체크
  static inRange(attacker: Point, target: Point, range: number): boolean {
    const dx = attacker.x - target.x;
    const dy = attacker.y - target.y;
    return (dx*dx + dy*dy) <= (range * range);
  }

  // 가장 가까운 적 찾기 (제네릭 타입)
  static findNearest<T extends Point>(me: Point, targets: T[], maxRange: number = 999): T | null {
    let nearest: T | null = null;
    let minDistSq = maxRange * maxRange;

    for (const t of targets) {
      const dx = me.x - t.x;
      const dy = me.y - t.y;
      const dSq = dx*dx + dy*dy;
      
      if (dSq < minDistSq) {
        minDistSq = dSq;
        nearest = t;
      }
    }
    return nearest;
  }
}
