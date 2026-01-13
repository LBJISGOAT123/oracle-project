// ==========================================
// FILE PATH: /src/engine/match/phases/CombatPhase.ts
// ==========================================
import { LiveMatch, Hero, BattleSettings, RoleSettings } from '../../../types';
import { getLevelScaledStats } from '../utils/StatUtils';
import { TargetEvaluator } from '../ai/evaluators/TargetEvaluator';
import { Collision } from '../utils/Collision';
import { SpatialGrid } from '../utils/SpatialGrid'; // [신규]
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

  // [최적화] 매 프레임 그리드 구축 (비용 저렴함)
  const enemyGrid = {
      BLUE: new SpatialGrid(redAlive), // 블루팀 입장에서의 적(레드)
      RED: new SpatialGrid(blueAlive)  // 레드팀 입장에서의 적(블루)
  };
  
  // 미니언 그리드 구축
  const minionList = match.minions || [];
  const minionGrid = {
      BLUE: new SpatialGrid(minionList.filter(m => m.team === 'RED' && m.hp > 0)),
      RED: new SpatialGrid(minionList.filter(m => m.team === 'BLUE' && m.hp > 0))
  };

  const allAttackers = [...blueAlive, ...redAlive];
  allAttackers.sort(() => Math.random() - 0.5);

  allAttackers.forEach(attacker => {
      const isBlue = match.blueTeam.includes(attacker);
      const enemyTeamKey = isBlue ? 'BLUE' : 'RED'; // 내 입장에서의 적 그리드 키

      const attackerHero = heroes.find(h => h.id === attacker.heroId);
      if (!attackerHero) return;

      const atkStats = getLevelScaledStats(attackerHero.stats, attacker.level);
      const attackRange = atkStats.range / 100;

      // -------------------------------------------------------------
      // 1. [최우선] CS 막타 (Smart Farming)
      // -------------------------------------------------------------
      let farmed = false;

      if (match.minions && attacker.lane !== 'JUNGLE') {
          // [최적화] 전체 미니언 루프 대신, 내 주변 미니언만 가져옴 (수백번 -> 수십번으로 감소)
          const nearbyMinions = minionGrid[enemyTeamKey].getNearbyUnits(attacker);
          
          const minionsInRange = nearbyMinions.filter(m => Collision.inRange(attacker, m, attackRange));

          if (minionsInRange.length > 0) {
              const myDamage = calculateUnitDamage(attacker, atkStats, 5, isBlue, settings);
              
              // 처형 임계값
              let executeThreshold = myDamage * 2.5; 
              if (attackerHero.role === '수호기사') {
                  if (Math.random() < 0.05) executeThreshold = myDamage * 6.0; 
                  else return; 
              }

              const targetMinion = TargetEvaluator.selectFarmTarget(attacker, minionsInRange, executeThreshold);

              if (targetMinion) {
                  if (targetMinion.hp <= executeThreshold) targetMinion.hp = 0;
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
                              message: `⚔️ [${attackerHero.name}]가 적의 거신병을 처치했습니다!`, 
                              type: 'KILL', team: isBlue ? 'BLUE' : 'RED' 
                          });
                      }
                  }
                  farmed = true;
              }
          }
      }

      if (farmed) return;

      // -------------------------------------------------------------
      // 2. 적 영웅 타겟팅
      // -------------------------------------------------------------
      if (Math.random() < dt * 2.0) {
          // [최적화] 내 주변 적 영웅만 탐색
          const nearbyEnemies = enemyGrid[enemyTeamKey].getNearbyUnits(attacker);
          const targetsInRange = nearbyEnemies.filter(e => Collision.inRange(attacker, e, attackRange));

          if (targetsInRange.length > 0) {
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
                return;
              }
          }
      }
  });
};
