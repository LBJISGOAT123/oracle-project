// ==========================================
// FILE PATH: /src/engine/match/phases/CombatPhase.ts
// ==========================================
import { LiveMatch, Hero, BattleSettings, RoleSettings } from '../../../types';
import { getLevelScaledStats } from '../utils/StatUtils';
import { TargetEvaluator } from '../ai/evaluators/TargetEvaluator';
import { Collision } from '../utils/Collision';
import { SpatialGrid } from '../utils/SpatialGrid';
import { 
    calculateHeroDamage, 
    calculateUnitDamage, 
    distributeAssist, 
    distributeRewards,
    MINION_REWARD 
} from '../logics/CombatLogic';

export const processCombatPhase = (
  match: LiveMatch, 
  heroes: Hero[], 
  settings: BattleSettings, 
  roleSettings: RoleSettings, 
  watcherBuffType: string, 
  watcherBuffAmount: number,
  dt: number
) => {
  const blueAlive = match.blueTeam.filter(p => p.currentHp > 0 && p.respawnTimer <= 0);
  const redAlive = match.redTeam.filter(p => p.currentHp > 0 && p.respawnTimer <= 0);

  if (blueAlive.length === 0 && redAlive.length === 0) return;

  const enemyGrid = {
      BLUE: new SpatialGrid(redAlive),
      RED: new SpatialGrid(blueAlive)
  };
  
  const minionList = match.minions || [];
  const minionGrid = {
      BLUE: new SpatialGrid(minionList.filter(m => m.team === 'RED' && m.hp > 0)),
      RED: new SpatialGrid(minionList.filter(m => m.team === 'BLUE' && m.hp > 0))
  };

  const allAttackers = [...blueAlive, ...redAlive];
  // 공격 순서를 랜덤화하여 공평성 유지
  allAttackers.sort(() => Math.random() - 0.5);

  allAttackers.forEach(attacker => {
      const isBlue = match.blueTeam.includes(attacker);
      const enemyTeamKey = isBlue ? 'BLUE' : 'RED';

      const attackerHero = heroes.find(h => h.id === attacker.heroId);
      if (!attackerHero) return;

      const atkStats = getLevelScaledStats(attackerHero.stats, attacker.level);
      const attackRange = atkStats.range / 100;

      // 1. [CS 막타] - 뇌지컬이 높으면 CS를 더 잘 먹음 (놓칠 확률 감소)
      let farmed = false;
      const brain = attacker.stats.brain; // 0 ~ 100

      if (match.minions && attacker.lane !== 'JUNGLE') {
          const nearbyMinions = minionGrid[enemyTeamKey].getNearbyUnits(attacker);
          const minionsInRange = nearbyMinions.filter(m => Collision.inRange(attacker, m, attackRange));

          if (minionsInRange.length > 0) {
              const myDamage = calculateUnitDamage(attacker, atkStats, 5, isBlue, settings);
              
              // 뇌지컬 보정: 뇌지컬이 낮으면 막타 계산 실수 (데미지 80~120% 랜덤 인식)
              let perceivedDmg = myDamage;
              if (brain < 50) {
                  const error = 1 + (Math.random() * 0.4 - 0.2); 
                  perceivedDmg *= error;
              }

              let executeThreshold = perceivedDmg * 2.5; 
              if (attackerHero.role === '수호기사') {
                  if (Math.random() < 0.05) executeThreshold = perceivedDmg * 6.0; 
                  else executeThreshold = 0; 
              }

              const targetMinion = TargetEvaluator.selectFarmTarget(attacker, minionsInRange, executeThreshold);

              if (targetMinion) {
                  // 실제 데미지 적용
                  if (targetMinion.hp <= executeThreshold) targetMinion.hp = 0; // 처형
                  else targetMinion.hp -= myDamage;
                  
                  attacker.totalDamageDealt += myDamage;

                  if (targetMinion.hp <= 0) {
                      const reward = (MINION_REWARD as any)[targetMinion.type] || MINION_REWARD.MELEE;
                      attacker.cs++;
                      attacker.gold += reward.gold;
                      distributeRewards(match, targetMinion, attacker, isBlue ? 'BLUE' : 'RED', reward, heroes);

                      if (targetMinion.type === 'SUMMONED_COLOSSUS') {
                          match.logs.push({ 
                              time: Math.floor(match.currentDuration), 
                              message: `⚔️ [${attackerHero.name}]가 거신병 처치!`, 
                              type: 'KILL', team: isBlue ? 'BLUE' : 'RED' 
                          });
                      }
                  }
                  farmed = true;
              }
          }
      }

      if (farmed) return; // CS 먹었으면 이번 틱은 영웅 공격 안함

      // 2. 적 영웅 공격
      if (Math.random() < dt * 2.0) {
          const nearbyEnemies = enemyGrid[enemyTeamKey].getNearbyUnits(attacker);
          const targetsInRange = nearbyEnemies.filter(e => Collision.inRange(attacker, e, attackRange));

          if (targetsInRange.length > 0) {
              // TargetEvaluator 내부에서도 뇌지컬이 낮으면 엉뚱한(탱커) 타겟을 칠 수 있음
              const defender = TargetEvaluator.selectBestTarget(attacker, attackerHero, targetsInRange, heroes);
              if (defender) {
                attacker.lastAttackTime = match.currentDuration;
                attacker.lastAttackedTargetId = defender.heroId;

                const defenderHero = heroes.find(h => h.id === defender.heroId);
                if (defenderHero) {
                    const defStats = getLevelScaledStats(defenderHero.stats, defender.level);
                    const damage = calculateHeroDamage(attacker, defender, atkStats, defStats, attackerHero, isBlue, settings, roleSettings, watcherBuffType);
                    
                    defender.currentHp -= damage;
                    attacker.totalDamageDealt += damage;

                    if (defender.currentHp <= 0) {
                        attacker.kills++; defender.deaths++; attacker.gold += 300;
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
              }
          }
      }
  });
};
