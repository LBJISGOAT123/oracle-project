// ==========================================
// FILE PATH: /src/engine/match/systems/MinionSystem.ts
// ==========================================
import { LiveMatch, Minion, BattleSettings, Hero } from '../../../types';
import { MinionLogic } from '../logics/MinionLogic';
import { MinionSpawner } from './MinionSpawner';
import { SpatialGrid } from '../utils/SpatialGrid'; // [신규]

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

    // 2. [최적화] 전체 미니언 및 영웅 그리드 구축
    // 기존의 라인별 캐싱(cachedEnemies) 대신 그리드 사용
    const minionList = match.minions;
    const blueMinions = minionList.filter(m => m.team === 'BLUE');
    const redMinions = minionList.filter(m => m.team === 'RED');
    const blueHeroes = match.blueTeam.filter(h => h.currentHp > 0);
    const redHeroes = match.redTeam.filter(h => h.currentHp > 0);

    const grids = {
        // 블루팀 입장에서의 적 (레드팀)
        BLUE_ENEMIES: {
            minions: new SpatialGrid(redMinions),
            heroes: new SpatialGrid(redHeroes)
        },
        // 레드팀 입장에서의 적 (블루팀)
        RED_ENEMIES: {
            minions: new SpatialGrid(blueMinions),
            heroes: new SpatialGrid(blueHeroes)
        }
    };

    // 3. 미니언 로직 실행
    // 미니언은 인터리빙 없이 매 프레임 돌려도 그리드 덕분에 빠름
    for (let i = 0; i < match.minions.length; i++) {
        const m = match.minions[i];
        
        // 내 팀에 맞는 적 그리드 선택
        const enemyGrids = m.team === 'BLUE' ? grids.BLUE_ENEMIES : grids.RED_ENEMIES;

        MinionLogic.processSingleMinion(
            m, match, settings, dt, enemyGrids, true, heroes
        );
    }
  }
}
