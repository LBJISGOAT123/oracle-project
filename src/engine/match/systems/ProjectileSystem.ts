// ==========================================
// FILE PATH: /src/engine/match/systems/ProjectileSystem.ts
// ==========================================
import { LiveMatch, Projectile } from '../../../types';
import { Collision } from '../utils/Collision';

export class ProjectileSystem {
  static update(match: LiveMatch, dt: number) {
    if (!match.projectiles) match.projectiles = [];

    // [최적화] 삭제 예정인 투사체 미리 필터링 (메모리 절약)
    match.projectiles = match.projectiles.filter(p => !p.remove);

    match.projectiles.forEach(p => {
      // [신규] 수명 관리: 생성된 지 3초 넘으면 강제 삭제
      // Projectile 타입에 lifeTime이 없으므로 임시로 확장하거나, 거리를 기준으로 체크
      // 여기서는 맵 밖으로 나가거나 목표 도달 실패 시 삭제 로직 강화
      
      let targetPos = p.targetPos;

      if (p.targetId) {
        const target = [...match.blueTeam, ...match.redTeam].find(u => u.heroId === p.targetId);
        if (target && target.currentHp > 0) {
          targetPos = { x: target.x, y: target.y };
        } else {
          p.remove = true; 
          return;
        }
      }

      if (!targetPos) { p.remove = true; return; }

      const dx = targetPos.x - p.x;
      const dy = targetPos.y - p.y;
      const dist = Math.sqrt(dx*dx + dy*dy);

      // 충돌 판정
      if (dist < p.hitRadius || dist < (p.speed * dt * 0.1)) {
        this.onHit(match, p);
        p.remove = true;
      } else {
        // 이동
        p.x += (dx / dist) * p.speed * dt * 0.1;
        p.y += (dy / dist) * p.speed * dt * 0.1;

        // [안전장치] 맵 밖으로 나가면 삭제
        if (p.x < -10 || p.x > 110 || p.y < -10 || p.y > 110) {
            p.remove = true;
        }
      }
    });
  }

  static spawn(match: LiveMatch, p: Projectile) {
    if (!match.projectiles) match.projectiles = [];
    // [최적화] 화면에 투사체가 너무 많으면(50개 이상) 이펙트 생략
    if (match.projectiles.length < 50) {
        match.projectiles.push(p);
    } else {
        // 이펙트는 생략하되 데미지는 즉시 적용 (시뮬레이션 정합성 유지)
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
