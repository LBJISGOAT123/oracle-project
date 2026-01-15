// ==========================================
// FILE PATH: /src/engine/match/phases/CombatPhase.ts
// ==========================================
import { LiveMatch, Hero, BattleSettings, RoleSettings, LivePlayer } from '../../../types';
import { getLevelScaledStats } from '../utils/StatUtils';
import { Collision } from '../utils/Collision';
import { 
    calculateHeroDamage, 
    calculateUnitDamage, 
    distributeAssist, 
    distributeRewards,
    MINION_REWARD 
} from '../logics/CombatLogic';
import { PersonalMemory } from '../ai/memory/PersonalMemory';

export const processCombatPhase = (
  match: LiveMatch, 
  heroes: Hero[], 
  settings: BattleSettings, 
  roleSettings: RoleSettings, 
  watcherBuffType: string, 
  watcherBuffAmount: number,
  dt: number
) => {
  const allPlayers = [...match.blueTeam, ...match.redTeam];

  allPlayers.forEach(attacker => {
      if (attacker.currentHp <= 0 || attacker.respawnTimer > 0) return;
      if (attacker.attackTimer > 0) return;

      const isBlue = match.blueTeam.includes(attacker);
      const enemies = isBlue ? match.redTeam : match.blueTeam;
      const enemyMinions = match.minions ? match.minions.filter(m => m.team !== (isBlue ? 'BLUE' : 'RED') && m.hp > 0) : [];
      const jungleMobs = match.jungleMobs ? match.jungleMobs.filter(m => m.isAlive) : [];

      const attackerHero = heroes.find(h => h.id === attacker.heroId);
      if (!attackerHero) return;

      const atkStats = getLevelScaledStats(attackerHero.stats, attacker.level);
      const rangeVal = Math.max(2.5, atkStats.range / 100); 

      // 공속 계산
      const baseAS = 0.6 + (attacker.stats.mechanics / 200) + (attacker.items.length * 0.1);
      const attackDelay = 1.0 / baseAS;

      // 1. 영웅 공격
      const heroesInRange = enemies.filter(e => 
          e.currentHp > 0 && e.respawnTimer <= 0 && Collision.inRange(attacker, e, rangeVal)
      );

      if (heroesInRange.length > 0) {
          const target = heroesInRange.sort((a, b) => (a.currentHp/a.maxHp) - (b.currentHp/b.maxHp))[0];
          
          if (target) {
              const targetHero = heroes.find(h => h.id === target.heroId);
              if (targetHero) {
                  const defStats = getLevelScaledStats(targetHero.stats, target.level);
                  const dmg = calculateHeroDamage(attacker, target, atkStats, defStats, attackerHero, isBlue, settings, roleSettings, watcherBuffType);
                  
                  target.currentHp -= dmg;
                  attacker.totalDamageDealt += dmg;
                  
                  attacker.attackTimer = attackDelay;
                  attacker.lastAttackTime = match.currentDuration;
                  attacker.lastAttackedTargetId = target.heroId;

                  if (target.currentHp <= 0) {
                      handleHeroKill(match, attacker, target, attackerHero, targetHero, isBlue);
                  }
              }
              return; 
          }
      }

      // 2. 미니언 & 정글 몹 파밍
      const minionsInRange = enemyMinions.filter(m => Collision.inRange(attacker, m, rangeVal));
      const mobsInRange = jungleMobs.filter(m => Collision.inRange(attacker, m, rangeVal));

      if (minionsInRange.length > 0 || mobsInRange.length > 0) {
          let targetUnit: any = null;
          let isJungleMob = false;

          if (attacker.lane === 'JUNGLE' && mobsInRange.length > 0) {
              targetUnit = mobsInRange[0];
              isJungleMob = true;
          } else if (minionsInRange.length > 0) {
              const myDamage = calculateUnitDamage(attacker, atkStats, 0, isBlue, settings);
              targetUnit = minionsInRange.find(m => m.hp <= myDamage) || minionsInRange[0];
          } else if (mobsInRange.length > 0) {
              targetUnit = mobsInRange[0];
              isJungleMob = true;
          }

          if (targetUnit) {
              const baseDmg = calculateUnitDamage(attacker, atkStats, 0, isBlue, settings);
              const finalDmg = Math.max(1, baseDmg * (isJungleMob ? 1.5 : 1.0));

              targetUnit.hp -= finalDmg;
              attacker.totalDamageDealt += finalDmg;
              attacker.attackTimer = attackDelay;

              if (targetUnit.hp <= 0) {
                  let reward = { gold: 0, xp: 0 };
                  
                  if (isJungleMob) {
                      targetUnit.isAlive = false;
                      targetUnit.respawnTimer = targetUnit.configRespawnTime || 60;
                      reward = { gold: targetUnit.rewardGold || 50, xp: targetUnit.rewardXp || 100 };
                      if (attacker.lane === 'JUNGLE') {
                          reward.gold = Math.floor(reward.gold * 1.2);
                          reward.xp = Math.floor(reward.xp * 1.2);
                      }
                  } else {
                      reward = (MINION_REWARD as any)[targetUnit.type] || MINION_REWARD.MELEE;
                  }

                  attacker.cs++; 
                  attacker.gold += reward.gold;
                  attacker.totalGold += reward.gold;
                  distributeRewards(match, targetUnit, attacker, isBlue ? 'BLUE' : 'RED', reward, heroes);
              }
          }
      }
  });
};

function handleHeroKill(match: LiveMatch, attacker: LivePlayer, target: LivePlayer, attackerHero: Hero, targetHero: Hero, isBlue: boolean) {
    attacker.kills++;
    target.deaths++;
    attacker.gold += 300;
    attacker.totalGold += 300;
    attacker.killStreak++;
    target.killStreak = 0;
    
    // [핵심] 사망 시 주시자 버프 제거
    if (target.buffs && target.buffs.includes('WATCHER_BUFF')) {
        target.buffs = target.buffs.filter(b => b !== 'WATCHER_BUFF');
        match.logs.push({
            time: Math.floor(match.currentDuration),
            message: `💔 [${target.name}] 사망하여 주시자의 힘을 잃었습니다.`,
            type: 'KILL'
        });
    }

    distributeAssist(match, attacker, target, isBlue);
    PersonalMemory.recordEvent(attacker, target);

    if (isBlue) match.score.blue++; else match.score.red++;
    
    match.logs.push({ 
        time: Math.floor(match.currentDuration), 
        message: `⚔️ [${attackerHero.name}] -> [${targetHero.name}] 처치!`, 
        type: 'KILL', team: isBlue ? 'BLUE' : 'RED' 
    });

    target.currentHp = 0;
    target.respawnTimer = 10 + (target.level * 3); 
}
