// ==========================================
// FILE PATH: /src/engine/match/actions/FarmAction.ts
// ==========================================
import { LiveMatch, Hero, LivePlayer, Minion, BattleSettings } from '../../../types';
import { TargetEvaluator } from '../ai/evaluators/TargetEvaluator';
import { calculateUnitDamage } from '../systems/DamageCalculator'; // [수정]
import { distributeRewards, MINION_REWARD } from '../systems/RewardSystem'; // [수정]

export class FarmAction {
  static tryFarm(
    attacker: LivePlayer,
    attackerHero: Hero,
    match: LiveMatch,
    enemies: { minions: Minion[] },
    atkStats: any,
    isBlue: boolean,
    settings: BattleSettings,
    heroes: Hero[]
  ): boolean {
    
    if (!enemies.minions || enemies.minions.length === 0) return false;

    // 1. 내 데미지 계산
    const myDamage = calculateUnitDamage(attacker, atkStats, 5, isBlue, settings);

    // 2. 처형 임계값 설정
    let executeThreshold = myDamage * 2.5; 

    if (attackerHero.role === '수호기사') {
        if (Math.random() < 0.05) { 
            executeThreshold = myDamage * 6.0; 
        } else {
            return false; 
        }
    }

    // 3. 타겟 선정
    const targetMinion = TargetEvaluator.selectFarmTarget(attacker, enemies.minions, executeThreshold);

    if (targetMinion) {
        if (targetMinion.hp <= executeThreshold) {
            targetMinion.hp = 0;
        } else {
            targetMinion.hp -= myDamage;
        }
        
        attacker.totalDamageDealt += myDamage;

        if (targetMinion.hp <= 0) {
            const reward = (MINION_REWARD as any)[targetMinion.type] || MINION_REWARD.MELEE;
            
            // [중요] RewardSystem 사용
            distributeRewards(match, targetMinion, attacker, isBlue ? 'BLUE' : 'RED', reward, heroes);

            if (targetMinion.type === 'SUMMONED_COLOSSUS') {
                match.logs.push({ 
                    time: Math.floor(match.currentDuration), 
                    message: `⚔️ [${attackerHero.name}]가 적의 거신병을 처치했습니다!`, 
                    type: 'KILL', team: isBlue ? 'BLUE' : 'RED' 
                });
            }
        }
        return true; 
    }

    return false; 
  }
}
