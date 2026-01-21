// ==========================================
// FILE PATH: /src/engine/match/systems/ProjectileSystem.ts
// ==========================================
import { LiveMatch, Projectile } from '../../../types';
import { Collision } from '../utils/Collision';

export class ProjectileSystem {
  static update(match: LiveMatch, dt: number) {
    if (!match.projectiles) match.projectiles = [];
    const projs = match.projectiles;

    // [최적화] 배열을 거꾸로 순회하며 삭제 (Splice 사용) -> filter로 인한 새 배열 할당 방지
    for (let i = projs.length - 1; i >= 0; i--) {
      const p = projs[i];

      // 삭제 플래그 확인
      if (p.remove) {
          projs.splice(i, 1);
          continue;
      }

      let targetPos = p.targetPos;

      if (p.targetId) {
        const target = [...match.blueTeam, ...match.redTeam].find(u => u.heroId === p.targetId);
        if (target && target.currentHp > 0) {
          targetPos = { x: target.x, y: target.y };
        } else {
          // 타겟 사망/소멸 시 투사체도 소멸
          projs.splice(i, 1);
          continue;
        }
      }

      if (!targetPos) {
          projs.splice(i, 1);
          continue;
      }

      const dx = targetPos.x - p.x;
      const dy = targetPos.y - p.y;
      const dist = Math.sqrt(dx*dx + dy*dy);

      // 충돌 판정
      if (dist < p.hitRadius || dist < (p.speed * dt * 0.1)) {
        this.onHit(match, p);
        projs.splice(i, 1); // 적중 후 삭제
      } else {
        // 이동
        p.x += (dx / dist) * p.speed * dt * 0.1;
        p.y += (dy / dist) * p.speed * dt * 0.1;

        // 맵 밖으로 나가면 삭제
        if (p.x < -10 || p.x > 110 || p.y < -10 || p.y > 110) {
            projs.splice(i, 1);
        }
      }
    }
  }

  static spawn(match: LiveMatch, p: Projectile) {
    if (!match.projectiles) match.projectiles = [];
    // 화면에 투사체가 너무 많으면(50개 이상) 이펙트 생략하고 즉시 적중 처리 (성능 우선)
    if (match.projectiles.length < 50) {
        match.projectiles.push(p);
    } else {
        this.onHit(match, p);
    }
  }

  private static onHit(match: LiveMatch, p: Projectile) {
    let targets = p.team === 'BLUE' ? match.redTeam : match.blueTeam;
    let victim = null;

    if (p.targetId) {
      victim = targets.find(t => t.heroId === p.targetId);
    } else {
      victim = Collision.findNearest(p, targets, p.hitRadius + 2);
    }

    if (victim) {
      victim.currentHp -= p.damage;
    }
  }
}
