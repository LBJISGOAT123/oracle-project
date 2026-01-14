// ==========================================
// FILE PATH: /src/engine/match/ai/evaluators/KillEvaluator.ts
// ==========================================
import { LivePlayer, Hero, BattleSettings, RoleSettings, LiveMatch } from '../../../../types';
import { AIUtils } from '../AIUtils';
import { getLevelScaledStats, calculateTotalStats } from '../../utils/StatUtils';
import { applyRoleBonus } from '../../systems/RoleManager';
import { Perception } from '../Perception';

export class KillEvaluator {
  
  static evaluateKillChance(
    attacker: LivePlayer, 
    target: LivePlayer, 
    heroes: Hero[],
    match: LiveMatch,
    settings: BattleSettings,
    roleSettings: RoleSettings
  ): number {
    const atkHero = heroes.find(h => h.id === attacker.heroId);
    const defHero = heroes.find(h => h.id === target.heroId);
    if (!atkHero || !defHero) return 0;

    // 1. 기본 데미지 계산
    const atkBase = getLevelScaledStats(atkHero.stats, attacker.level);
    const atkTotal = calculateTotalStats({ ...atkHero, stats: atkBase }, attacker.items);
    const { damageMod } = applyRoleBonus(attacker, atkHero.role, false, [], roleSettings);
    const comboDmg = (atkTotal.ad * 2.5 + atkTotal.ap * 2.0 + 100) * damageMod;
    
    const defBase = getLevelScaledStats(defHero.stats, target.level);
    const defTotal = calculateTotalStats({ ...defHero, stats: defBase }, target.items);
    const defMitigation = 100 / (100 + defTotal.armor);
    const estimatedRealDmg = comboDmg * defMitigation;

    let killScore = 0;
    const currentHp = target.currentHp;

    // 2. 1:1 승산 계산
    if (currentHp <= estimatedRealDmg) {
        killScore += 500; 
        if (AIUtils.hpPercent(target) < 0.15) killScore += 1000; 
    } else {
        killScore += (estimatedRealDmg / currentHp) * 50;
    }

    // =========================================================
    // [핵심 추가] 상황 판단 (Context Awareness)
    // =========================================================
    
    // A. 적 지원군 체크 (Target's Backup)
    // 타겟 주변 15거리 내에 다른 적이 몇 명이나 있는가?
    const isBlueAttacker = match.blueTeam.includes(attacker);
    const enemies = isBlueAttacker ? match.redTeam : match.blueTeam;
    
    const enemiesNearTarget = enemies.filter(e => 
        e !== target && e.currentHp > 0 && AIUtils.dist(target, e) < 15
    ).length;

    // 적이 뭉쳐있으면 점수 대폭 삭감 (자살 행위 방지)
    if (enemiesNearTarget > 0) {
        killScore -= (enemiesNearTarget * 1000); // 한 명당 -1000점 (절대 못 들어가게)
        
        // 단, 내 뇌지컬이 낮으면(40 미만) 상황 파악 못하고 꼴아박음
        if (attacker.stats.brain < 40) {
            killScore += (enemiesNearTarget * 800); // 페널티 상쇄 (멍청함 구현)
        }
        
        // 광역 딜러(선지자)는 뭉친 적에게 점수 가산 (단, 너무 많으면 위험)
        if (atkHero.role === '선지자' && enemiesNearTarget <= 2) {
            killScore += 500; 
        }
    }

    // B. 성장 차이 (Level Gap)
    // 적 레벨이 나보다 높으면 쫄아야 함
    const levelDiff = target.level - attacker.level;
    if (levelDiff > 0) {
        killScore -= (levelDiff * 300); // 1레벨 차이당 -300점
    } else if (levelDiff < 0) {
        killScore += (Math.abs(levelDiff) * 100); // 양학 보너스
    }

    // C. 타워 다이브 체크
    const underTower = Perception.isInActiveEnemyTowerRange({x: target.x, y: target.y}, match, isBlueAttacker);
    if (underTower) {
        killScore -= 2000; // 기본적으로 다이브 금지
        
        // 뇌지컬 높고 + 확실한 킬각 + 내 피 많음 -> 예외적 허용
        if (attacker.stats.brain > 60 && currentHp < estimatedRealDmg * 0.8 && AIUtils.hpPercent(attacker) > 0.7) {
            killScore += 1500; 
        }
    }

    return killScore;
  }

  static isWorthTrading(attacker: LivePlayer, target: LivePlayer): boolean {
    const brain = attacker.stats.brain;
    // 멍청하면 무조건 싸움
    if (brain < 40) return true;
    
    // 성장 차이 심하면 덤비지 않음
    if (target.level >= attacker.level + 2) return false;
    
    // 내 피가 너무 없으면 딜교환 손해
    if (AIUtils.hpPercent(attacker) < 0.3 && AIUtils.hpPercent(target) > 0.5) return false;

    return true;
  }
}
