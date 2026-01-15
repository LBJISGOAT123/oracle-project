// ==========================================
// FILE PATH: /src/engine/match/systems/VisualSystem.ts
// ==========================================
import { LiveMatch, VisualEffect } from '../../../types';

export class VisualSystem {
  // [최적화] 이펙트 시스템 완전 비활성화
  // 평타, 스킬 이펙트 등을 요청해도 아무 일도 일어나지 않음
  static addEffect(match: LiveMatch, effect: Omit<VisualEffect, 'id' | 'duration' | 'maxDuration'>, duration: number = 0.5) {
    return; 
  }

  static update(match: LiveMatch, dt: number) {
    // 기존에 남아있을지 모를 이펙트 배열만 정리 (메모리 해제)
    if (match.visualEffects && match.visualEffects.length > 0) {
        match.visualEffects = [];
    }
  }
}
