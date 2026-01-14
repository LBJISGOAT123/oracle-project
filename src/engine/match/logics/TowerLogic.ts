// ==========================================
// FILE PATH: /src/engine/match/logics/TowerLogic.ts
// ==========================================
import { LivePlayer, Minion, LiveMatch } from '../../../types';
import { getDistance } from '../../data/MapData';
import { calcMitigatedDamage } from './CombatLogic';

export class TowerLogic {
  /**
   * 타워의 공격 대상을 선정합니다.
   */
  static selectTarget(
    towerPos: { x: number, y: number },
    enemies: { heroes: LivePlayer[], minions: Minion[] },
    allies: LivePlayer[], 
    range: number,
    currentTime: number
  ): { unit: any, type: 'HERO' | 'MINION' } | null {
    
    // 1. 사거리 내 적 찾기 (영웅, 미니언)
    const nearbyMinions = enemies.minions.filter(m => 
        m.hp > 0 && getDistance(m, towerPos) <= range
    );
    const nearbyEnemyHeroes = enemies.heroes.filter(h => 
        h.currentHp > 0 && h.respawnTimer <= 0 && getDistance(h, towerPos) <= range
    );

    if (nearbyMinions.length === 0 && nearbyEnemyHeroes.length === 0) return null;

    // 2. [1순위] 아군 영웅을 공격한 적 영웅 (어그로)
    const AGGRO_DURATION = 2.0; 
    const aggroTarget = nearbyEnemyHeroes.find(enemy => {
        if (!enemy.lastAttackTime || !enemy.lastAttackedTargetId) return false;
        const timeSinceAttack = currentTime - enemy.lastAttackTime;
        if (timeSinceAttack > AGGRO_DURATION) return false;
        // 적이 때린 대상이 아군 영웅인지 확인
        const victim = allies.find(a => a.heroId === enemy.lastAttackedTargetId);
        return !!victim;
    });

    if (aggroTarget) return { unit: aggroTarget, type: 'HERO' };

    // 3. [2순위] 거신병 (탱킹)
    const colossus = nearbyMinions.find(m => m.type === 'SUMMONED_COLOSSUS');
    if (colossus) return { unit: colossus, type: 'MINION' };

    // 4. [3순위] 일반 미니언 (가까운 순)
    if (nearbyMinions.length > 0) {
        nearbyMinions.sort((a, b) => getDistance(a, towerPos) - getDistance(b, towerPos));
        return { unit: nearbyMinions[0], type: 'MINION' };
    } 
    
    // 5. [4순위] 적 영웅 (미니언 없으면 영웅 공격)
    nearbyEnemyHeroes.sort((a, b) => getDistance(a, towerPos) - getDistance(b, towerPos));
    return { unit: nearbyEnemyHeroes[0], type: 'HERO' };
  }

  /**
   * 타워 데미지 적용 및 [즉시 사망 처리]
   */
  static applyDamage(
    match: LiveMatch, // match 객체 추가 (사망 처리를 위해)
    target: { unit: any, type: 'HERO' | 'MINION' },
    towerStats: any,
    dt: number,
    isNexus: boolean,
    hasMinionsNearby: boolean,
    defendingTeamColor: 'BLUE' | 'RED'
  ) {
    const atk = towerStats.atk || (isNexus ? 1000 : 400);
    let damage = atk * dt;

    // [백도어 방지] 미니언 없이 영웅만 있으면 데미지 3배
    if (target.type === 'HERO' && !hasMinionsNearby) {
        damage *= 3.0;
    }

    // 거신병 데미지 감소
    if (target.type === 'MINION' && target.unit.type === 'SUMMONED_COLOSSUS') {
        damage *= 0.7; 
    }

    // [확인 사살] 적 체력이 10% 미만이면 즉사 데미지 (99999)
    // 좀비 현상 방지: 딸피면 계산이고 뭐고 그냥 죽임
    const currentHp = target.type === 'HERO' ? target.unit.currentHp : target.unit.hp;
    const maxHp = target.unit.maxHp;
    
    if (currentHp / maxHp < 0.1) {
        damage = 99999; 
    } else {
        // 일반 데미지 계산
        let armor = target.unit.armor || 0;
        if (target.type === 'HERO') armor += (target.unit.level * 3);
        
        damage = calcMitigatedDamage(damage, armor);
    }

    // 데미지 차감
    if (target.type === 'HERO') {
        target.unit.currentHp -= damage;
        
        // [즉시 사망 처리] - 다음 프레임까지 기다리지 않음
        if (target.unit.currentHp <= 0) {
            target.unit.currentHp = 0;
            
            // 부활 시간 설정
            const growth = (match as any).growthSettings || {}; // 안전 접근
            const scale = growth.respawnPerLevel || 3.0;
            let respawnTime = 5 + (target.unit.level * scale);
            if (target.unit.level > 11) respawnTime += (target.unit.level - 11) * 3.0;
            target.unit.respawnTimer = Math.floor(respawnTime);

            // 점수 및 로그
            if (defendingTeamColor === 'BLUE') match.score.blue++;
            else match.score.red++;

            target.unit.deaths++;
            
            // 타워 처형 로그
            match.logs.push({
                time: Math.floor(match.currentDuration),
                message: `💀 [${target.unit.name}] 타워에 처형당했습니다!`,
                type: 'KILL',
                team: defendingTeamColor
            });
        }
    } else {
        target.unit.hp -= damage;
        // 미니언 사망 처리는 MinionSystem에서 일괄 처리하므로 둠 (영웅만큼 중요하지 않음)
    }
  }
}
