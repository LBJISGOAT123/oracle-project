// ==========================================
// FILE PATH: /src/engine/match/ai/memory/PersonalMemory.ts
// ==========================================
import { LivePlayer } from '../../../../types';

// 플레이어별 기억 저장소 (타입 확장 없이 WeakMap 활용)
// Key: Player 객체 -> Value: { [enemyHeroId]: { deathsFrom: number, killsOn: number } }
interface MemoryData {
  interactions: Record<string, { deathsFrom: number; killsOn: number }>;
}

const memoryStore = new WeakMap<LivePlayer, MemoryData>();

export class PersonalMemory {
  
  /**
   * 킬 발생 시 기억 업데이트
   */
  static recordEvent(killer: LivePlayer, victim: LivePlayer) {
    // 1. 피해자 입장: "얘가 날 죽였어" (공포 +1)
    this.updateMemory(victim, killer.heroId, 'deathsFrom');
    
    // 2. 가해자 입장: "얘는 내 밥이야" (자신감 +1)
    this.updateMemory(killer, victim.heroId, 'killsOn');
  }

  /**
   * 특정 적에 대한 트라우마(공포) 점수 반환
   * (점수가 높을수록 무서운 적)
   */
  static getThreatLevel(me: LivePlayer, enemyId: string): number {
    const mem = memoryStore.get(me);
    if (!mem || !mem.interactions[enemyId]) return 0;

    const data = mem.interactions[enemyId];
    // 많이 죽었을수록 무섭고, 내가 죽인 적 있으면 덜 무서움
    return (data.deathsFrom * 200) - (data.killsOn * 100);
  }

  private static updateMemory(player: LivePlayer, targetId: string, field: 'deathsFrom' | 'killsOn') {
    let mem = memoryStore.get(player);
    if (!mem) {
      mem = { interactions: {} };
      memoryStore.set(player, mem);
    }

    if (!mem.interactions[targetId]) {
      mem.interactions[targetId] = { deathsFrom: 0, killsOn: 0 };
    }

    mem.interactions[targetId][field]++;
  }
}
