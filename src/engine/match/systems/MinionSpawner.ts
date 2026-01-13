// ==========================================
// FILE PATH: /src/engine/match/systems/MinionSpawner.ts
// ==========================================
import { LiveMatch, Minion } from '../../../types';
import { BASES } from '../constants/MapConstants';

// [핵심] 전체 제한(120) 대신 팀별 제한(60)을 적용하여 한 팀이 스폰을 독점하는 현상 방지
const MAX_MINIONS_PER_TEAM = 60;

export class MinionSpawner {
  
  static spawnWave(match: LiveMatch, team: 'BLUE' | 'RED') {
    if (!match.minions) match.minions = [];

    // 1. 해당 팀의 현재 미니언 수 체크
    const currentCount = match.minions.filter(m => m.team === team && m.hp > 0).length;
    
    // 2. 팀별 제한을 넘으면 생성 중단 (상대팀 생성에는 영향 없음 - 이즈마한 구원!)
    if (currentCount >= MAX_MINIONS_PER_TEAM) return;

    const lanes = ['TOP', 'MID', 'BOT'] as const;
    const startPos = team === 'BLUE' ? BASES.BLUE : BASES.RED;
    
    // 게임 시간에 따른 스탯 스케일링
    const rawScaling = 1 + (match.currentDuration / 900); 
    const timeScaling = Math.min(3.5, rawScaling); 

    // 대포 미니언 생성 주기 (3웨이브마다)
    const isSiegeWave = Math.floor(match.currentDuration / 30) % 3 === 0;

    lanes.forEach(lane => {
      // 전사 미니언 3마리
      for (let i = 0; i < 3; i++) {
        match.minions!.push(this.createMinion(team, lane, 'MELEE', startPos, timeScaling));
      }
      // 마법사 미니언 3마리
      for (let i = 0; i < 3; i++) {
        match.minions!.push(this.createMinion(team, lane, 'RANGED', startPos, timeScaling));
      }
      // 대포 미니언 1마리
      if (isSiegeWave) {
        match.minions!.push(this.createMinion(team, lane, 'SIEGE', startPos, timeScaling));
      }
    });
  }

  private static createMinion(team: 'BLUE' | 'RED', lane: any, type: any, pos: {x:number, y:number}, scaling: number): Minion {
    // 겹침 방지를 위한 약간의 위치 랜덤값
    const offsetX = (Math.random() - 0.5) * 2;
    const offsetY = (Math.random() - 0.5) * 2;
    
    let hp = 550, atk = 25;
    if (type === 'RANGED') { hp = 350; atk = 45; }
    if (type === 'SIEGE') { hp = 950; atk = 70; }

    return {
      id: `minion_${team}_${lane}_${Date.now()}_${Math.random().toString(36).substr(2,4)}`,
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
