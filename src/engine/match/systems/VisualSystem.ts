// ==========================================
// FILE PATH: /src/engine/match/systems/VisualSystem.ts
// ==========================================
import { LiveMatch, VisualEffect } from '../../../types';

export class VisualSystem {
  
  static addEffect(match: LiveMatch, effect: Omit<VisualEffect, 'id' | 'duration' | 'maxDuration'>, duration: number = 0.5) {
    if (!match.visualEffects) match.visualEffects = [];
    
    // [최적화] 이펙트 개수 제한 (최대 30개까지만 표시)
    if (match.visualEffects.length > 30) {
        match.visualEffects.shift(); // 오래된 것부터 삭제
    }

    match.visualEffects.push({
      ...effect,
      id: Math.random().toString(36).substr(2, 9),
      duration: duration,
      maxDuration: duration
    });
  }

  static update(match: LiveMatch, dt: number) {
    if (!match.visualEffects) return;

    // 역방향 루프로 안전하게 삭제
    for (let i = match.visualEffects.length - 1; i >= 0; i--) {
        const ef = match.visualEffects[i];
        ef.duration -= dt;

        if (ef.type === 'PROJECTILE' && ef.targetX !== undefined && ef.targetY !== undefined) {
            const speed = 15; 
            const dx = ef.targetX - ef.x;
            const dy = ef.targetY - ef.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            
            if (dist > 1) {
                ef.x += (dx / dist) * speed * dt;
                ef.y += (dy / dist) * speed * dt;
            } else {
                match.visualEffects.splice(i, 1);
                // 도착 시 타격 이펙트 생성 (이것도 개수 제한 적용됨)
                this.addEffect(match, {
                    type: 'HIT',
                    x: ef.targetX, y: ef.targetY,
                    color: ef.color,
                    size: ef.size * 2
                }, 0.4);
                continue; 
            }
        }

        if (ef.duration <= 0) {
            match.visualEffects.splice(i, 1);
        }
    }
  }
}
