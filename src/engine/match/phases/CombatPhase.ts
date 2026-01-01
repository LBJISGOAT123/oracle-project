// ==========================================
// FILE PATH: /src/engine/match/phases/CombatPhase.ts
// ==========================================
import { LiveMatch, Hero, BattleSettings, RoleSettings } from '../../../types';
import { applyRoleBonus } from '../RoleManager';

export const processCombatPhase = (
  match: LiveMatch, 
  heroes: Hero[], 
  settings: BattleSettings,
  roleSettings: RoleSettings, 
  watcherBuffType: string, 
  watcherBuffAmount: number,
  dt: number
) => {
  // [킬 유도] 교전 발생 빈도 상향 (0.18 -> 0.5)
  const baseChance = 0.5 + (match.currentDuration / 3000) * 0.3;
  if (Math.random() > (baseChance * dt)) return;

  const getAlivePlayer = (team: any[]) => {
      const alive = team.filter(p => p.currentHp > 0);
      if (alive.length === 0) return null;
      return alive[Math.floor(Math.random() * alive.length)];
  };

  const bluePlayer = getAlivePlayer(match.blueTeam);
  const redPlayer = getAlivePlayer(match.redTeam);

  if (!bluePlayer || !redPlayer) return;

  // [기능 유지] 피지컬 기반 콤보 카운트
  const comboCount = Math.floor(Math.random() * 3) + 1; 

  for (let i = 0; i < comboCount; i++) {
      if (bluePlayer.currentHp <= 0 || redPlayer.currentHp <= 0) break;

      const isBlueAttacker = Math.random() > 0.5;
      const attacker = isBlueAttacker ? bluePlayer : redPlayer;
      const defender = isBlueAttacker ? redPlayer : bluePlayer;
      const attackerTeam = isBlueAttacker ? match.blueTeam : match.redTeam;

      const attackerHero = heroes.find(h => h.id === attacker.heroId);
      const defenderHero = heroes.find(h => h.id === defender.heroId);

      if (!attackerHero || !defenderHero) continue;

      let logDetail = `[${attackerHero.name} ⚔️ ${defenderHero.name}] `;

      // [기능 유지] 피지컬 반영 명중률 및 회피 로직
      const mechanicsDiff = (attacker.stats.mechanics - defender.stats.mechanics);
      const hitBonus = mechanicsDiff * 0.003; 

      let hitChance = 0.92 + (attackerHero.stats.range / 5000) + hitBonus;
      hitChance -= (defenderHero.stats.speed / 10000); 

      const attackerStats = isBlueAttacker ? match.stats.blue : match.stats.red;
      if (attackerStats.activeBuffs.voidPower && watcherBuffType === 'COMBAT') {
          hitChance += (watcherBuffAmount / 100);
      }

      if (Math.random() > hitChance) {
          if (i === 0 && Math.random() < 0.1) { 
              const dodgeMsg = mechanicsDiff < -30 
                ? `💨 [${defenderHero.name}] 슈퍼 무빙으로 회피! (피지컬 차이)` 
                : `💨 [${attackerHero.name}]의 공격이 빗나갔습니다.`;

              match.logs = [...match.logs, {
                  time: match.currentDuration,
                  message: dodgeMsg,
                  type: 'DODGE',
                  team: isBlueAttacker ? 'RED' : 'BLUE'
              }];
          }
          continue;
      }

      // [기능 유지] 스킬 선택 로직
      const skillKeys = ['q', 'w', 'e', 'r'] as const;
      const skillKey = Math.random() < 0.22 ? 'r' : skillKeys[Math.floor(Math.random() * 3)]; 
      const skill = attackerHero.skills[skillKey];

      const { damageMod } = applyRoleBonus(attacker, attackerHero.role, false, attackerTeam, roleSettings);

      // [킬 유도] 데미지 계수 대폭 상향 (기존 0.5/0.7 -> 0.8/0.9)
      const adDmg = attackerHero.stats.ad * (skill.adRatio * 0.85);
      const apDmg = attackerHero.stats.ap * (skill.apRatio * 0.85);
      let rawDamage = (skill.val * 0.8) + adDmg + apDmg;

      // [기능 유지] 피지컬 기반 치명타 및 보정
      const mechCritBonus = attacker.stats.mechanics * 0.1; 
      const itemCrit = attacker.items.reduce((sum, item) => sum + item.crit, 0);
      const critChance = attackerHero.stats.crit + itemCrit + mechCritBonus;

      const isCrit = Math.random() < (critChance / 100);
      if (isCrit) {
          rawDamage *= 1.75;
          logDetail += ` ⚡CRIT!`;
      }

      if (skillKey === 'r') {
          rawDamage *= 1.6;
          logDetail += ` (ULT)`;
      }

      // [기능 유지] 상세 방어력/관통력 공식
      const itemArmor = defender.items.reduce((sum, item) => sum + item.armor, 0);
      const totalArmor = (defenderHero.stats.armor + itemArmor);
      const itemPen = attacker.items.reduce((sum, item) => sum + (item.type === 'WEAPON' ? 15 : 0), 0);
      const totalPen = attackerHero.stats.pen + itemPen;
      const effectiveArmor = Math.max(0, totalArmor - totalPen);
      const damageReduction = 100 / (100 + (effectiveArmor * 0.7)); // 방어 효율 소폭 하향

      let finalDamage = rawDamage * damageReduction * damageMod;

      if (attackerStats.activeBuffs.voidPower && watcherBuffType === 'COMBAT') {
          finalDamage *= (1 + watcherBuffAmount);
      }

      // [기능 유지] 특수 효과 메커니즘 (처형, 힐, 쉴드)
      if (skill.mechanic === 'EXECUTE' && (defender.currentHp / defender.maxHp) < 0.38) {
          finalDamage *= 3.0; // 처형 위력 상향
          logDetail += ` (처형 발동!)`;
      } else if (skill.mechanic === 'HEAL') {
          const healAmount = finalDamage * 0.6; 
          attacker.currentHp = Math.min(attacker.maxHp, attacker.currentHp + healAmount);
          finalDamage = 0; 
          logDetail = `💚 [${attackerHero.name}] 자가 치유: +${Math.floor(healAmount)}`;
      } else if (skill.mechanic === 'SHIELD') {
          finalDamage = 0;
          logDetail = `🛡️ [${attackerHero.name}] 보호막 전개`;
      }

      finalDamage = Math.floor(finalDamage);

      // [기능 유지] 슈퍼플레이 로그 포함 상세 출력
      if(skill.mechanic !== 'HEAL' && skill.mechanic !== 'SHIELD') {
          let msg = `⚔️ [${attackerHero.name}] ${skillKey==='r'?'궁극기 ':''}'${skill.name}'`;
          if (isCrit) msg += ` ⚡치명타!`;
          msg += ` → ${finalDamage}`;
          if(mechanicsDiff > 35 && isCrit) msg += ` (슈퍼플레이!)`; 
          logDetail = msg;
      }

      if (finalDamage > 0 || skill.mechanic === 'HEAL' || skill.mechanic === 'SHIELD') {
          defender.currentHp -= finalDamage;
          attacker.totalDamageDealt += finalDamage;

          match.logs = [...match.logs, {
              time: Number(match.currentDuration.toFixed(1)),
              message: logDetail,
              type: 'DEBUG',
              team: isBlueAttacker ? 'BLUE' : 'RED'
          }];

          // [기능 유지] 킬/데스 처리 및 어시스트 시스템
          if (defender.currentHp <= 0) {
              attacker.kills++; defender.deaths++;
              attacker.gold += 300; 
              if (isBlueAttacker) match.score.blue++; else match.score.red++;

              match.logs = [...match.logs, {
                  time: Math.floor(match.currentDuration),
                  message: `💀 [${attackerHero.name}] 킬! (${attacker.kills}킬) → [${defenderHero.name}]`,
                  type: 'KILL',
                  team: isBlueAttacker ? 'BLUE' : 'RED'
              }];

              // 어시스트 골드 정산
              const assistUser = attackerTeam.find(p => p !== attacker && p.currentHp > 0);
              if (assistUser && Math.random() > 0.45) {
                  assistUser.assists++;
                  assistUser.gold += 150;
              }

              defender.currentHp = defender.maxHp; 
              break; 
          } 
      }
  }
};