// ==========================================
// FILE PATH: /src/engine/match/actions/HeroCombatAction.ts
// ==========================================
import { LiveMatch, Hero, LivePlayer, BattleSettings, RoleSettings } from '../../../types';
import { TargetEvaluator } from '../ai/evaluators/TargetEvaluator';
import { calculateHeroDamage } from '../systems/DamageCalculator'; // [수정]
import { distributeAssist } from '../systems/RewardSystem'; // [수정]

export class HeroCombatAction {
  static tryCombat(
    attacker: LivePlayer,
    attackerHero: Hero,
    match: LiveMatch,
    enemies: { heroes: LivePlayer[] },
    atkStats: any,
    isBlue: boolean,
    settings: BattleSettings,
    roleSettings: RoleSettings,
    watcherBuffType: string,
    heroes: Hero[]
  ): boolean {
    if (!enemies.heroes || enemies.heroes.length === 0) return false;

    // 1. 타겟 선정
    const defender = TargetEvaluator.selectBestTarget(attacker, attackerHero, enemies.heroes, heroes);
    
    if (defender) {
        attacker.lastAttackTime = match.currentDuration;
        attacker.lastAttackedTargetId = defender.heroId;

        const defenderHero = heroes.find(h => h.id === defender.heroId);
        if (defenderHero) {
            // 2. 데미지 계산
            const defArmor = (defender.level * 3) + (defenderHero.stats.armor || 30);
            const defStats = { ...defenderHero.stats, armor: defArmor };

            const damage = calculateHeroDamage(
                attacker, defender, atkStats, defStats, attackerHero, 
                isBlue, settings, roleSettings, watcherBuffType
            );
            
            defender.currentHp -= damage;
            attacker.totalDamageDealt += damage;

            // 3. 처치 처리
            if (defender.currentHp <= 0) {
                attacker.kills++; 
                defender.deaths++; 
                attacker.gold += 300;
                
                // [중요] RewardSystem 사용
                distributeAssist(match, attacker, defender, isBlue);

                if (isBlue) match.score.blue++; else match.score.red++;
                
                match.logs.push({ 
                    time: Math.floor(match.currentDuration), 
                    message: `💀 [${attackerHero.name}]가 [${defenderHero.name}] 처치!`, 
                    type: 'KILL', team: isBlue ? 'BLUE' : 'RED' 
                });
                
                defender.currentHp = 0;
                defender.respawnTimer = 10 + (defender.level * 2);
            }
        }
        return true; 
    }

    return false;
  }
}
