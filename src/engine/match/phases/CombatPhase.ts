// ==========================================
// FILE PATH: /src/engine/match/phases/CombatPhase.ts
// ==========================================
import { LiveMatch, Hero, BattleSettings, RoleSettings } from '../../../types';
import { applyRoleBonus } from '../RoleManager';

export const processCombatPhase = (
  match: LiveMatch, 
  heroes: Hero[], 
  settings: BattleSettings, // [중요] 진영별 밸런스 설정(BattleSettings) 주입
  roleSettings: RoleSettings, 
  watcherBuffType: string, 
  watcherBuffAmount: number,
  dt: number
) => {
  // 1. 교전 발생 빈도 (시간이 지날수록 빈도 증가)
  const baseChance = 0.5 + (match.currentDuration / 3000) * 0.3;
  if (Math.random() > (baseChance * dt)) return;

  // 살아있는 플레이어 필터링
  const getAlivePlayer = (team: any[]) => {
      const alive = team.filter(p => p.currentHp > 0 && p.respawnTimer <= 0);
      if (alive.length === 0) return null;
      return alive[Math.floor(Math.random() * alive.length)];
  };

  const bluePlayer = getAlivePlayer(match.blueTeam);
  const redPlayer = getAlivePlayer(match.redTeam);

  if (!bluePlayer || !redPlayer) return;

  // 한 번의 교전 틱에서 1~3번의 공방이 오감
  const comboCount = Math.floor(Math.random() * 3) + 1; 

  for (let i = 0; i < comboCount; i++) {
      if (bluePlayer.currentHp <= 0 || redPlayer.currentHp <= 0) break;

      const isBlueAttacker = Math.random() > 0.5;
      const attacker = isBlueAttacker ? bluePlayer : redPlayer;
      const defender = isBlueAttacker ? redPlayer : bluePlayer;
      const attackerTeam = isBlueAttacker ? match.blueTeam : match.redTeam;

      // [신규] 진영별 설정 가져오기 (Blue=Dante, Red=Izman)
      const attackerGod = isBlueAttacker ? settings.dante : settings.izman;
      const defenderGod = isBlueAttacker ? settings.izman : settings.dante;

      const attackerHero = heroes.find(h => h.id === attacker.heroId);
      const defenderHero = heroes.find(h => h.id === defender.heroId);

      if (!attackerHero || !defenderHero) continue;

      let logDetail = `[${attackerHero.name} ⚔️ ${defenderHero.name}] `;

      // --- [명중률 및 회피 계산] ---
      const mechanicsDiff = (attacker.stats.mechanics - defender.stats.mechanics);
      const hitBonus = mechanicsDiff * 0.003; 

      let hitChance = 0.92 + (attackerHero.stats.range / 5000) + hitBonus;
      hitChance -= (defenderHero.stats.speed / 10000); 

      const attackerStats = isBlueAttacker ? match.stats.blue : match.stats.red;
      // 주시자 버프(전투형) 적용
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

      // --- [스킬 선택 및 마나 체크] ---
      const skillKeys = ['q', 'w', 'e', 'r'] as const;
      const skillKey = Math.random() < 0.22 ? 'r' : skillKeys[Math.floor(Math.random() * 3)]; 
      const skill = attackerHero.skills[skillKey];

      const defaultCost = skillKey === 'r' ? 100 : 50;
      const manaCost = (skill as any).cost ?? defaultCost;

      let isBasicAttack = false;
      let rawDamage = 0;

      // 마나 부족 시 평타로 전환
      if (attacker.currentMp < manaCost) {
          isBasicAttack = true;
          logDetail += `(MP부족) 평타 `;
      } else {
          attacker.currentMp -= manaCost;
      }

      const { damageMod } = applyRoleBonus(attacker, attackerHero.role, false, attackerTeam, roleSettings);

      // [핵심 수정 1] 총 공격력 = (기본공격력 + 추가AD) * 진영별 공격 배율(atkRatio)
      const atkRatio = attackerGod?.atkRatio || 1.0;
      const totalAD = (attackerHero.stats.baseAtk + attackerHero.stats.ad) * atkRatio;

      if (isBasicAttack) {
          // 평타 데미지
          rawDamage = totalAD * 1.0; 
      } else {
          // 스킬 데미지 (계수에도 진영 버프 적용)
          const adDmg = totalAD * (skill.adRatio * 0.85);
          const apDmg = attackerHero.stats.ap * (skill.apRatio * 0.85) * atkRatio; 
          rawDamage = (skill.val * 0.8) + adDmg + apDmg;

          if (skillKey === 'r') {
              rawDamage *= 1.6;
              logDetail += ` (ULT)`;
          }
      }

      // --- [치명타 계산] ---
      const mechCritBonus = attacker.stats.mechanics * 0.1; 
      const itemCrit = attacker.items.reduce((sum, item) => sum + item.crit, 0);
      const critChance = attackerHero.stats.crit + itemCrit + mechCritBonus;

      const isCrit = Math.random() < (critChance / 100);
      if (isCrit) {
          rawDamage *= 1.75;
          logDetail += ` ⚡CRIT!`;
      }

      // --- [방어력 계산] ---
      // [핵심 수정 2] 방어력 = (기본방어 + 아이템방어) * 진영별 방어 효율(defRatio)
      const defRatio = defenderGod?.defRatio || 1.0;
      const itemArmor = defender.items.reduce((sum, item) => sum + item.armor, 0);
      const totalArmor = (defenderHero.stats.armor + itemArmor) * defRatio;

      const itemPen = attacker.items.reduce((sum, item) => sum + (item.type === 'WEAPON' ? 15 : 0), 0);
      const totalPen = attackerHero.stats.pen + itemPen;

      const effectiveArmor = Math.max(0, totalArmor - totalPen);
      const damageReduction = 100 / (100 + (effectiveArmor * 0.7));

      let finalDamage = rawDamage * damageReduction * damageMod;

      if (attackerStats.activeBuffs.voidPower && watcherBuffType === 'COMBAT') {
          finalDamage *= (1 + watcherBuffAmount);
      }

      // --- [특수 효과 (처형/힐/보호막)] ---
      if (!isBasicAttack) {
          if (skill.mechanic === 'EXECUTE' && (defender.currentHp / defender.maxHp) < 0.38) {
              finalDamage *= 3.0; 
              logDetail += ` (처형 발동!)`;
          } else if (skill.mechanic === 'HEAL') {
              const healAmount = finalDamage * 0.6; 
              attacker.currentHp = Math.min(attacker.maxHp, attacker.currentHp + healAmount);
              finalDamage = 0; 
              logDetail = `💚 [${attackerHero.name}] 자가 치유 (+${Math.floor(healAmount)})`;
          } else if (skill.mechanic === 'SHIELD') {
              finalDamage = 0;
              logDetail = `🛡️ [${attackerHero.name}] 보호막`;
          }
      }

      finalDamage = Math.floor(finalDamage);

      // --- [로그 생성] ---
      if(!isBasicAttack && skill.mechanic !== 'HEAL' && skill.mechanic !== 'SHIELD') {
          let msg = `✨ [${attackerHero.name}] ${skill.name} (-${manaCost} MP)`;
          if (isCrit) msg += ` ⚡CRIT`;
          msg += ` → ${finalDamage}`;
          logDetail = msg;
      } else if (isBasicAttack) {
          logDetail = `⚔️ [${attackerHero.name}] 기본 공격 → ${finalDamage}`;
      }

      // --- [데미지 적용 및 킬 처리] ---
      if (finalDamage > 0 || (!isBasicAttack && (skill.mechanic === 'HEAL' || skill.mechanic === 'SHIELD'))) {
          defender.currentHp -= finalDamage;
          attacker.totalDamageDealt += finalDamage;

          match.logs = [...match.logs, {
              time: Number(match.currentDuration.toFixed(1)),
              message: logDetail,
              type: 'DEBUG',
              team: isBlueAttacker ? 'BLUE' : 'RED'
          }];

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

              const assistUser = attackerTeam.find(p => p !== attacker && p.currentHp > 0);
              if (assistUser && Math.random() > 0.45) {
                  assistUser.assists++;
                  assistUser.gold += 150;
              }

              // 사망 처리: 체력 0 고정, 부활 타이머 설정
              defender.currentHp = 0; 
              defender.respawnTimer = 5 + (defender.level * 2); 

              break; 
          } 
      }
  }
};