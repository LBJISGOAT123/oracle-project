// ==========================================
// FILE PATH: /src/engine/match/logics/TowerLogic.ts
// ==========================================
import { LivePlayer, Minion } from '../../../types';
import { getDistance } from '../../data/MapData';
import { calcMitigatedDamage } from './CombatLogic';

export class TowerLogic {
  /**
   * 타워의 공격 대상을 선정합니다.
   * 우선순위:
   * 1. [도움 요청] 아군 영웅을 공격한 적 영웅
   * 2. [일반] 가장 가까운 미니언
   * 3. [일반] 가장 가까운 영웅
   */
  static selectTarget(
    towerPos: { x: number, y: number },
    enemies: { heroes: LivePlayer[], minions: Minion[] },
    allies: LivePlayer[], // 보호해야 할 아군 영웅들
    range: number,
    currentTime: number
  ): { unit: any, type: 'HERO' | 'MINION' } | null {
    
    // 1. 사거리 내 적 식별
    const nearbyMinions = enemies.minions.filter(m => 
        m.hp > 0 && getDistance(m, towerPos) <= range
    );
    const nearbyEnemyHeroes = enemies.heroes.filter(h => 
        h.currentHp > 0 && h.respawnTimer <= 0 && getDistance(h, towerPos) <= range
    );

    if (nearbyMinions.length === 0 && nearbyEnemyHeroes.length === 0) return null;

    // 2. [어그로 0순위] 아군 영웅을 공격한 적 영웅 식별 (Call for Help)
    const AGGRO_DURATION = 2.0; // 최근 2초 내 공격
    
    const aggroTarget = nearbyEnemyHeroes.find(enemy => {
        if (!enemy.lastAttackTime || !enemy.lastAttackedTargetId) return false;
        
        const timeSinceAttack = currentTime - enemy.lastAttackTime;
        if (timeSinceAttack > AGGRO_DURATION) return false;

        // 적이 때린 대상이 '내 사거리 안' 혹은 '근처'에 있는 아군인지 확인
        // (단순화: 맵 전체 아군 중 ID 매칭)
        const victim = allies.find(a => a.heroId === enemy.lastAttackedTargetId);
        return !!victim;
    });

    if (aggroTarget) {
        return { unit: aggroTarget, type: 'HERO' };
    }

    // 3. [일반 우선순위] 미니언 > 영웅 (거리순)
    if (nearbyMinions.length > 0) {
        nearbyMinions.sort((a, b) => getDistance(a, towerPos) - getDistance(b, towerPos));
        return { unit: nearbyMinions[0], type: 'MINION' };
    } 
    else {
        nearbyEnemyHeroes.sort((a, b) => getDistance(a, towerPos) - getDistance(b, towerPos));
        return { unit: nearbyEnemyHeroes[0], type: 'HERO' };
    }
  }

  /**
   * 타워 데미지를 계산하고 적용합니다.
   */
  static applyDamage(
    target: { unit: any, type: 'HERO' | 'MINION' },
    towerStats: any,
    dt: number,
    isNexus: boolean,
    hasMinionsNearby: boolean // 백도어 방지용
  ) {
    const atk = towerStats.atk || (isNexus ? 500 : 250);
    // 초당 데미지 (Simulation Step 보정)
    let damage = atk * dt;

    // [백도어 방지] 미니언 없이 영웅만 있으면 데미지 3배
    if (target.type === 'HERO' && !hasMinionsNearby) {
        damage *= 3.0;
    }

    // 방어력 적용
    let armor = 0;
    if (target.type === 'HERO') {
        // 영웅은 레벨 비례 방어력 (아이템은 복잡해서 약식 적용)
        armor = (target.unit.level * 3) + 30;
    } else {
        // 미니언은 기본 방어력이 낮음
        armor = 0; 
    }

    const realDamage = calcMitigatedDamage(damage, armor);

    // 체력 차감
    if (target.type === 'HERO') {
        target.unit.currentHp -= realDamage;
    } else {
        target.unit.hp -= realDamage;
    }
  }
}
