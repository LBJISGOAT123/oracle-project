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
    if (m.type === 'SUMMONED_COLOSSUS') return; // 거신병은 별도 로직

    const isBlue = m.team === 'BLUE';
    
    // [1] 기존 타겟 검증 (매 프레임 수행 - 가벼움)
    let currentTarget = this.findExistingTarget(m, match);
    
    // 타겟이 죽었거나 사라졌으면 타겟 해제
    if (currentTarget && (currentTarget.hp <= 0 || (currentTarget.currentHp !== undefined && currentTarget.currentHp <= 0))) {
        m.targetId = undefined;
        currentTarget = null;
    }

    // [2] AI 판단 (shouldThink일 때만 무거운 탐색 수행)
    if (shouldThink) {
        // 타겟이 없거나, 타겟이 있어도 10% 확률로 더 좋은 타겟(영웅 등)을 찾음
        if (!currentTarget || Math.random() < 0.1) {
            const range = m.type === 'MELEE' ? 6 : 16;
            
            // 2-1. 구조물 (가장 우선)
            const structure = this.findEnemyStructure(m, match);
            if (structure && Collision.distSq(m, structure) <= (range+2)**2) {
                m.targetId = 'structure'; // 구조물은 ID가 없으므로 고정값
                currentTarget = structure;
            }
            // 2-2. 적 유닛 탐색 (SpatialGrid 활용)
            else {
                // 내 주변 그리드에서만 적을 가져옴 (전체 탐색 X)
                const nearbyMinions = enemyGrids.minions.getNearbyUnits(m);
                const nearbyHeroes = enemyGrids.heroes.getNearbyUnits(m);
                
                // 가까운 순서로 찾기
                const targetMinion = Collision.findNearest(m, nearbyMinions, range);
                const targetHero = Collision.findNearest(m, nearbyHeroes, range);

                // 영웅이 있으면 영웅 우선, 아니면 미니언
                if (targetHero) {
                    m.targetId = targetHero.heroId;
                    currentTarget = targetHero;
                } else if (targetMinion) {
                    m.targetId = targetMinion.id;
                    currentTarget = targetMinion;
                }
            }
        }
    }

    // [3] 행동 실행 (이동 or 공격)
    if (currentTarget) {
        // 구조물인지 확인
        const isStructure = currentTarget.isNexus || (currentTarget.heroId === undefined && currentTarget.id === undefined);
        const targetType = isStructure ? 'STRUCTURE' : (currentTarget.heroId ? 'HERO' : 'MINION');
        
        // 공격 실행
        this.attackTarget(m, currentTarget, targetType, match, settings, dt, isBlue, heroes);
    } else {
        // 타겟 없으면 웨이포인트 이동
        this.move(m, isBlue, dt);
    }
  }

  // 기존 타겟 객체 찾기 (ID 기반 빠른 조회)
  private static findExistingTarget(m: Minion, match: LiveMatch): any {
      if (!m.targetId) return null;
      if (m.targetId === 'structure') return this.findEnemyStructure(m, match);
      
      // 영웅 검색 (배열 순회지만 최대 5명이므로 빠름)
      const enemyHero = (m.team === 'BLUE' ? match.redTeam : match.blueTeam).find(h => h.heroId === m.targetId);
      if (enemyHero) return enemyHero; 

      // 미니언 검색 (전체 배열 뒤지는 건 느리지만, Find는 비교적 빠름. 
      // 더 최적화하려면 Map을 써야 하지만 복잡도 증가 우려로 유지)
      const enemyMinion = match.minions?.find(min => min.id === m.targetId);
      return enemyMinion || null;
  }

  private static attackTarget(
      m: Minion, target: any, type: string, match: LiveMatch, 
      settings: BattleSettings, dt: number, isBlue: boolean, heroes: Hero[]
  ) {
    // 사거리 체크 (타겟이 도망갔을 수 있음)
    const range = m.type === 'MELEE' ? 6 : 16;
    // distSq 사용
    if (Collision.distSq(m, target) > (range + 3) ** 2) {
        // 사거리 벗어나면 추격 (이동)
        this.moveToTarget(m, target, dt);
        return;
    }

    // 공격 쿨타임 (공속)
    if (Math.random() > dt * 1.0) return; 

    const s = settings.siege || { minionDmg: 1.0, cannonDmg: 1.0, dmgToHero: 1.0 };
    let damage = (m.atk || 10);

    // ... (데미지 계산 로직은 기존과 동일, 다만 최적화를 위해 불필요한 객체 생성 자제)
    if (type === 'STRUCTURE') {
        if (m.type === 'SIEGE') damage *= 2.5; else damage *= 0.6;
        
        const laneKey = m.lane.toLowerCase();
        const enemyStats = isBlue ? match.stats.red : match.stats.blue;
        const fieldTowers = settings.fieldSettings?.towers || ({} as any);
        const targetArmor = (target.isNexus ? fieldTowers.nexus?.armor : 50) || 50;
        const realDmg = calcMitigatedDamage(damage, targetArmor);

        if (target.isNexus) {
            enemyStats.nexusHp -= realDmg;
        } else {
            // 객체 접근 최적화
            const towers = enemyStats.towers as any;
            const laneHealth = (enemyStats as any).laneHealth;
            
            laneHealth[laneKey] -= realDmg;
            if (laneHealth[laneKey] <= 0) {
                towers[laneKey]++;
                const currentBroken = towers[laneKey];
                if (currentBroken < 3) {
                     const nextStats = (fieldTowers as any)[`t${currentBroken + 1}`];
                     laneHealth[laneKey] = nextStats?.hp || 15000;
                }
            }
        }
    } 
    else {
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

  // 타겟 추격 이동
  private static moveToTarget(me: Minion, target: {x:number, y:number}, dt: number) {
    const dx = target.x - me.x;
    const dy = target.y - me.y;
    const distSq = dx*dx + dy*dy;
    
    if (distSq > 0.1) {
        const dist = Math.sqrt(distSq);
        me.x += (dx / dist) * MINION_SPEED * dt * 0.1;
        me.y += (dy / dist) * MINION_SPEED * dt * 0.1;
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

    // 거리 제곱 비교 (4.0 -> 2의 제곱)
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

    // 타워 근처 225(15^2) 거리 이내면 타워 인식
    const dx = m.x - targetPos.x;
    const dy = m.y - targetPos.y;
    if ((dx*dx + dy*dy) < 225) return { ...targetPos, isNexus };
    
    return null;
  }
}
