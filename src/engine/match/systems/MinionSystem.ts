// ==========================================
// FILE PATH: /src/engine/match/systems/MinionSystem.ts
// ==========================================
import { LiveMatch, Minion } from '../../../types';
import { BASES, WAYPOINTS, TOWER_COORDS } from '../constants/MapConstants';
import { Collision } from '../utils/Collision';

const WAVE_INTERVAL = 30;
const MINION_SPEED = 15; 
const MAX_MINIONS_PER_MATCH = 100; // [최적화] 미니언 최대 마리수 제한

export class MinionSystem {
  static update(match: LiveMatch, dt: number) {
    if (!match.minions) match.minions = [];

    // 1. 웨이브 생성
    const currentWaveCycle = Math.floor(match.currentDuration / WAVE_INTERVAL);
    const prevWaveCycle = Math.floor((match.currentDuration - dt) / WAVE_INTERVAL);

    if (currentWaveCycle > prevWaveCycle) {
      this.spawnWave(match, 'BLUE');
      this.spawnWave(match, 'RED');
    }

    // 2. 행동 처리
    this.processMinions(match, dt);
  }

  private static spawnWave(match: LiveMatch, team: 'BLUE' | 'RED') {
    // [최적화] 이미 미니언이 너무 많으면 생성 스킵 (렉 방지)
    if (match.minions!.length > MAX_MINIONS_PER_MATCH) return;

    const lanes = ['TOP', 'MID', 'BOT'] as const;
    const startPos = team === 'BLUE' ? BASES.BLUE : BASES.RED;
    
    // 후반부(20분~)엔 미니언이 더 세짐 (게임 빨리 끝내기 위함)
    const timeScaling = 1 + (match.currentDuration / 1200); 

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

  private static processMinions(match: LiveMatch, dt: number) {
    // 죽은 미니언 정리
    match.minions = match.minions!.filter(m => m.hp > 0);

    // [최적화] 전체 리스트를 매번 순회하지 않고, 팀/라인별로 캐싱
    // 이렇게 하면 N*N 연산이 (N/6)*(N/6)으로 줄어들어 속도가 36배 빨라짐
    const cachedEnemies: Record<string, Minion[]> = {};
    const lanes = ['TOP', 'MID', 'BOT'];
    
    ['BLUE', 'RED'].forEach(team => {
        lanes.forEach(lane => {
            const key = `${team}_${lane}`;
            cachedEnemies[key] = match.minions!.filter(m => m.team === team && m.lane === lane);
        });
    });

    match.minions!.forEach(m => {
      const isBlue = m.team === 'BLUE';
      const enemyTeam = isBlue ? 'RED' : 'BLUE';
      const enemyHeroes = isBlue ? match.redTeam : match.blueTeam;
      
      // [최적화] 내 라인의 적 미니언만 가져옴
      const laneEnemies = cachedEnemies[`${enemyTeam}_${m.lane}`] || [];
      const range = m.type === 'SUMMONED_COLOSSUS' ? 20 : (m.type === 'MELEE' ? 6 : 16);
      
      // 1. 적 미니언 타겟팅
      let target: any = Collision.findNearest(m, laneEnemies, range);
      let targetType = 'UNIT';

      // 2. 적 영웅 타겟팅 (미니언 없으면)
      if (!target) {
        const aliveHeroes = enemyHeroes.filter(h => h.currentHp > 0);
        target = Collision.findNearest(m, aliveHeroes as any, range);
      }

      // 3. 적 구조물 타겟팅
      if (!target) {
        const structure = this.findEnemyStructure(m, match);
        if (structure) {
            target = structure;
            targetType = 'STRUCTURE';
        }
      }

      // 공격 또는 이동
      if (target) {
        if (Math.random() < dt) { 
            if (targetType === 'UNIT') {
                target.hp -= m.atk;
                if (target.currentHp !== undefined) target.currentHp -= m.atk;
            } else if (targetType === 'STRUCTURE') {
                const laneKey = m.lane.toLowerCase();
                const enemyStats = isBlue ? match.stats.red : match.stats.blue;
                if (target.isNexus) {
                    enemyStats.nexusHp -= m.atk;
                } else {
                    const siegeDmg = m.type === 'SIEGE' || m.type === 'SUMMONED_COLOSSUS' ? 0.05 : 0.005;
                    if (Math.random() < siegeDmg * dt) {
                        (enemyStats.towers as any)[laneKey]++;
                        // 로그 폭주 방지를 위해 미니언 타워 파괴 로그는 제거하거나 간소화
                    }
                }
            }
        }
      } else {
        const speed = m.type === 'SUMMONED_COLOSSUS' ? MINION_SPEED * 0.8 : MINION_SPEED;
        this.moveMinion(m, isBlue, dt, speed);
      }
    });
  }

  private static findEnemyStructure(m: Minion, match: LiveMatch) {
    if (m.lane === 'JUNGLE') return null; 

    const isBlue = m.team === 'BLUE';
    const enemyStats = isBlue ? match.stats.red : match.stats.blue;
    const laneKey = m.lane.toLowerCase();
    
    const brokenCount = (enemyStats.towers as any)[laneKey];
    
    let targetPos = null;
    let isNexus = false;

    if (brokenCount < 3) {
        const tier = brokenCount + 1;
        const coords = isBlue ? TOWER_COORDS.RED : TOWER_COORDS.BLUE;
        // @ts-ignore
        targetPos = coords[m.lane][tier - 1];
    } else {
        const coords = isBlue ? TOWER_COORDS.RED : TOWER_COORDS.BLUE;
        targetPos = coords.NEXUS;
        isNexus = true;
    }

    if (!targetPos) return null;

    const dx = m.x - targetPos.x;
    const dy = m.y - targetPos.y;
    const distSq = dx*dx + dy*dy;
    
    if (distSq < 100) { 
        return { ...targetPos, isNexus };
    }

    return null;
  }

  private static moveMinion(m: Minion, isBlue: boolean, dt: number, speed: number) {
    const waypoints = WAYPOINTS[m.lane];
    if (!waypoints) return; 

    const path = isBlue ? waypoints : [...waypoints].reverse();
    const targetPos = path[m.pathIdx];

    if (!targetPos) return;

    const dx = targetPos.x - m.x;
    const dy = targetPos.y - m.y;
    const dist = Math.sqrt(dx*dx + dy*dy);

    if (dist < 2) {
      m.pathIdx = Math.min(m.pathIdx + 1, path.length - 1);
    } else {
      m.x += (dx / dist) * speed * dt * 0.1;
      m.y += (dy / dist) * speed * dt * 0.1;
    }
  }
}
