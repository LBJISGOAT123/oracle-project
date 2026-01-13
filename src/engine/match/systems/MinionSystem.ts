import { LiveMatch, Minion, BattleSettings } from '../../../types';
import { BASES } from '../constants/MapConstants';
import { MinionLogic } from '../logics/MinionLogic';

const WAVE_INTERVAL = 30;
const MAX_MINIONS_PER_MATCH = 120; 

export class MinionSystem {
  static update(match: LiveMatch, settings: BattleSettings, dt: number) {
    if (!match.minions) match.minions = [];

    const currentWaveCycle = Math.floor(match.currentDuration / WAVE_INTERVAL);
    const prevWaveCycle = Math.floor((match.currentDuration - dt) / WAVE_INTERVAL);

    if (currentWaveCycle > prevWaveCycle) {
      this.spawnWave(match, 'BLUE');
      this.spawnWave(match, 'RED');
    }

    this.processMinions(match, settings, dt);
  }

  private static spawnWave(match: LiveMatch, team: 'BLUE' | 'RED') {
    if (match.minions!.length > MAX_MINIONS_PER_MATCH) return;

    const lanes = ['TOP', 'MID', 'BOT'] as const;
    const startPos = team === 'BLUE' ? BASES.BLUE : BASES.RED;
    
    const rawScaling = 1 + (match.currentDuration / 900); 
    const timeScaling = Math.min(3.5, rawScaling); 

    lanes.forEach(lane => {
      for (let i = 0; i < 3; i++) {
        match.minions!.push(this.createMinion(team, lane, 'MELEE', startPos, timeScaling));
        match.minions!.push(this.createMinion(team, lane, 'RANGED', startPos, timeScaling));
      }
      if (Math.floor(match.currentDuration / WAVE_INTERVAL) % 3 === 0) {
        match.minions!.push(this.createMinion(team, lane, 'SIEGE', startPos, timeScaling));
      }
    });
  }

  private static createMinion(team: 'BLUE' | 'RED', lane: any, type: any, pos: {x:number, y:number}, scaling: number): Minion {
    const offsetX = (Math.random() - 0.5) * 2;
    const offsetY = (Math.random() - 0.5) * 2;
    
    let hp = 500, atk = 20;
    if (type === 'RANGED') { hp = 300; atk = 40; }
    if (type === 'SIEGE') { hp = 900; atk = 60; }

    return {
      id: `minion_${team}_${lane}_${Date.now()}_${Math.random().toString(36).substr(2,4)}`,
      team, lane, type,
      x: pos.x + offsetX, y: pos.y + offsetY,
      hp: Math.floor(hp * scaling), 
      maxHp: Math.floor(hp * scaling), 
      atk: Math.floor(atk * scaling),
      pathIdx: 0
    };
  }

  private static processMinions(match: LiveMatch, settings: BattleSettings, dt: number) {
    match.minions = match.minions!.filter(m => m.hp > 0 && !isNaN(m.x) && !isNaN(m.y));

    const cachedEnemies: Record<string, Minion[]> = {};
    const lanes = ['TOP', 'MID', 'BOT'];
    ['BLUE', 'RED'].forEach(team => {
        lanes.forEach(lane => {
            const key = `${team}_${lane}`;
            cachedEnemies[key] = match.minions!.filter(m => m.team === team && m.lane === lane);
        });
    });

    match.minions!.forEach(m => {
        MinionLogic.processSingleMinion(m, match, settings, dt, cachedEnemies);
    });
  }
}
