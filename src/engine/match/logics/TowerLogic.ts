// ==========================================
// FILE PATH: /src/engine/match/logics/TowerLogic.ts
// ==========================================
import { LivePlayer, Minion, LiveMatch } from '../../../types';
import { getDistance } from '../../data/MapData';
import { calcMitigatedDamage } from './CombatLogic';

export class TowerLogic {
  static selectTarget(
    towerPos: { x: number, y: number },
    enemies: { heroes: LivePlayer[], minions: Minion[] },
    allies: LivePlayer[], 
    range: number,
    currentTime: number
  ): { unit: any, type: 'HERO' | 'MINION' } | null {
    
    const nearbyMinions = enemies.minions.filter(m => m.hp > 0 && getDistance(m, towerPos) <= range);
    const nearbyEnemyHeroes = enemies.heroes.filter(h => h.currentHp > 0 && h.respawnTimer <= 0 && getDistance(h, towerPos) <= range);

    if (nearbyMinions.length === 0 && nearbyEnemyHeroes.length === 0) return null;

    // 1. [어그로] 아군 영웅을 친 적 영웅
    const AGGRO_DURATION = 2.0; 
    const aggroTarget = nearbyEnemyHeroes.find(enemy => {
        if (!enemy.lastAttackTime || !enemy.lastAttackedTargetId) return false;
        const timeSinceAttack = currentTime - enemy.lastAttackTime;
        if (timeSinceAttack > AGGRO_DURATION) return false;
        const victim = allies.find(a => a.heroId === enemy.lastAttackedTargetId);
        return !!victim;
    });

    if (aggroTarget) return { unit: aggroTarget, type: 'HERO' };

    // 2. 미니언 (가까운 순)
    if (nearbyMinions.length > 0) {
        nearbyMinions.sort((a, b) => getDistance(a, towerPos) - getDistance(b, towerPos));
        return { unit: nearbyMinions[0], type: 'MINION' };
    } 
    
    // 3. 영웅 (미니언 없으면)
    nearbyEnemyHeroes.sort((a, b) => getDistance(a, towerPos) - getDistance(b, towerPos));
    return { unit: nearbyEnemyHeroes[0], type: 'HERO' };
  }

  static applyDamage(
    match: LiveMatch,
    target: { unit: any, type: 'HERO' | 'MINION' },
    towerStats: any,
    dt: number,
    isNexus: boolean,
    hasMinionsNearby: boolean,
    defendingTeamColor: 'BLUE' | 'RED'
  ) {
    const baseAtk = towerStats.atk || (isNexus ? 1000 : 300);
    
    // 기본 타워 공격력
    let damage = baseAtk * dt;

    // [백도어 패널티] 미니언 없이 영웅 혼자면 데미지 3배 (매우 아픔)
    if (target.type === 'HERO' && !hasMinionsNearby) {
        damage *= 3.0;
    }

    if (target.type === 'HERO') {
        // 영웅 방어력 적용
        let armor = (target.unit.level * 3) + (target.unit.items?.length * 10);
        const realDmg = calcMitigatedDamage(damage, armor);
        
        target.unit.currentHp -= realDmg;
        
        if (target.unit.currentHp <= 0) {
            target.unit.currentHp = 0;
            // 부활 시간: 5초 + 레벨당 3초 (자연스러운 증가)
            const respawnTime = 5 + (target.unit.level * 3);
            target.unit.respawnTimer = Math.floor(respawnTime);

            if (defendingTeamColor === 'BLUE') match.score.blue++;
            else match.score.red++;

            target.unit.deaths++;
            
            match.logs.push({
                time: Math.floor(match.currentDuration),
                message: `💀 [${target.unit.name}] 타워에 처형당했습니다!`,
                type: 'KILL',
                team: defendingTeamColor
            });
        }
    } else {
        // 미니언은 방어력 0으로 가정하고 딜 박힘 (순삭 방지 위해 미니언 체력 세팅 중요)
        target.unit.hp -= damage;
    }
  }
}
