// ==========================================
// FILE PATH: /src/engine/match/systems/StatusManager.ts
// ==========================================
import { LivePlayer } from '../../../types';

interface StatusState {
  stunTimer: number;   // 기절 남은 시간
  slowTimer: number;   // 둔화 남은 시간
  silenceTimer: number; // 침묵 남은 시간
}

// 객체에 직접 속성을 추가하지 않고 외부에서 관리 (메모리 누수 방지)
const statusStore = new WeakMap<LivePlayer, StatusState>();

export class StatusManager {
  
  static init(player: LivePlayer) {
    if (!statusStore.has(player)) {
      statusStore.set(player, { stunTimer: 0, slowTimer: 0, silenceTimer: 0 });
    }
  }

  static applyStun(player: LivePlayer, duration: number) {
    this.init(player);
    const state = statusStore.get(player)!;
    // 기존 스턴보다 길면 덮어씌움 (강인함 로직 추가 가능)
    if (duration > state.stunTimer) {
        state.stunTimer = duration;
    }
  }

  static update(player: LivePlayer, dt: number) {
    const state = statusStore.get(player);
    if (!state) return;

    if (state.stunTimer > 0) state.stunTimer -= dt;
    if (state.slowTimer > 0) state.slowTimer -= dt;
    if (state.silenceTimer > 0) state.silenceTimer -= dt;
  }

  static isStunned(player: LivePlayer): boolean {
    const state = statusStore.get(player);
    return state ? state.stunTimer > 0 : false;
  }

  static getRemainingStunTime(player: LivePlayer): number {
    const state = statusStore.get(player);
    return state ? Math.max(0, state.stunTimer) : 0;
  }
}
