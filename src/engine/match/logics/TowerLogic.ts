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

    const AGGRO_DURATION = 2.0; 
    const aggroTarget = nearbyEnemyHeroes.find(enemy => {
        if (!enemy.lastAttackTime || !enemy.lastAttackedTargetId) return false;
        const timeSinceAttack = currentTime - enemy.lastAttackTime;
        if (timeSinceAttack > AGGRO_DURATION) return false;
        const victim = allies.find(a => a.heroId === enemy.lastAttackedTargetId);
        return !!victim;
    });

    if (aggroTarget) return { unit: aggroTarget, type: 'HERO' };

    if (nearbyMinions.length > 0) {
        nearbyMinions.sort((a, b) => getDistance(a, towerPos) - getDistance(b, towerPos));
        return { unit: nearbyMinions[0], type: 'MINION' };
    } 
    
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
    // [밸런스 패치] 타워 데미지 대폭 하향 (초반 끔살 방지)
    // 기존: 150~300 -> 변경: 80 (매우 낮음) + 시간 성장
    const timeScaling = Math.min(4.0, 1 + (match.currentDuration / 900)); 
    let baseAtk = isNexus ? 300 : (80 * timeScaling);
    
    let damage = baseAtk * dt;

    // 백도어 패널티는 유지하되, 실수로 맞았을 때 즉사는 안 하게 (1.5배)
    if (target.type === 'HERO' && !hasMinionsNearby) {
        damage *= 1.5;
    }

    if (target.type === 'HERO') {
        let armor = (target.unit.level * 3) + (target.unit.items?.length * 10);
        const realDmg = calcMitigatedDamage(damage, armor);
        
        target.unit.currentHp -= realDmg;
        
        if (target.unit.currentHp <= 0) {
            target.unit.currentHp = 0;
            const respawnTime = 5 + (target.unit.level * 3);
            target.unit.respawnTimer = Math.floor(respawnTime);

            if (defendingTeamColor === 'BLUE') match.score.blue++;
            else match.score.red++;

            target.unit.deaths++;
            
            // 타워 처형은 로그에 남겨서 확인 가능하게 함
            match.logs.push({
                time: Math.floor(match.currentDuration),
                message: `💀 [${target.unit.name}] 타워 다이브 실패! (처형)`,
                type: 'KILL',
                team: defendingTeamColor
            });
        }
    } else {
        // 미니언은 빨리 지워야 하므로 데미지 3배
        target.unit.hp -= damage * 3.0;
    }
  }
}
