// ==========================================
// FILE PATH: /src/engine/match/systems/MinionSpawner.ts
// ==========================================
import { LiveMatch, Minion } from '../../../types';
import { BASES } from '../constants/MapConstants';

// 팀별 최대 미니언 수 (최적화 및 렉 방지)
const MAX_MINIONS_PER_TEAM = 60;

export class MinionSpawner {
  
  static spawnWave(match: LiveMatch, team: 'BLUE' | 'RED') {
    if (!match.minions) match.minions = [];

    // 1. [개선된 로직] 캡 관리 (공간 확보)
    // 꽉 찼다고 안 뽑는 게 아니라, 약한 개체를 도태시키고 새로 뽑음
    this.cullExcessMinions(match, team);

    const lanes = ['TOP', 'MID', 'BOT'] as const;
    const startPos = team === 'BLUE' ? BASES.BLUE : BASES.RED;
    
    // 게임 시간에 따른 스탯 스케일링 (15분 기준 약 2배)
    const rawScaling = 1 + (match.currentDuration / 900); 
    const timeScaling = Math.min(3.5, rawScaling); 

    // 대포 미니언 생성 주기 (3웨이브마다)
    const isSiegeWave = Math.floor(match.currentDuration / 30) % 3 === 0;

    const newMinions: Minion[] = [];

    lanes.forEach(lane => {
      // 전사 미니언 3마리
      for (let i = 0; i < 3; i++) {
        newMinions.push(this.createMinion(team, lane, 'MELEE', startPos, timeScaling));
      }
      // 마법사 미니언 3마리
      for (let i = 0; i < 3; i++) {
        newMinions.push(this.createMinion(team, lane, 'RANGED', startPos, timeScaling));
      }
      // 대포 미니언 1마리
      if (isSiegeWave) {
        newMinions.push(this.createMinion(team, lane, 'SIEGE', startPos, timeScaling));
      }
    });

    // 기존 배열에 새 미니언 추가
    match.minions.push(...newMinions);
  }

  /**
   * 미니언 수가 한계를 넘으면 우선순위가 낮은(체력이 적거나 오래된) 미니언을 강제로 제거합니다.
   */
  private static cullExcessMinions(match: LiveMatch, team: 'BLUE' | 'RED') {
    const teamMinions = match.minions!.filter(m => m.team === team && m.hp > 0);
    const waveSize = 7; // 한 웨이브당 대략 7마리 생성됨 (3+3+1)
    
    // 새로 생성될 공간(waveSize)만큼 여유가 없으면 정리 시작
    if (teamMinions.length + waveSize > MAX_MINIONS_PER_TEAM) {
        const removeCount = (teamMinions.length + waveSize) - MAX_MINIONS_PER_TEAM;
        
        // [우선순위 정렬]
        // 1. 체력 비율이 낮은 순 (죽기 직전인 놈부터)
        // 2. ID 기준 (오래된 놈부터)
        // 거신병(SUMMONED_COLOSSUS)은 절대 삭제하지 않음
        const candidates = teamMinions
            .filter(m => m.type !== 'SUMMONED_COLOSSUS') 
            .sort((a, b) => {
                const hpRatioA = a.hp / a.maxHp;
                const hpRatioB = b.hp / b.maxHp;
                if (Math.abs(hpRatioA - hpRatioB) > 0.1) return hpRatioA - hpRatioB;
                return a.id.localeCompare(b.id); // 오래된 순
            });

        // 삭제 대상 ID 수집
        const removeIds = new Set(candidates.slice(0, removeCount).map(m => m.id));

        // 실제 배열에서 제거 (직접 할당)
        match.minions = match.minions!.filter(m => !removeIds.has(m.id));
    }
  }

  private static createMinion(team: 'BLUE' | 'RED', lane: any, type: any, pos: {x:number, y:number}, scaling: number): Minion {
    // 겹침 방지를 위한 약간의 위치 랜덤값 (Spawn Jitter)
    const offsetX = (Math.random() - 0.5) * 3; // 2 -> 3으로 약간 넓힘
    const offsetY = (Math.random() - 0.5) * 3;
    
    let hp = 550, atk = 25;
    // [밸런스 미세 조정]
    if (type === 'RANGED') { hp = 350; atk = 45; }
    if (type === 'SIEGE') { hp = 950; atk = 70; } // 대포 체력/공격력 상향

    // ID에 타임스탬프를 넣어 생성 순서 보장
    return {
      id: `minion_${team}_${lane}_${Date.now()}_${Math.random().toString(36).substr(2,5)}`,
      team, lane, type,
      x: pos.x + offsetX, 
      y: pos.y + offsetY,
      hp: Math.floor(hp * scaling), 
      maxHp: Math.floor(hp * scaling), 
      atk: Math.floor(atk * scaling),
      pathIdx: 0
    };
  }
}
