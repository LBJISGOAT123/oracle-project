import { LiveMatch, Hero, BattleSettings, RoleSettings } from '../../../types';
import { applyRoleBonus } from '../systems/RoleManager';
// [수정] 경로 수정
import { getLevelScaledStats } from '../utils/StatUtils';
import { TargetEvaluator } from '../ai/evaluators/TargetEvaluator';

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

  if (blueAlive.length === 0 || redAlive.length === 0) return;

  const allAttackers = [...blueAlive, ...redAlive];
  allAttackers.sort(() => Math.random() - 0.5);

  allAttackers.forEach(attacker => {
      if (attacker.currentHp <= 0) return;

      const isBlue = match.blueTeam.includes(attacker);
      const enemies = isBlue ? redAlive : blueAlive;
      
      const attackerHero = heroes.find(h => h.id === attacker.heroId);
      if (!attackerHero) return;

      if (attackerHero.skills.r.mechanic === 'GLOBAL' && attacker.level >= 6) {
          const rCd = (attacker.cooldowns as any)?.r || 0;
          if (rCd <= 0 && attacker.currentMp >= (attackerHero.skills.r.cost || 100)) {
              const killableEnemy = enemies.find(e => {
                  const dmg = attackerHero.skills.r.val + (attackerHero.stats.ap * attackerHero.skills.r.apRatio);
                  return e.currentHp > 0 && e.currentHp < dmg;
              });

              if (killableEnemy) {
                  attacker.currentMp -= (attackerHero.skills.r.cost || 100);
                  (attacker.cooldowns as any).r = attackerHero.skills.r.cd;
                  
                  match.logs.push({
                      time: match.currentDuration,
                      message: `⚡ [${attackerHero.name}] 글로벌 궁극기 발동!`,
                      type: 'SKILL',
                      team: isBlue ? 'BLUE' : 'RED'
                  });

                  enemies.forEach(e => {
                      const dmg = attackerHero.skills.r.val + (attackerHero.stats.ap * attackerHero.skills.r.apRatio);
                      e.currentHp -= dmg;
                      if (e.currentHp <= 0) {
                          attacker.kills++; e.deaths++; attacker.gold += 300;
                          if (isBlue) match.score.blue++; else match.score.red++;
                          e.respawnTimer = 10 + (e.level * 2);
                          match.logs.push({ time: match.currentDuration, message: `💀 [${attackerHero.name}]가 [${heroes.find(h=>h.id===e.heroId)?.name}] 처치!`, type: 'KILL', team: isBlue ? 'BLUE' : 'RED' });
                      }
                  });
                  return; 
              }
          }
      }

      const attackRange = attackerHero.stats.range / 100; 
      const targetsInRange = enemies.filter(e => {
          const d = Math.sqrt(Math.pow(attacker.x - e.x, 2) + Math.pow(attacker.y - e.y, 2));
          return d <= attackRange;
      });

      if (targetsInRange.length === 0) return;

      const defender = TargetEvaluator.selectBestTarget(attacker, attackerHero, targetsInRange, heroes);
      if (!defender) return;

      const defenderHero = heroes.find(h => h.id === defender.heroId);
      if (!defenderHero) return;

      const atkStats = getLevelScaledStats(attackerHero.stats, attacker.level);
      const defStats = getLevelScaledStats(defenderHero.stats, defender.level);

      let logDetail = `[${attackerHero.name} ⚔️ ${defenderHero.name}] `;

      const mechanicsDiff = (attacker.stats.mechanics - defender.stats.mechanics);
      let hitChance = 0.92 + (atkStats.range / 5000) + (mechanicsDiff * 0.003);
      hitChance -= (defStats.speed / 10000); 

      const attackerStats = isBlue ? match.stats.blue : match.stats.red;
      if (attackerStats.activeBuffs.voidPower && watcherBuffType === 'COMBAT') {
          hitChance += (watcherBuffAmount / 100);
      }

      if (Math.random() > hitChance) {
          if (Math.random() < 0.05) {
              match.logs.push({ time: match.currentDuration, message: `💨 [${defenderHero.name}] 회피!`, type: 'DODGE', team: isBlue ? 'RED' : 'BLUE' });
          }
          return; 
      }

      const canUseSkill = (key: string) => { const cd = (attacker.cooldowns as any)?.[key] || 0; return cd <= 0; };
      let selectedSkillKey: 'q' | 'w' | 'e' | 'r' | null = null;

      if (canUseSkill('r') && attacker.currentMp >= 100) selectedSkillKey = 'r';
      else if (canUseSkill('q') && attacker.currentMp >= 50) selectedSkillKey = 'q';
      else if (canUseSkill('w') && attacker.currentMp >= 50) selectedSkillKey = 'w';
      else if (canUseSkill('e') && attacker.currentMp >= 50) selectedSkillKey = 'e';

      if (Math.random() < 0.3) selectedSkillKey = null;

      let rawDamage = 0;
      const skill = selectedSkillKey ? attackerHero.skills[selectedSkillKey] : null;
      const attackerGod = isBlue ? settings.dante : settings.izman;
      const atkRatio = attackerGod?.atkRatio || 1.0;

      const itemAD = attacker.items.reduce((sum, item) => sum + (item.ad || 0), 0);
      const itemAP = attacker.items.reduce((sum, item) => sum + (item.ap || 0), 0);
      const totalAD = (atkStats.baseAtk + atkStats.ad + itemAD) * atkRatio;
      const totalAP = (atkStats.ap + itemAP) * atkRatio;

      if (!selectedSkillKey || !skill) {
          rawDamage = totalAD;
          logDetail += `평타 `;
      } else {
          const baseCd = skill.cd || 10;
          const cdr = Math.min(0.5, attacker.level * 0.02); 
          const finalCd = baseCd * (1 - cdr);
          if (!attacker.cooldowns) attacker.cooldowns = { q:0, w:0, e:0, r:0 };
          (attacker.cooldowns as any)[selectedSkillKey] = finalCd;
          attacker.currentMp -= (skill.cost || 50);
          const adDmg = totalAD * skill.adRatio;
          const apDmg = totalAP * skill.apRatio;
          const skillLevelBonus = 1 + (attacker.level * 0.05); 
          rawDamage = (skill.val * skillLevelBonus) + adDmg + apDmg;
          logDetail += `${skill.name} `;
          if (selectedSkillKey === 'r') logDetail += `(ULT) `;
      }

      const itemCrit = attacker.items.reduce((sum, item) => sum + item.crit, 0);
      if (Math.random() < (atkStats.crit + itemCrit) / 100) {
          rawDamage *= 1.75; 
          logDetail += `⚡`;
      }

      const defenderGod = isBlue ? settings.izman : settings.dante;
      const defRatio = defenderGod?.defRatio || 1.0;
      const itemArmor = defender.items.reduce((sum, item) => sum + item.armor, 0);
      const totalArmor = (defStats.armor + itemArmor) * defRatio;
      const itemPen = attacker.items.reduce((sum, item) => sum + (item.pen || 0), 0);
      const totalPen = atkStats.pen + itemPen;
      const effectiveArmor = Math.max(0, totalArmor - totalPen);
      const damageReduction = 150 / (150 + effectiveArmor);
      const { damageMod } = applyRoleBonus(attacker, attackerHero.role, false, isBlue ? match.blueTeam : match.redTeam, roleSettings);
      
      let finalDamage = Math.floor(rawDamage * damageReduction * damageMod * 0.5);

      if (attackerStats.activeBuffs.voidPower && watcherBuffType === 'COMBAT') finalDamage = Math.floor(finalDamage * 1.2);

      if (finalDamage > 0) {
          defender.currentHp -= finalDamage;
          attacker.totalDamageDealt += finalDamage;
          if (match.currentDuration % 10 < 0.1) match.logs.push({ time: Number(match.currentDuration.toFixed(1)), message: `${logDetail} → ${finalDamage}`, type: 'DEBUG', team: isBlue ? 'BLUE' : 'RED' });

          if (defender.currentHp <= 0) {
              attacker.kills++; defender.deaths++; attacker.gold += 300;
              if (isBlue) match.score.blue++; else match.score.red++;
              match.logs.push({ time: Math.floor(match.currentDuration), message: `💀 [${attackerHero.name}]가 [${defenderHero.name}] 처치!`, type: 'KILL', team: isBlue ? 'BLUE' : 'RED' });
              defender.currentHp = 0;
              defender.respawnTimer = 10 + (defender.level * 2);
          }
      }
  });
};
