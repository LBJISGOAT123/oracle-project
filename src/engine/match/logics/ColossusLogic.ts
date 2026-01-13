// ==========================================
// FILE PATH: /src/engine/match/logics/ColossusLogic.ts
// ==========================================
import { LiveMatch, Minion, BattleSettings } from '../../../types';
import { BASES, WAYPOINTS, TOWER_COORDS } from '../constants/MapConstants';
import { Collision } from '../utils/Collision';

// 방어력 적용 데미지 공식
const calcMitigatedDamage = (rawDmg: number, armor: number) => {
  const reduction = 100 / (100 + armor);
  return rawDmg * reduction;
};

export class ColossusLogic {
  
  static update(colossus: Minion, match: LiveMatch, settings: BattleSettings, dt: number) {
    const isBlue = colossus.team === 'BLUE';
    
    // 1. 최우선 목표: 미드 라인의 다음 구조물
    const structureTarget = this.findNextStructure(colossus, match);
    
    let distToStructure = 999;
    if (structureTarget) {
        const dx = structureTarget.x - colossus.x;
        const dy = structureTarget.y - colossus.y;
        distToStructure = Math.sqrt(dx*dx + dy*dy);
    }

    // 공격 사거리 (거신병은 덩치가 크니까 12)
    const ATTACK_RANGE = 12;

    // 2. 행동 결정
    if (structureTarget && distToStructure <= ATTACK_RANGE) {
        // [공성] 사거리 안이면 공격
        this.processAttack(colossus, structureTarget, 'STRUCTURE', match, settings, dt, isBlue);
    } 
    else {
        // [진격] 사거리 밖이면 이동
        // 길을 막는 적이 있는지 확인
        const nearbyEnemy = this.findBlockingEnemy(colossus, match);
        
        if (nearbyEnemy) {
            // 길 막는 적 처리
            this.processAttack(colossus, nearbyEnemy, nearbyEnemy.heroId ? 'HERO' : 'MINION', match, settings, dt, isBlue);
        } else {
            // 구조물이 가까우면(30이내) 웨이포인트 무시하고 구조물로 직진
            if (structureTarget && distToStructure < 30) {
                this.moveToTarget(colossus, structureTarget, dt);
            } else {
                // 멀면 웨이포인트 따라 이동
                this.processWaypointMovement(colossus, isBlue, dt);
            }
        }
    }
  }

  // 공격 실행
  private static processAttack(
    me: Minion, 
    target: any, 
    type: string, 
    match: LiveMatch, 
    settings: BattleSettings, 
    dt: number,
    isBlue: boolean
  ) {
    // 거신병 공속 (약간 느림)
    if (Math.random() > dt * 1.5) return; 

    // 설정값 로드
    const s = settings.siege || { 
        superDmg: 1.0, colossusToHero: 1.0, colossusToT1: 0.4 
    };
    const fieldTowers = settings.fieldSettings?.towers || ({} as any);
    
    let dmgFactor = 1.0;
    let targetArmor = 50; // 기본 방어력

    if (type === 'STRUCTURE') {
        if (target.isNexus) {
            dmgFactor = s.colossusToNexus ?? 0.05; // 넥서스 데미지 계수
            targetArmor = fieldTowers.nexus?.armor || 200;
        } else {
            const laneKey = me.lane.toLowerCase();
            const enemyStats = isBlue ? match.stats.red : match.stats.blue;
            const tier = ((enemyStats.towers as any)[laneKey] || 0) + 1;
            
            if (tier === 1) { 
                dmgFactor = s.colossusToT1 ?? 0.4; 
                targetArmor = fieldTowers.t1?.armor || 80; 
            }
            else if (tier === 2) { 
                dmgFactor = s.colossusToT2 ?? 0.2; 
                targetArmor = fieldTowers.t2?.armor || 120; 
            }
            else { 
                dmgFactor = s.colossusToT3 ?? 0.1; 
                targetArmor = fieldTowers.t3?.armor || 150; 
            }
        }
    } else if (type === 'HERO') {
        dmgFactor = s.colossusToHero ?? 0.3;
        targetArmor = (target.level * 3) + 40;
    }

    // 최종 데미지 계산
    const baseMult = s.superDmg ?? 1.0;
    const rawDmg = me.atk * baseMult * dmgFactor;
    const finalDmg = Math.max(1, calcMitigatedDamage(rawDmg, targetArmor));

    // 데미지 적용
    if (type === 'STRUCTURE') {
        const enemyStats = isBlue ? match.stats.red : match.stats.blue;
        if (target.isNexus) {
            enemyStats.nexusHp -= finalDmg;
        } else {
            const laneKey = me.lane.toLowerCase();
            // 체력 데이터 안전 초기화
            if (!(enemyStats as any).laneHealth) {
                 (enemyStats as any).laneHealth = { top: 10000, mid: 10000, bot: 10000 };
            }
            
            // [수정완료] 확률 제거 -> 실제 체력 깎기
            (enemyStats as any).laneHealth[laneKey] -= finalDmg;

            if ((enemyStats as any).laneHealth[laneKey] <= 0) {
                (enemyStats.towers as any)[laneKey]++;
                match.logs.push({ 
                    time: Math.floor(match.currentDuration), 
                    message: `🤖 거신병이 ${laneKey.toUpperCase()} 타워를 파괴했습니다!`, 
                    type: 'TOWER', team: isBlue ? 'BLUE' : 'RED' 
                });
                // 다음 타워 체력 리셋 (임시)
                (enemyStats as any).laneHealth[laneKey] = 15000;
            }
        }
    } else {
        target.hp -= finalDmg;
        if (target.currentHp !== undefined) target.currentHp -= finalDmg;
    }
  }

  // 직진 이동
  private static moveToTarget(me: Minion, target: {x:number, y:number}, dt: number) {
    const dx = target.x - me.x;
    const dy = target.y - me.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    const speed = 10;

    if (dist > 0.1) {
        me.x += (dx / dist) * speed * dt * 0.1;
        me.y += (dy / dist) * speed * dt * 0.1;
    }
  }

  // 웨이포인트 이동
  private static processWaypointMovement(me: Minion, isBlue: boolean, dt: number) {
    const waypoints = WAYPOINTS['MID'];
    if (!waypoints) return;

    const path = isBlue ? waypoints : [...waypoints].reverse();
    let targetPos = path[me.pathIdx];
    
    if (!targetPos) targetPos = isBlue ? BASES.RED : BASES.BLUE;

    const dx = targetPos.x - me.x;
    const dy = targetPos.y - me.y;
    const dist = Math.sqrt(dx*dx + dy*dy);

    if (dist < 3) {
        if (me.pathIdx < path.length - 1) {
            me.pathIdx++;
        }
    } else {
        const speed = 10;
        me.x += (dx / dist) * speed * dt * 0.1;
        me.y += (dy / dist) * speed * dt * 0.1;
    }
  }

  private static findNextStructure(me: Minion, match: LiveMatch) {
    const isBlue = me.team === 'BLUE';
    const enemyStats = isBlue ? match.stats.red : match.stats.blue;
    const brokenCount = enemyStats.towers.mid; // 미드만 봄

    let targetPos = null;
    let isNexus = false;

    if (brokenCount < 3) {
        const tier = brokenCount + 1;
        const coords = isBlue ? TOWER_COORDS.RED : TOWER_COORDS.BLUE;
        targetPos = coords.MID[tier - 1];
    } else {
        const coords = isBlue ? TOWER_COORDS.RED : TOWER_COORDS.BLUE;
        targetPos = coords.NEXUS;
        isNexus = true;
    }

    if (!targetPos) return null;
    return { ...targetPos, isNexus };
  }

  private static findBlockingEnemy(me: Minion, match: LiveMatch) {
    const isBlue = me.team === 'BLUE';
    const enemyTeam = isBlue ? 'RED' : 'BLUE';
    const enemyHeroes = isBlue ? match.redTeam : match.blueTeam;
    
    // 코앞의 적 영웅 (거리 8)
    const closeHero = enemyHeroes.find(h => h.currentHp > 0 && Collision.inRange(me, h, 8));
    if (closeHero) return closeHero;

    // 코앞의 적 미니언 (거리 8)
    if (match.minions) {
        const closeMinion = match.minions.find(m => m.team === enemyTeam && m.hp > 0 && Collision.inRange(me, m, 8));
        if (closeMinion) return closeMinion;
    }
    
    return null;
  }
}
