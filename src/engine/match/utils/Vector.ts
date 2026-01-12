export interface Vector2 { x: number; y: number; }

export class Vector {
  static add(v1: Vector2, v2: Vector2): Vector2 { return { x: v1.x + v2.x, y: v1.y + v2.y }; }
  static sub(v1: Vector2, v2: Vector2): Vector2 { return { x: v1.x - v2.x, y: v1.y - v2.y }; }
  static mult(v: Vector2, n: number): Vector2 { return { x: v.x * n, y: v.y * n }; }
  static div(v: Vector2, n: number): Vector2 { return n === 0 ? v : { x: v.x / n, y: v.y / n }; }
  
  static mag(v: Vector2): number { return Math.sqrt(v.x * v.x + v.y * v.y); }
  
  static normalize(v: Vector2): Vector2 {
    const m = Vector.mag(v);
    return m === 0 ? { x: 0, y: 0 } : Vector.div(v, m);
  }

  static dist(v1: Vector2, v2: Vector2): number {
    return Math.sqrt(Math.pow(v1.x - v2.x, 2) + Math.pow(v1.y - v2.y, 2));
  }

  static limit(v: Vector2, max: number): Vector2 {
    const m = Vector.mag(v);
    return m > max ? Vector.mult(Vector.normalize(v), max) : v;
  }
  
  // 선형 보간 (부드러운 움직임)
  static lerp(v1: Vector2, v2: Vector2, t: number): Vector2 {
    return {
      x: v1.x + (v2.x - v1.x) * t,
      y: v1.y + (v2.y - v1.y) * t
    };
  }
}
