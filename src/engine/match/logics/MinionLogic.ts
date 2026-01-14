// ==========================================
// FILE PATH: /src/engine/match/logics/MinionLogic.ts
// ==========================================
import { LiveMatch, Minion, BattleSettings, Hero } from '../../../types';
import { WAYPOINTS, TOWER_COORDS } from '../constants/MapConstants';
import { Collision } from '../utils/Collision';
import { SpatialGrid } from '../utils/SpatialGrid';
import { 
    distributeRewards, 
    calcMitigatedDamage, 
    MINION_REWARD 
} from './CombatLogic'; 

const MINION_SPEED = 15;

export class MinionLogic {

  static processSingleMinion(
      m: Minion, 
      match: LiveMatch, 
      settings: BattleSettings, 
      dt: number, 
      enemyGrids: { minions: SpatialGrid, heroes: SpatialGrid },
      shouldThink: boolean,
      heroes: Hero[] 
  ) {
    if (m.type === 'SUMMONED_COLOSSUS') return;

    // 타겟이 있으면 이동 멈춤 (Sticky Target)
    if (m.targetId) {
       // 타겟 유효성 검사는 attackTarget 내부에서 수행
    }

    const isBlue = m.team === 'BLUE';
    const range = m.type === 'MELEE' ? 6 : 16;
    
    // [최적화] 그리드를 통해 내 주변 적만 가져옴
    // 1. 미니언 타겟팅
    const nearbyEnemyMinions = enemyGrids.minions.getNearbyUnits(m);
    let target: any = Collision.findNearest(m, nearbyEnemyMinions, range);
    let targetType = 'MINION';

    // 2. 영웅 타겟팅
    if (!target) {
      const nearbyEnemyHeroes = enemyGrids.heroes.getNearbyUnits(m);
      target = Collision.findNearest(m, nearbyEnemyHeroes, range);
      if (target) targetType = 'HERO';
    }

    // 3. 구조물 타겟팅 (구조물은 몇 개 없으므로 그리드 불필요)
    if (!target) {
      const structure = this.findEnemyStructure(m, match);
      if (structure) {
          target = structure;
          targetType = 'STRUCTURE';
      }
    }

    if (target) {
        m.targetId = target.id || target.heroId || 'structure'; // 타겟 기억
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
    // 타겟이 죽었거나 멀어졌으면 공격 취소
    if ((target.hp !== undefined && target.hp <= 0) || 
        (target.currentHp !== undefined && target.currentHp <= 0) ||
        !Collision.inRange(m, target, (m.type === 'MELEE' ? 6 : 16) + 2)) {
        m.targetId = undefined;
        return;
    }

    // 공격 속도 시뮬레이션 (dt 기반 확률 체크)
    if (Math.random() > dt * 1.5) return; 

    const s = settings.siege || { minionDmg: 1.0, cannonDmg: 1.0, dmgToHero: 1.0, dmgToT1: 0.3, dmgToT2: 0.25, dmgToT3: 0.2, dmgToNexus: 0.1 };

    let sourceFactor = s.minionDmg ?? 1.0;
    if (m.type === 'SIEGE') sourceFactor = s.cannonDmg ?? 1.0;

    let targetFactor = 1.0; 
    let targetArmor = 0;
    const fieldTowers = settings.fieldSettings?.towers || ({} as any);

    if (type === 'HERO') {
        targetFactor = s.dmgToHero ?? 1.0;
        targetArmor = (target.level * 3) + 30; 
    }
    else if (type === 'STRUCTURE') {
        if (target.isNexus) {
            targetFactor = s.dmgToNexus ?? 0.1;
            targetArmor = fieldTowers.nexus?.armor || 60; // 200 -> 60 반영
        } else {
            const laneKey = m.lane.toLowerCase();
            const enemyStats = isBlue ? match.stats.red : match.stats.blue;
            const tier = ((enemyStats.towers as any)[laneKey] || 0) + 1;
            
            if (tier === 1) { targetFactor = s.dmgToT1 ?? 0.3; targetArmor = fieldTowers.t1?.armor || 40; }
            else if (tier === 2) { targetFactor = s.dmgToT2 ?? 0.25; targetArmor = fieldTowers.t2?.armor || 60; }
            else { targetFactor = s.dmgToT3 ?? 0.2; targetArmor = fieldTowers.t3?.armor || 75; }
        }
    }

    if (type === 'MINION') {
        // [핵심 수정] 타겟이 거신병(SUMMONED_COLOSSUS)이면 데미지 대폭 감소
        if (target.type === 'SUMMONED_COLOSSUS') {
            sourceFactor *= 0.05; // 데미지 95% 감소 (거신병 보호)
        } else {
            sourceFactor *= 0.3; // 일반 미니언끼리는 30% 데미지
        }
    }

    const rawAtk = m.atk || 10;
    const mitigatedDmg = calcMitigatedDamage(rawAtk, targetArmor);
    
    // 최종 데미지 (기본 3배 보정 포함)
    const finalDmg = Math.max(1, mitigatedDmg * sourceFactor * targetFactor * 3.0);

    if (type === 'MINION' || type === 'HERO') {
        target.hp -= finalDmg;
        if (target.currentHp !== undefined) target.currentHp -= finalDmg;

        if (type === 'MINION' && target.hp <= 0) {
            const reward = (MINION_REWARD as any)[target.type] || MINION_REWARD.MELEE;
            distributeRewards(match, target, null, isBlue ? 'BLUE' : 'RED', reward, heroes);
        }
    } 
    else if (type === 'STRUCTURE') {
        const laneKey = m.lane.toLowerCase();
        const enemyStats = isBlue ? match.stats.red : match.stats.blue;

        if (target.isNexus) {
            enemyStats.nexusHp -= finalDmg;
        } else {
            if (!(enemyStats as any).laneHealth) {
                (enemyStats as any).laneHealth = { top: 10000, mid: 10000, bot: 10000 };
            }
            (enemyStats as any).laneHealth[laneKey] -= finalDmg;

            if ((enemyStats as any).laneHealth[laneKey] <= 0) {
                (enemyStats.towers as any)[laneKey]++;
                match.logs.push({ 
                    time: Math.floor(match.currentDuration), 
                    message: `🔥 미니언 군단이 ${laneKey.toUpperCase()} 타워를 파괴했습니다!`, 
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

    if (distSq < 4.0 || distSq < 0.00001) { 
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
    const distSq = dx*dx + dy*dy;
    
    if (distSq < 100) return { ...targetPos, isNexus };
    return null;
  }
}
