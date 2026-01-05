// ==========================================
// FILE PATH: /src/engine/match/phases/CombatPhase.ts
// ==========================================
import { LiveMatch, Hero, BattleSettings, RoleSettings } from '../../../types';
import { applyRoleBonus } from '../systems/RoleManager';
import { getLevelScaledStats } from '../systems/PowerCalculator';

export const processCombatPhase = (
  match: LiveMatch, 
  heroes: Hero[], 
  settings: BattleSettings, 
  roleSettings: RoleSettings, 
  watcherBuffType: string, 
  watcherBuffAmount: number,
  dt: number
) => {
  // [중요] 전투 발생 확률 제한 제거 
  // (DecisionEngine이 접근시켰다면 무조건 싸워야 함)

  const blueAlive = match.blueTeam.filter(p => p.currentHp > 0 && p.respawnTimer <= 0);
  const redAlive = match.redTeam.filter(p => p.currentHp > 0 && p.respawnTimer <= 0);

  if (blueAlive.length === 0 || redAlive.length === 0) return;

  // 모든 유닛이 공격 기회를 가짐
  const allAttackers = [...blueAlive, ...redAlive];
  // 공격 순서 섞기 (공평성)
  allAttackers.sort(() => Math.random() - 0.5);

  allAttackers.forEach(attacker => {
      // 내 차례 오기 전에 죽었으면 패스
      if (attacker.currentHp <= 0) return;

      const isBlue = match.blueTeam.includes(attacker);
      const enemies = isBlue ? redAlive : blueAlive;
      
      const attackerHero = heroes.find(h => h.id === attacker.heroId);
      if (!attackerHero) return;

      // 1. 타겟 탐색 (사거리 체크)
      const attackRange = attackerHero.stats.range / 100; 

      // 사거리 내에 있는 적 찾기
      const targetsInRange = enemies.filter(e => {
          const d = Math.sqrt(Math.pow(attacker.x - e.x, 2) + Math.pow(attacker.y - e.y, 2));
          return d <= attackRange;
      });

      // 사거리에 적이 없으면 공격 단계 건너뜀 (이동은 PlayerSystem이 담당)
      if (targetsInRange.length === 0) return;

      // 타겟 선정 (랜덤)
      const defender = targetsInRange[Math.floor(Math.random() * targetsInRange.length)];
      const defenderHero = heroes.find(h => h.id === defender.heroId);
      if (!defenderHero) return;

      // -----------------------------------------------------------
      // [전투 실행]
      // -----------------------------------------------------------

      // 2. 스탯 계산 (레벨링 적용)
      const atkStats = getLevelScaledStats(attackerHero.stats, attacker.level);
      const defStats = getLevelScaledStats(defenderHero.stats, defender.level);

      let logDetail = `[${attackerHero.name} ⚔️ ${defenderHero.name}] `;

      // 3. 명중률/회피 체크 (순정 공식)
      const mechanicsDiff = (attacker.stats.mechanics - defender.stats.mechanics);
      let hitChance = 0.92 + (atkStats.range / 5000) + (mechanicsDiff * 0.003);
      hitChance -= (defStats.speed / 10000); 

      // 주시자 버프
      const attackerStats = isBlue ? match.stats.blue : match.stats.red;
      if (attackerStats.activeBuffs.voidPower && watcherBuffType === 'COMBAT') {
          hitChance += (watcherBuffAmount / 100);
      }

      if (Math.random() > hitChance) {
          // 빗나감 (로그는 가끔만)
          if (Math.random() < 0.05) {
              match.logs.push({
                  time: match.currentDuration,
                  message: `💨 [${defenderHero.name}] 회피!`,
                  type: 'DODGE',
                  team: isBlue ? 'RED' : 'BLUE'
              });
          }
          return; 
      }

      // 4. 스킬 쿨타임 체크 (PlayerSystem의 cooldowns와 연동)
      const canUseSkill = (key: string) => {
          const cd = (attacker.cooldowns as any)?.[key] || 0;
          return cd <= 0;
      };

      let selectedSkillKey: 'q' | 'w' | 'e' | 'r' | null = null;

      // 우선순위: R -> Q/W/E
      if (canUseSkill('r') && attacker.currentMp >= 100) selectedSkillKey = 'r';
      else if (canUseSkill('q') && attacker.currentMp >= 50) selectedSkillKey = 'q';
      else if (canUseSkill('w') && attacker.currentMp >= 50) selectedSkillKey = 'w';
      else if (canUseSkill('e') && attacker.currentMp >= 50) selectedSkillKey = 'e';

      // 30% 확률로 스킬 아끼고 평타 (평캔 느낌)
      if (Math.random() < 0.3) selectedSkillKey = null;

      let isBasicAttack = false;
      let rawDamage = 0;
      const skill = selectedSkillKey ? attackerHero.skills[selectedSkillKey] : null;

      const attackerGod = isBlue ? settings.dante : settings.izman;
      const atkRatio = attackerGod?.atkRatio || 1.0;

      // 아이템 스탯 합산
      const itemAD = attacker.items.reduce((sum, item) => sum + (item.ad || 0), 0);
      const itemAP = attacker.items.reduce((sum, item) => sum + (item.ap || 0), 0);
      
      const totalAD = (atkStats.baseAtk + atkStats.ad + itemAD) * atkRatio;
      const totalAP = (atkStats.ap + itemAP) * atkRatio;

      if (!selectedSkillKey || !skill) {
          // [평타]
          isBasicAttack = true;
          rawDamage = totalAD;
          logDetail += `평타 `;
      } else {
          // [스킬 사용]
          // 쿨타임 적용 (PlayerSystem에서 감소시킴)
          const baseCd = skill.cd || 10;
          const cdr = Math.min(0.5, attacker.level * 0.02); 
          const finalCd = baseCd * (1 - cdr);

          // 쿨타임 설정
          if (!attacker.cooldowns) attacker.cooldowns = { q:0, w:0, e:0, r:0 };
          (attacker.cooldowns as any)[selectedSkillKey] = finalCd;
          
          attacker.currentMp -= (skill.cost || 50);

          // 데미지 계산
          const adDmg = totalAD * skill.adRatio;
          const apDmg = totalAP * skill.apRatio;
          const skillLevelBonus = 1 + (attacker.level * 0.05); 
          rawDamage = (skill.val * skillLevelBonus) + adDmg + apDmg;
          
          logDetail += `${skill.name} `;
          if (selectedSkillKey === 'r') logDetail += `(ULT) `;
      }

      // 5. 치명타/방어/관통 (사용자 요청: 순정 수치 유지)
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
      
      // 시뮬레이션용 빠른 전개를 위한 보정 (150)
      const damageReduction = 150 / (150 + effectiveArmor);
      
      const { damageMod } = applyRoleBonus(attacker, attackerHero.role, false, isBlue ? match.blueTeam : match.redTeam, roleSettings);
      
      let finalDamage = Math.floor(rawDamage * damageReduction * damageMod *0.5);

      if (attackerStats.activeBuffs.voidPower && watcherBuffType === 'COMBAT') {
          finalDamage = Math.floor(finalDamage * 1.2);
      }

      // 6. 데미지 적용 및 킬
      if (finalDamage > 0) {
          defender.currentHp -= finalDamage;
          attacker.totalDamageDealt += finalDamage;
          
          // 디버그 로그 (가끔만 출력하거나 생략 가능)
          if (match.currentDuration % 10 < 0.1) {
             match.logs.push({
                time: Number(match.currentDuration.toFixed(1)),
                message: `${logDetail} → ${finalDamage}`,
                type: 'DEBUG',
                team: isBlue ? 'BLUE' : 'RED'
             });
          }

          if (defender.currentHp <= 0) {
              attacker.kills++; defender.deaths++; attacker.gold += 300;
              if (isBlue) match.score.blue++; else match.score.red++;
              
              match.logs.push({
                  time: Math.floor(match.currentDuration),
                  message: `💀 [${attackerHero.name}]가 [${defenderHero.name}] 처치!`,
                  type: 'KILL',
                  team: isBlue ? 'BLUE' : 'RED'
              });
              
              defender.currentHp = 0;
              defender.respawnTimer = 10 + (defender.level * 2);
          }
      }
  });
};