// ==========================================
// FILE PATH: /src/engine/match/systems/MinionSystem.ts
// ==========================================
import { LiveMatch, Minion, BattleSettings, Hero } from '../../../types';
import { MinionLogic } from '../logics/MinionLogic';
import { MinionSpawner } from './MinionSpawner';
import { SpatialGrid } from '../utils/SpatialGrid';

const WAVE_INTERVAL = 30;

// [최적화] 그리드 인스턴스를 재사용 (GC 방지)
const blueMinionGrid = new SpatialGrid();
const redMinionGrid = new SpatialGrid();
const blueHeroGrid = new SpatialGrid();
const redHeroGrid = new SpatialGrid();

export class MinionSystem {
  static update(match: LiveMatch, settings: BattleSettings, dt: number, heroes: Hero[]) {
    if (!match.minions) match.minions = [];

    // 1. 미니언 스폰 체크
    const currentWaveCycle = Math.floor(match.currentDuration / WAVE_INTERVAL);
    const prevWaveCycle = Math.floor((match.currentDuration - dt) / WAVE_INTERVAL);

    if (currentWaveCycle > prevWaveCycle) {
      MinionSpawner.spawnWave(match, 'BLUE');
      MinionSpawner.spawnWave(match, 'RED');
    }

    // 2. 죽은 미니언 정리 (Filter는 메모리 할당하므로, Splice로 최적화하거나 주기적으로 수행)
    // 여기서는 안전하게 기존 방식 유지하되, 조건문 최적화
    match.minions = match.minions.filter(m => m.hp > 0);

    // 3. [핵심] 공간 분할 그리드 구축 (매 프레임 1회)
    // Clear
    blueMinionGrid.clear();
    redMinionGrid.clear();
    blueHeroGrid.clear();
    redHeroGrid.clear();

    // Build Grid (O(N) - 아주 빠름)
    // 미니언 배치
    for (let i = 0; i < match.minions.length; i++) {
        const m = match.minions[i];
        if (m.team === 'BLUE') blueMinionGrid.insert(m);
        else redMinionGrid.insert(m);
    }
    // 영웅 배치
    for (const h of match.blueTeam) { if (h.currentHp > 0) blueHeroGrid.insert(h); }
    for (const h of match.redTeam) { if (h.currentHp > 0) redHeroGrid.insert(h); }

    // 4. 미니언 로직 실행
    const currentTime = match.currentDuration;

    for (let i = 0; i < match.minions.length; i++) {
        const m = match.minions[i];
        
        // [최적화] AI 스로틀링 (반응 속도 분산)
        // 각 미니언마다 고유한 다음 생각 시간(nextThinkTime)을 가짐
        // 만약 없으면 랜덤하게 할당하여 부하 분산
        if (!(m as any).nextThinkTime) {
            (m as any).nextThinkTime = currentTime + Math.random() * 0.5;
        }

        const shouldThink = currentTime >= (m as any).nextThinkTime;
        if (shouldThink) {
            // 다음 생각 시간: 0.3 ~ 0.5초 뒤 (사람 반응속도와 유사)
            (m as any).nextThinkTime = currentTime + 0.3 + Math.random() * 0.2;
        }

        // 팀에 맞는 적 그리드 선택
        const enemyGrids = m.team === 'BLUE' ? {
            minions: redMinionGrid,
            heroes: redHeroGrid
        } : {
            minions: blueMinionGrid,
            heroes: blueHeroGrid
        };

        // 로직 수행 (shouldThink가 false면 타겟 탐색을 건너뛰고 이동/공격만 함)
        MinionLogic.processSingleMinion(
            m, match, settings, dt, enemyGrids, shouldThink, heroes
        );
    }
  }
}
