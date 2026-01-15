// ==========================================
// FILE PATH: /src/engine/match/systems/MinionSystem.ts
// ==========================================
import { LiveMatch, Minion, BattleSettings, Hero } from '../../../types';
import { MinionLogic } from '../logics/MinionLogic';
import { MinionSpawner } from './MinionSpawner';

const WAVE_INTERVAL = 30;

export class MinionSystem {
  static update(match: LiveMatch, settings: BattleSettings, dt: number, heroes: Hero[]) {
    if (!match.minions) match.minions = [];

    const currentWaveCycle = Math.floor(match.currentDuration / WAVE_INTERVAL);
    const prevWaveCycle = Math.floor((match.currentDuration - dt) / WAVE_INTERVAL);

    if (currentWaveCycle > prevWaveCycle) {
      MinionSpawner.spawnWave(match, 'BLUE');
      MinionSpawner.spawnWave(match, 'RED');
    }

    this.processMinions(match, settings, dt, heroes);
  }

  private static processMinions(match: LiveMatch, settings: BattleSettings, dt: number, heroes: Hero[]) {
    // 1. 죽은 미니언 정리
    match.minions = match.minions!.filter(m => m.hp > 0);

    // 2. [수정] Grid 대신 단순 리스트 사용 (안정성 확보)
    // Grid 시스템 오작동으로 인한 0/0/0 버그 해결을 위해 원복
    const minionList = match.minions;
    const blueMinions = minionList.filter(m => m.team === 'BLUE');
    const redMinions = minionList.filter(m => m.team === 'RED');
    const blueHeroes = match.blueTeam.filter(h => h.currentHp > 0);
    const redHeroes = match.redTeam.filter(h => h.currentHp > 0);

    // 3. 미니언 로직 실행 (Mock Grid 객체 전달)
    for (let i = 0; i < match.minions.length; i++) {
        const m = match.minions[i];
        
        // Grid 인터페이스 흉내내지만 실제로는 전체 배열 리턴 (확실한 탐색)
        const enemyGrids = m.team === 'BLUE' ? {
            minions: { getNearbyUnits: () => redMinions } as any,
            heroes: { getNearbyUnits: () => redHeroes } as any
        } : {
            minions: { getNearbyUnits: () => blueMinions } as any,
            heroes: { getNearbyUnits: () => blueHeroes } as any
        };

        MinionLogic.processSingleMinion(
            m, match, settings, dt, enemyGrids, true, heroes
        );
    }
  }
}
