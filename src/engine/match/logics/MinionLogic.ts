// ==========================================
// FILE PATH: /src/engine/match/logics/MinionLogic.ts
// ==========================================
import { LiveMatch, Minion, BattleSettings } from '../../../types';
import { BASES, WAYPOINTS, TOWER_COORDS } from '../constants/MapConstants';
import { Collision } from '../utils/Collision';

const MINION_SPEED = 15;

// 방어력 적용 데미지 공식 (100 / (100 + 방어력))
const calcMitigatedDamage = (rawDmg: number, armor: number) => {
  const reduction = 100 / (100 + armor);
  return rawDmg * reduction;
};

export class MinionLogic {

  static processSingleMinion(m: Minion, match: LiveMatch, settings: BattleSettings, dt: number, cachedEnemies: Record<string, Minion[]>) {
    // 거신병은 별도 로직이므로 패스
    if (m.type === 'SUMMONED_COLOSSUS') return;

    const isBlue = m.team === 'BLUE';
    const enemyTeam = isBlue ? 'RED' : 'BLUE';
    const enemyHeroes = isBlue ? match.redTeam : match.blueTeam;
    
    // 1. 타겟팅 (미니언 -> 영웅 -> 구조물 순)
    const laneEnemies = cachedEnemies[`${enemyTeam}_${m.lane}`] || [];
    const range = m.type === 'MELEE' ? 6 : 16;
    
    let target: any = Collision.findNearest(m, laneEnemies, range);
    let targetType = 'MINION';

    if (!target) {
      const aliveHeroes = enemyHeroes.filter(h => h.currentHp > 0);
      target = Collision.findNearest(m, aliveHeroes as any, range);
      if (target) targetType = 'HERO';
    }

    if (!target) {
      const structure = this.findEnemyStructure(m, match);
      if (structure) {
          target = structure;
          targetType = 'STRUCTURE';
      }
    }

    // 2. 행동 (공격 or 이동)
    if (target) {
        this.attackTarget(m, target, targetType, match, settings, dt, isBlue);
    } else {
        this.move(m, isBlue, dt);
    }
  }

  private static attackTarget(m: Minion, target: any, type: string, match: LiveMatch, settings: BattleSettings, dt: number, isBlue: boolean) {
    if (Math.random() > dt) return; 

    const s = settings.siege || { 
        minionDmg: 1.0, cannonDmg: 1.0, 
        dmgToHero: 1.0, dmgToT1: 0.3, dmgToT2: 0.25, dmgToT3: 0.2, dmgToNexus: 0.1 
    };

    // 1. 공격자 계수
    let sourceFactor = s.minionDmg ?? 1.0;
    if (m.type === 'SIEGE') sourceFactor = s.cannonDmg ?? 1.0;

    // 2. 대상 계수 및 방어력 정보 가져오기
    let targetFactor = 1.0; 
    let targetArmor = 0;

    // 안전하게 필드 설정 가져오기
    const fieldTowers = settings.fieldSettings?.towers || ({} as any);

    if (type === 'HERO') {
        targetFactor = s.dmgToHero ?? 1.0;
        // 영웅 방어력 (간단 계산)
        targetArmor = (target.level * 3) + 30; 
    }
    else if (type === 'STRUCTURE') {
        if (target.isNexus) {
            targetFactor = s.dmgToNexus ?? 0.1;
            targetArmor = fieldTowers.nexus?.armor || 200;
        } else {
            const laneKey = m.lane.toLowerCase();
            const enemyStats = isBlue ? match.stats.red : match.stats.blue;
            const tier = ((enemyStats.towers as any)[laneKey] || 0) + 1;
            
            if (tier === 1) {
                targetFactor = s.dmgToT1 ?? 0.3;
                targetArmor = fieldTowers.t1?.armor || 80;
            } else if (tier === 2) {
                targetFactor = s.dmgToT2 ?? 0.25;
                targetArmor = fieldTowers.t2?.armor || 120;
            } else {
                targetFactor = s.dmgToT3 ?? 0.2;
                targetArmor = fieldTowers.t3?.armor || 150;
            }
        }
    }

    // 3. 데미지 계산 (방어력 적용)
    const rawAtk = m.atk || 10;
    const mitigatedDmg = calcMitigatedDamage(rawAtk, targetArmor);
    const finalDmg = Math.max(1, mitigatedDmg * sourceFactor * targetFactor);

    // 4. 데미지 적용 (확률 아님. 진짜 체력 감소)
    if (type === 'MINION' || type === 'HERO') {
        target.hp -= finalDmg;
        if (target.currentHp !== undefined) target.currentHp -= finalDmg;
    } 
    else if (type === 'STRUCTURE') {
        const laneKey = m.lane.toLowerCase();
        const enemyStats = isBlue ? match.stats.red : match.stats.blue;

        if (target.isNexus) {
            enemyStats.nexusHp -= finalDmg;
        } else {
            // [수정완료] 확률 제거 -> 실제 체력(laneHealth) 깎기
            if (!(enemyStats as any).laneHealth) {
                (enemyStats as any).laneHealth = { top: 10000, mid: 10000, bot: 10000 };
            }

            (enemyStats as any).laneHealth[laneKey] -= finalDmg;

            // 체력이 0 이하가 되면 파괴
            if ((enemyStats as any).laneHealth[laneKey] <= 0) {
                (enemyStats.towers as any)[laneKey]++;
                match.logs.push({ 
                    time: Math.floor(match.currentDuration), 
                    message: `🔥 미니언 군단이 ${laneKey.toUpperCase()} 타워를 파괴했습니다!`, 
                    type: 'TOWER', team: isBlue ? 'BLUE' : 'RED' 
                });
                
                // 파괴 후 다음 타워 체력 세팅 (다음 타워 스펙으로 리셋)
                // 현재 티어가 1이면 다음은 2차 타워 체력으로 설정
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
    const dist = Math.sqrt(dx*dx + dy*dy);

    // [버그 수정] 거리 0일 때 증발 방지
    if (dist < 2.0 || dist < 0.001) {
      m.pathIdx = Math.min(m.pathIdx + 1, path.length - 1);
    } else {
      const speed = MINION_SPEED;
      m.x += (dx / dist) * speed * dt * 0.1;
      m.y += (dy / dist) * speed * dt * 0.1;
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
