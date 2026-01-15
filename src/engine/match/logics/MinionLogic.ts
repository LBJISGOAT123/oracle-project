// ==========================================
// FILE PATH: /src/engine/match/logics/MinionLogic.ts
// ==========================================
import { LiveMatch, Minion, BattleSettings, Hero } from '../../../types';
import { WAYPOINTS, TOWER_COORDS } from '../constants/MapConstants';
import { Collision } from '../utils/Collision';
import { SpatialGrid } from '../utils/SpatialGrid';
import { distributeRewards, calcMitigatedDamage, MINION_REWARD } from './CombatLogic'; 

const MINION_SPEED = 15;

export class MinionLogic {

  static processSingleMinion(
      m: Minion, match: LiveMatch, settings: BattleSettings, dt: number, 
      enemyGrids: { minions: SpatialGrid, heroes: SpatialGrid },
      shouldThink: boolean, heroes: Hero[] 
  ) {
    if (m.type === 'SUMMONED_COLOSSUS') return;

    const isBlue = m.team === 'BLUE';
    const range = m.type === 'MELEE' ? 6 : 16;
    
    let targetType = 'MINION';
    let target: any = null;
    
    // 1. 구조물 우선 확인 (가까우면 침)
    const structure = this.findEnemyStructure(m, match);
    if (structure) {
        const dist = Math.sqrt(Math.pow(structure.x - m.x, 2) + Math.pow(structure.y - m.y, 2));
        if (dist <= range + 2) {
            target = structure;
            targetType = 'STRUCTURE';
        }
    }

    // 2. 미니언
    if (!target) {
        const nearbyEnemyMinions = enemyGrids.minions.getNearbyUnits(m);
        target = Collision.findNearest(m, nearbyEnemyMinions, range);
        targetType = 'MINION';
    }

    // 3. 영웅
    if (!target) {
        const nearbyEnemyHeroes = enemyGrids.heroes.getNearbyUnits(m);
        target = Collision.findNearest(m, nearbyEnemyHeroes, range);
        if (target) targetType = 'HERO';
    }

    if (target) {
        m.targetId = target.id || target.heroId || 'structure';
        this.attackTarget(m, target, targetType, match, settings, dt, isBlue, heroes);
    } else {
        m.targetId = undefined;
        this.move(m, isBlue, dt);
    }
  }

  private static attackTarget(
      m: Minion, target: any, type: string, match: LiveMatch, 
      settings: BattleSettings, dt: number, isBlue: boolean, heroes: Hero[]
  ) {
    if (type !== 'STRUCTURE' && (!target || target.hp <= 0 || target.currentHp <= 0)) {
        m.targetId = undefined;
        return;
    }

    // 공격 속도: 1초에 1대 정도 때린다고 가정
    if (Math.random() > dt * 1.0) return; 

    const s = settings.siege || { minionDmg: 1.0, cannonDmg: 1.0, dmgToHero: 1.0 };
    let damage = (m.atk || 10);

    if (type === 'STRUCTURE') {
        // [자연스러운 상성]
        // 대포 미니언: 구조물에 2.5배 (공성용)
        // 일반 미니언: 구조물에 0.6배 (철거 느림)
        if (m.type === 'SIEGE') damage *= 2.5;
        else damage *= 0.6;

        const laneKey = m.lane.toLowerCase();
        const enemyStats = isBlue ? match.stats.red : match.stats.blue;
        
        const fieldTowers = settings.fieldSettings?.towers || ({} as any);
        const targetArmor = (target.isNexus ? fieldTowers.nexus?.armor : 50) || 50;
        
        // 미니언은 관통력이 없으므로 방어력에 정직하게 막힘
        const realDmg = calcMitigatedDamage(damage, targetArmor);

        if (target.isNexus) {
            enemyStats.nexusHp -= realDmg;
        } else {
            if (!(enemyStats as any).laneHealth) (enemyStats as any).laneHealth = { top: 10000, mid: 10000, bot: 10000 };
            (enemyStats as any).laneHealth[laneKey] -= realDmg;

            if ((enemyStats as any).laneHealth[laneKey] <= 0) {
                (enemyStats.towers as any)[laneKey]++;
                match.logs.push({ 
                    time: Math.floor(match.currentDuration), 
                    message: `🔥 미니언이 ${laneKey.toUpperCase()} 타워 파괴!`, 
                    type: 'TOWER', team: isBlue ? 'BLUE' : 'RED' 
                });
                const currentBroken = (enemyStats.towers as any)[laneKey];
                if (currentBroken < 3) {
                     const nextTierStats = (fieldTowers as any)[`t${currentBroken + 1}`];
                     (enemyStats as any).laneHealth[laneKey] = nextTierStats?.hp || 15000;
                }
            }
        }
    } 
    else {
        // 유닛 공격
        let armor = target.armor || 0;
        if (type === 'HERO') armor = (target.level * 3) + 30;
        const realDmg = calcMitigatedDamage(damage, armor);
        
        if (type === 'HERO') target.currentHp -= realDmg;
        else target.hp -= realDmg;

        if (type === 'MINION' && target.hp <= 0) {
            const reward = (MINION_REWARD as any)[target.type] || MINION_REWARD.MELEE;
            distributeRewards(match, target, null, isBlue ? 'BLUE' : 'RED', reward, heroes);
        }
    }
  }

  private static move(m: Minion, isBlue: boolean, dt: number) {
    const waypoints = WAYPOINTS[m.lane];
    if (!waypoints) return; 

    const path = isBlue ? waypoints : [...waypoints].reverse();
    const targetPos = path[m.pathIdx];

    if (!targetPos) return;

    const dx = targetPos.x - m.x;
    const dy = targetPos.y - m.y;
    const distSq = dx*dx + dy*dy;

    if (distSq < 4.0) { 
      m.pathIdx = Math.min(m.pathIdx + 1, path.length - 1);
    } else {
      const dist = Math.sqrt(distSq);
      m.x += (dx / dist) * MINION_SPEED * dt * 0.1;
      m.y += (dy / dist) * MINION_SPEED * dt * 0.1;
    }
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
    if ((dx*dx + dy*dy) < 225) return { ...targetPos, isNexus };
    
    return null;
  }
}
