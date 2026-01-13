// ==========================================
// FILE PATH: /src/engine/match/logics/StructureLogic.ts
// ==========================================
import { LivePlayer, Minion, LiveMatch } from '../../../types';
import { getDistance } from '../../data/MapData';
import { calcMitigatedDamage } from './CombatLogic';
import { FOUNTAIN_AREAS } from '../constants/MapConstants';

export class StructureLogic {
  
  // --- [1. 우물 레이저 (Spawn Laser)] ---
  // 적이 우물에 들어오면 초당 최대 체력의 20% 고정 피해 (무조건 죽음)
  static processFountainDefense(match: LiveMatch, dt: number) {
    const processTeam = (team: LivePlayer[], isEnemyBlue: boolean) => {
      const area = isEnemyBlue ? FOUNTAIN_AREAS.BLUE : FOUNTAIN_AREAS.RED;
      
      team.forEach(p => {
        if (p.currentHp <= 0) return;
        
        // 우물 구역 안에 있는지 체크
        const inFountain = 
          p.x >= area.x && p.x <= area.x + area.w &&
          p.y >= area.y && p.y <= area.y + area.h;

        if (inFountain) {
          // 절대 피해 (방어력 무시, 무적 무시)
          const trueDamage = p.maxHp * 0.2 * dt; 
          p.currentHp -= trueDamage;
          
          // 로그 남기기 (너무 자주는 말고)
          if (p.currentHp <= 0) {
            match.logs.push({
              time: Math.floor(match.currentDuration),
              message: `⚡ [우물 레이저]가 ${p.name}을 소멸시켰습니다.`,
              type: 'KILL',
              team: isEnemyBlue ? 'BLUE' : 'RED'
            });
          }
        }
      });
    };

    // 블루팀 우물 -> 레드팀 공격
    processTeam(match.redTeam, true);
    // 레드팀 우물 -> 블루팀 공격
    processTeam(match.blueTeam, false);
  }

  // --- [2. 타워 타겟팅] ---
  static selectTowerTarget(
    towerPos: { x: number, y: number },
    enemies: { heroes: LivePlayer[], minions: Minion[] },
    allies: LivePlayer[], 
    range: number,
    currentTime: number
  ): { unit: any, type: 'HERO' | 'MINION' } | null {
    
    // 1. 사거리 내 적 식별
    const nearbyMinions = enemies.minions.filter(m => m.hp > 0 && getDistance(m, towerPos) <= range);
    const nearbyEnemyHeroes = enemies.heroes.filter(h => h.currentHp > 0 && h.respawnTimer <= 0 && getDistance(h, towerPos) <= range);

    if (nearbyMinions.length === 0 && nearbyEnemyHeroes.length === 0) return null;

    // 2. [어그로 0순위] 아군 영웅을 공격한 적 영웅 (Call for Help)
    const AGGRO_DURATION = 2.0; 
    const aggroTarget = nearbyEnemyHeroes.find(enemy => {
        if (!enemy.lastAttackTime || !enemy.lastAttackedTargetId) return false;
        if (currentTime - enemy.lastAttackTime > AGGRO_DURATION) return false;
        
        // 적이 때린 대상이 아군인지 확인
        return allies.some(a => a.heroId === enemy.lastAttackedTargetId);
    });

    if (aggroTarget) return { unit: aggroTarget, type: 'HERO' };

    // 3. [일반 우선순위] 미니언 > 영웅 (거리순)
    if (nearbyMinions.length > 0) {
        nearbyMinions.sort((a, b) => getDistance(a, towerPos) - getDistance(b, towerPos));
        return { unit: nearbyMinions[0], type: 'MINION' };
    } 
    
    // 미니언이 없으면 영웅 공격
    nearbyEnemyHeroes.sort((a, b) => getDistance(a, towerPos) - getDistance(b, towerPos));
    return { unit: nearbyEnemyHeroes[0], type: 'HERO' };
  }

  // --- [3. 타워 데미지 적용] ---
  static applyTowerDamage(
    target: { unit: any, type: 'HERO' | 'MINION' },
    towerStats: any,
    dt: number,
    isNexus: boolean,
    hasMinionsNearby: boolean
  ) {
    // 넥서스/타워 기본 공격력 대폭 상향
    const baseAtk = towerStats.atk || (isNexus ? 1000 : 400); 
    let damage = baseAtk * dt;

    // [백도어 방지] 주변에 미니언 없이 영웅 혼자면 데미지 5배 (절대 못 버티게)
    if (target.type === 'HERO' && !hasMinionsNearby) {
        damage *= 5.0; 
    }

    // [영웅 대상 추가 피해] 체력 비례 데미지 추가 (탱커도 녹게 만듬)
    if (target.type === 'HERO') {
        const hpPercentDmg = target.unit.maxHp * 0.05 * dt; // 초당 5% 체력 비례
        damage += hpPercentDmg;
    }

    // 방어력 적용
    let armor = 0;
    if (target.type === 'HERO') {
        armor = (target.unit.level * 3) + 50; // 영웅 방어력 추정치
    }

    const realDamage = calcMitigatedDamage(damage, armor);

    if (target.type === 'HERO') {
        target.unit.currentHp -= realDamage;
    } else {
        target.unit.hp -= realDamage;
    }
  }
}
