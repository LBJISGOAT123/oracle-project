// ==========================================
// FILE PATH: /src/engine/match/systems/MinionSpawner.ts
// ==========================================
import { LiveMatch, Minion } from '../../../types';
import { BASES } from '../constants/MapConstants';

const MAX_MINIONS_PER_TEAM = 60;

export class MinionSpawner {
  
  static spawnWave(match: LiveMatch, team: 'BLUE' | 'RED') {
    if (!match.minions) match.minions = [];

    this.cullExcessMinions(match, team);

    const lanes = ['TOP', 'MID', 'BOT'] as const;
    const startPos = team === 'BLUE' ? BASES.BLUE : BASES.RED;
    
    // 성장 속도
    const rawScaling = 1 + (match.currentDuration / 1200); 
    const timeScaling = Math.min(2.5, rawScaling); 

    const isSiegeWave = Math.floor(match.currentDuration / 30) % 3 === 0;
    const newMinions: Minion[] = [];

    lanes.forEach(lane => {
      for (let i = 0; i < 3; i++) {
        newMinions.push(this.createMinion(team, lane, 'MELEE', startPos, timeScaling));
      }
      for (let i = 0; i < 3; i++) {
        newMinions.push(this.createMinion(team, lane, 'RANGED', startPos, timeScaling));
      }
      if (isSiegeWave) {
        newMinions.push(this.createMinion(team, lane, 'SIEGE', startPos, timeScaling));
      }
    });

    match.minions.push(...newMinions);
  }

  private static cullExcessMinions(match: LiveMatch, team: 'BLUE' | 'RED') {
    const teamMinions = match.minions!.filter(m => m.team === team && m.hp > 0);
    const waveSize = 7;
    
    if (teamMinions.length + waveSize > MAX_MINIONS_PER_TEAM) {
        const removeCount = (teamMinions.length + waveSize) - MAX_MINIONS_PER_TEAM;
        const candidates = teamMinions
            .filter(m => m.type !== 'SUMMONED_COLOSSUS') 
            .sort((a, b) => {
                const hpRatioA = a.hp / a.maxHp;
                const hpRatioB = b.hp / b.maxHp;
                if (Math.abs(hpRatioA - hpRatioB) > 0.1) return hpRatioA - hpRatioB;
                return a.id.localeCompare(b.id);
            });

        const removeIds = new Set(candidates.slice(0, removeCount).map(m => m.id));
        match.minions = match.minions!.filter(m => !removeIds.has(m.id));
    }
  }

  private static createMinion(team: 'BLUE' | 'RED', lane: any, type: any, pos: {x:number, y:number}, scaling: number): Minion {
    const offsetX = (Math.random() - 0.5) * 3;
    const offsetY = (Math.random() - 0.5) * 3;
    
    // [밸런스] 미니언 공격력 한 자릿수로 너프 (8~15)
    // 영웅 체력이 1000이므로, 미니언한테는 100대 맞아야 죽음 (안전)
    let hp = 550, atk = 8; 
    if (type === 'RANGED') { hp = 280; atk = 12; } 
    if (type === 'SIEGE') { hp = 850; atk = 25; } 

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
