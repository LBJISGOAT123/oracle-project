// ==========================================
// FILE PATH: /src/engine/match/phases/SiegePhase.ts
// ==========================================
import { LiveMatch, Hero, RoleSettings, BattlefieldSettings, BattleSettings } from '../../../types';
import { applyRoleBonus } from '../systems/RoleManager';
import { getDistance, BASES } from '../../data/MapData';
import { TOWER_COORDS } from '../constants/MapConstants';
import { TowerLogic } from '../logics/TowerLogic';
import { calcMitigatedDamage } from '../systems/DamageCalculator';

const getTowerPos = (lane: string, tier: number, isBlueSide: boolean) => {
  const coords = isBlueSide ? TOWER_COORDS.BLUE : TOWER_COORDS.RED;
  if (lane === 'MID') return coords.MID[tier - 1];
  if (lane === 'TOP') return coords.TOP[tier - 1];
  if (lane === 'BOT') return coords.BOT[tier - 1];
  return coords.NEXUS;
};

export const processSiegePhase = (
  match: LiveMatch, 
  heroes: Hero[], 
  fieldSettings: BattlefieldSettings,
  roleSettings: RoleSettings, 
  battleSettings: BattleSettings, 
  dt: number
) => {
  const allPlayers = [...match.blueTeam, ...match.redTeam];
  
  allPlayers.forEach(p => {
    if (p.currentHp <= 0 || p.respawnTimer > 0) return;

    const isBlue = match.blueTeam.includes(p);
    const enemyStats = isBlue ? match.stats.red : match.stats.blue;
    const enemyBase = isBlue ? BASES.RED : BASES.BLUE;
    
    const hero = heroes.find(h => h.id === p.heroId);
    if (!hero) return;

    // [수정] 공격 속도 시뮬레이션 적용
    // 매 프레임 dt를 곱하는 대신, 확률적으로 '평타 한 방'을 때리게 변경하여 데미지 증발 방지
    // speed 300 기준 초당 약 1.2회 공격
    if (Math.random() > dt * (hero.stats.speed / 250)) return;

    // 타워 공격
    if (p.lane !== 'JUNGLE') {
        const laneKey = p.lane.toLowerCase();
        const brokenCount = (enemyStats.towers as any)[laneKey];

        if (brokenCount < 3) {
            const targetTier = brokenCount + 1;
            const towerPos = getTowerPos(p.lane, targetTier, !isBlue);
            const dist = getDistance(p, towerPos);

            if (dist <= 10) {
                const tStats = (fieldSettings.towers as any)[`t${targetTier}`];
                const { siegeMod } = applyRoleBonus(p, hero.role, true, [], roleSettings);
                
                const myStats = isBlue ? match.stats.blue : match.stats.red;
                const buffFactor = myStats.activeBuffs.siegeUnit ? 1.5 : 1.0;

                // [핵심] dt를 곱하지 않음 -> 영웅의 강력한 한 방이 그대로 들어감
                const rawDmg = hero.stats.ad * siegeMod * buffFactor;
                const realDmg = calcMitigatedDamage(rawDmg, tStats.armor);
                
                if (!(enemyStats as any).laneHealth) {
                    (enemyStats as any).laneHealth = { top: 10000, mid: 10000, bot: 10000 };
                }
                
                (enemyStats as any).laneHealth[laneKey] -= realDmg;

                if ((enemyStats as any).laneHealth[laneKey] <= 0) {
                    (enemyStats.towers as any)[laneKey]++;
                    (isBlue ? match.blueTeam : match.redTeam).forEach(m => m.gold += tStats.rewardGold);
                    
                    match.logs.push({ 
                        time: Math.floor(match.currentDuration), 
                        message: `🔥 [${hero.name}] ${targetTier}차 포탑 철거!`, 
                        type: 'TOWER', team: isBlue ? 'BLUE' : 'RED' 
                    });
                    
                    if (brokenCount + 1 < 3) {
                        const nextStats = (fieldSettings.towers as any)[`t${targetTier + 1}`];
                        (enemyStats as any).laneHealth[laneKey] = nextStats.hp;
                    }
                }
            }
        }
    }

    // 넥서스 공격
    const inhibitorsDown = enemyStats.towers.top >= 3 || enemyStats.towers.mid >= 3 || enemyStats.towers.bot >= 3;
    if (inhibitorsDown) {
        const distToNexus = getDistance(p, enemyBase);
        if (distToNexus <= 12) { 
            const nStats = fieldSettings.towers.nexus;
            const { siegeMod } = applyRoleBonus(p, hero.role, true, [], roleSettings);
            const buffFactor = (isBlue ? match.stats.blue : match.stats.red).activeBuffs.siegeUnit ? 2.5 : 1.0;
            
            const rawDmg = hero.stats.ad * siegeMod * buffFactor;
            const realDmg = calcMitigatedDamage(rawDmg, nStats.armor);

            enemyStats.nexusHp -= realDmg;
        }
    }
  });

  // [기존 로직 유지] 구조물 방어 (타워가 적을 공격)
  const lanes = ['TOP', 'MID', 'BOT'];
  const teams = ['BLUE', 'RED'] as const;

  teams.forEach(defendingTeam => {
      const isBlueDef = defendingTeam === 'BLUE';
      const myStats = isBlueDef ? match.stats.blue : match.stats.red;
      
      const allies = isBlueDef ? match.blueTeam : match.redTeam; 
      const enemies = {
          heroes: isBlueDef ? match.redTeam : match.blueTeam,
          minions: (match.minions || []).filter(m => m.team !== defendingTeam)
      };

      // A. 레인 타워
      lanes.forEach(lane => {
          const laneKey = lane.toLowerCase();
          const brokenCount = (myStats.towers as any)[laneKey];
          
          if (brokenCount < 3) {
              const currentTier = brokenCount + 1;
              const towerPos = getTowerPos(lane, currentTier, isBlueDef);
              const towerStats = (fieldSettings.towers as any)[`t${currentTier}`];

              const target = TowerLogic.selectTarget(towerPos, enemies, allies, 12, match.currentDuration);
              if (target) {
                  const hasMinions = enemies.minions.some(m => m.hp > 0 && getDistance(m, towerPos) <= 12);
                  TowerLogic.applyDamage(target, towerStats, dt, false, hasMinions);
              }
          }
      });

      // B. 넥서스 타워
      const inhibitorsDown = myStats.towers.top >= 3 || myStats.towers.mid >= 3 || myStats.towers.bot >= 3;
      if (inhibitorsDown) {
          const nexusPos = isBlueDef ? BASES.BLUE : BASES.RED;
          const nexusStats = fieldSettings.towers.nexus;
          
          const target = TowerLogic.selectTarget(nexusPos, enemies, allies, 15, match.currentDuration);
          if (target) {
              const hasMinions = enemies.minions.some(m => m.hp > 0 && getDistance(m, nexusPos) <= 15);
              TowerLogic.applyDamage(target, nexusStats, dt, true, hasMinions);
          }
      }
  });
};
