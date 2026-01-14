// ==========================================
// FILE PATH: /src/engine/match/actions/FarmAction.ts
// ==========================================
import { LiveMatch, Hero, LivePlayer, Minion, BattleSettings } from '../../../types';
import { TargetEvaluator } from '../ai/evaluators/TargetEvaluator';
import { calculateUnitDamage } from '../systems/DamageCalculator'; 
// [수정] 경로 오류 수정: systems -> logics
import { distributeRewards, MINION_REWARD } from '../logics/CombatLogic';

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

    // 1. 타겟 선정 (가장 피 적은 놈)
    const potentialTargets = [...enemies.minions].sort((a,b) => a.hp - b.hp);
    const targetMinion = potentialTargets[0]; 

    if (!targetMinion) return false;

    // 2. 내 데미지 계산
    const myDamage = calculateUnitDamage(attacker, atkStats, targetMinion, isBlue, settings);

    // 3. 처형 임계값 (막타 각)
    let executeThreshold = myDamage * 2.5; 
    
    // 수호기사(서포터)는 막타 양보 (5% 확률로만 막타 침 - 타곤산 터트리기용)
    if (attackerHero.role === '수호기사') {
        if (Math.random() < 0.05) executeThreshold = myDamage * 6.0; 
        else return false; 
    }

    // 4. 킬 가능한 타겟 재검색
    const killableTarget = TargetEvaluator.selectFarmTarget(attacker, enemies.minions, executeThreshold);

    if (killableTarget) {
        // 데미지 적용
        if (killableTarget.hp <= executeThreshold) {
            killableTarget.hp = 0; // 처형
        } else {
            killableTarget.hp -= myDamage;
        }
        
        attacker.totalDamageDealt += myDamage;

        // 처치 시 보상
        if (killableTarget.hp <= 0) {
            const reward = (MINION_REWARD as any)[killableTarget.type] || MINION_REWARD.MELEE;
            distributeRewards(match, killableTarget, attacker, isBlue ? 'BLUE' : 'RED', reward, heroes);

            if (killableTarget.type === 'SUMMONED_COLOSSUS') {
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
