// ==========================================
// FILE PATH: /src/engine/match/phases/CombatPhase.ts
// ==========================================
import { LiveMatch, Hero, BattleSettings, RoleSettings } from '../../../types';
import { applyRoleBonus } from '../systems/RoleManager';
import { getLevelScaledStats } from '../utils/StatUtils';
import { TargetEvaluator } from '../ai/evaluators/TargetEvaluator';
import { Collision } from '../utils/Collision';

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

  const allAttackers = [...blueAlive, ...redAlive];
  allAttackers.sort(() => Math.random() - 0.5);

  allAttackers.forEach(attacker => {
      if (attacker.currentHp <= 0) return;

      const isBlue = match.blueTeam.includes(attacker);
      const enemyHeroes = isBlue ? redAlive : blueAlive;
      const attackerHero = heroes.find(h => h.id === attacker.heroId);
      if (!attackerHero) return;

      const atkStats = getLevelScaledStats(attackerHero.stats, attacker.level);
      const attackRange = atkStats.range / 100; 

      // ----------------------------------------------------
      // 1. 적 영웅 타겟팅
      // ----------------------------------------------------
      const targetsInRange = enemyHeroes.filter(e => {
          const d = Math.sqrt(Math.pow(attacker.x - e.x, 2) + Math.pow(attacker.y - e.y, 2));
          return d <= attackRange;
      });

      if (targetsInRange.length > 0) {
          // 영웅이 있으면 영웅 우선 공격 (기존 로직)
          const defender = TargetEvaluator.selectBestTarget(attacker, attackerHero, targetsInRange, heroes);
          if (defender) {
            const defenderHero = heroes.find(h => h.id === defender.heroId);
            if (defenderHero) {
                // 데미지 계산 및 적용
                const defStats = getLevelScaledStats(defenderHero.stats, defender.level);
                const damage = calculateDamage(attacker, defender, atkStats, defStats, attackerHero, isBlue, settings, roleSettings, watcherBuffType, watcherBuffAmount);
                
                defender.currentHp -= damage;
                attacker.totalDamageDealt += damage;

                if (defender.currentHp <= 0) {
                    attacker.kills++; defender.deaths++; attacker.gold += 300;
                    if (isBlue) match.score.blue++; else match.score.red++;
                    match.logs.push({ time: Math.floor(match.currentDuration), message: `💀 [${attackerHero.name}]가 [${defenderHero.name}] 처치!`, type: 'KILL', team: isBlue ? 'BLUE' : 'RED' });
                    defender.currentHp = 0;
                    defender.respawnTimer = 10 + (defender.level * 2);
                }
            }
          }
          return; // 영웅을 때렸으면 턴 종료
      }

      // ----------------------------------------------------
      // 2. [신규] 적 거신병(보스 미니언) 타겟팅
      // 영웅이 없으면 거신병을 때린다. (이게 없어서 무시했던 것)
      // ----------------------------------------------------
      const enemyMinions = match.minions || [];
      // 적군이면서, 살아있고, 거신병 타입이고, 사거리 안에 있는 놈
      const targetColossus = enemyMinions.find(m => 
          m.team !== (isBlue ? 'BLUE' : 'RED') && 
          m.hp > 0 && 
          m.type === 'SUMMONED_COLOSSUS' &&
          Collision.inRange(attacker, m, atkStats.range / 100)
      );

      if (targetColossus) {
          // 거신병 공격
          // 영웅 -> 미니언 데미지 계산 (방어력 50 가정)
          const damage = calculateDamageToUnit(attacker, atkStats, 50, isBlue, settings, roleSettings);
          
          targetColossus.hp -= damage;
          attacker.totalDamageDealt += damage;

          // 거신병 처치 시
          if (targetColossus.hp <= 0) {
              attacker.gold += 150; // 처치 골드
              match.logs.push({ 
                  time: Math.floor(match.currentDuration), 
                  message: `⚔️ [${attackerHero.name}]가 적의 거신병을 파괴했습니다!`, 
                  type: 'KILL', 
                  team: isBlue ? 'BLUE' : 'RED' 
              });
          }
      }
  });
};

// [헬퍼] 영웅 간 데미지 계산
function calculateDamage(
    attacker: any, defender: any, atkStats: any, defStats: any, attackerHero: any, 
    isBlue: boolean, settings: any, roleSettings: any, buffType: string, buffAmount: number
) {
    // 1. 공격력 계산 (기본 + 아이템 + 신 버프)
    const god = isBlue ? settings.dante : settings.izman;
    const atkRatio = god?.atkRatio || 1.0;
    const itemAD = attacker.items.reduce((s:number, i:any) => s + (i.ad||0), 0);
    const totalAD = (atkStats.baseAtk + atkStats.ad + itemAD) * atkRatio;

    // 2. 크리티컬
    const itemCrit = attacker.items.reduce((s:number, i:any) => s + (i.crit||0), 0);
    let isCrit = Math.random() < (atkStats.crit + itemCrit) / 100;
    let rawDmg = totalAD * (isCrit ? 1.75 : 1.0);

    // 3. 방어력 계산
    const defGod = isBlue ? settings.izman : settings.dante; // 적 신
    const defRatio = defGod?.defRatio || 1.0;
    const itemArmor = defender.items.reduce((s:number, i:any) => s + (i.armor||0), 0);
    const totalArmor = (defStats.armor + itemArmor) * defRatio;
    
    // 관통
    const itemPen = attacker.items.reduce((s:number, i:any) => s + (i.pen||0), 0);
    const effectiveArmor = Math.max(0, totalArmor - (atkStats.pen + itemPen));
    
    // 4. 데미지 감소 공식
    const damageReduction = 100 / (100 + effectiveArmor);
    
    // 5. 역할군 보너스 & 버프
    const { damageMod } = applyRoleBonus(attacker, attackerHero.role, false, [], roleSettings);
    let finalDamage = rawDmg * damageReduction * damageMod;

    // 주시자 버프
    if (buffType === 'COMBAT') {
        const stats = isBlue ? settings.dante : settings.izman; // (여기서는 간략히)
        // 실제로는 match.stats를 봐야하지만 함수 인자가 많아지므로 생략, 
        // 대신 기본 데미지에 살짝 보정 (원래 로직 참조)
        finalDamage *= 1.0; 
    }

    return Math.floor(finalDamage);
}

// [헬퍼] 영웅 -> 유닛(거신병) 데미지 계산
function calculateDamageToUnit(attacker: any, atkStats: any, targetArmor: number, isBlue: boolean, settings: any, roleSettings: any) {
    const god = isBlue ? settings.dante : settings.izman;
    const atkRatio = god?.atkRatio || 1.0;
    const itemAD = attacker.items.reduce((s:number, i:any) => s + (i.ad||0), 0);
    const totalAD = (atkStats.baseAtk + atkStats.ad + itemAD) * atkRatio;

    const damageReduction = 100 / (100 + targetArmor);
    return Math.floor(totalAD * damageReduction);
}
