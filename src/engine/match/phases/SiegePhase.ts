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

const LOGIC_TOWER_RANGE = 12; 
const LOGIC_NEXUS_RANGE = 15;

export const processSiegePhase = (
  match: LiveMatch, 
  heroes: Hero[], 
  fieldSettings: BattlefieldSettings,
  roleSettings: RoleSettings, 
  battleSettings: BattleSettings, 
  dt: number
) => {
  const allPlayers = [...match.blueTeam, ...match.redTeam];

  // 1. [공격] 챔피언 -> 타워
  allPlayers.forEach(p => {
    if (p.currentHp <= 0 || p.respawnTimer > 0) return;

    const isBlue = match.blueTeam.includes(p);
    const enemyStats = isBlue ? match.stats.red : match.stats.blue;
    const enemyBase = isBlue ? BASES.RED : BASES.BLUE;
    
    const hero = heroes.find(h => h.id === p.heroId);
    if (!hero) return;

    // 아이템 스탯 계산 (실시간)
    const itemAD = p.items.reduce((sum, i) => sum + (i.ad || 0), 0);
    const itemAP = p.items.reduce((sum, i) => sum + (i.ap || 0), 0);
    
    // [자연스러운 성장] 
    // 총 공격력 = (기본AD + 아이템AD) + (주문력의 60% - 마법사도 타워 철거 가능)
    const totalAD = hero.stats.ad + itemAD;
    const structureDmg = totalAD + (itemAP * 0.6);

    // 타워 공격 로직 (정글러도 타워 칠 수 있음)
    const laneKey = p.lane.toLowerCase();
    
    // [중요] 내 라인의 타워를 우선적으로 찾음
    if (p.lane !== 'JUNGLE') {
        const brokenCount = (enemyStats.towers as any)[laneKey];

        if (brokenCount < 3) {
            const targetTier = brokenCount + 1;
            const towerPos = getTowerPos(p.lane, targetTier, !isBlue);
            const dist = getDistance(p, towerPos);

            // 사거리 + 3.0 (타워 크기 고려)
            if (dist <= (hero.stats.range / 100) + 3.0) {
                const tStats = (fieldSettings.towers as any)[`t${targetTier}`];
                const { siegeMod } = applyRoleBonus(p, hero.role, true, [], roleSettings);
                
                // 공성 버프 (거신병)
                const myStats = isBlue ? match.stats.blue : match.stats.red;
                const buffFactor = myStats.activeBuffs.siegeUnit ? 1.3 : 1.0; 

                // [순수 물리 엔진]
                // 타워 방어력 적용 (초반엔 타워 방어력이 높아서 데미지가 적게 들어감)
                // 후반에 영웅 공격력이 높아지면 자연스럽게 뚫림
                let realDmg = calcMitigatedDamage(structureDmg * siegeMod * buffFactor, tStats.armor) * dt;
                
                // 공속 반영 (1.0 기준)
                // (여기서는 dt 기반 시뮬레이션이라 단순화)
                
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
        if (distToNexus <= 14) { 
            const nStats = fieldSettings.towers.nexus;
            const { siegeMod } = applyRoleBonus(p, hero.role, true, [], roleSettings);
            
            const realDmg = calcMitigatedDamage(structureDmg * siegeMod, nStats.armor) * dt;
            enemyStats.nexusHp -= realDmg;
        }
    }
  });

  // 2. [방어] 타워 -> 적 (반격)
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

      lanes.forEach(lane => {
          const laneKey = lane.toLowerCase();
          const brokenCount = (myStats.towers as any)[laneKey];
          
          [1, 2, 3].forEach(tier => {
              if (tier > brokenCount) { 
                  const towerPos = getTowerPos(lane, tier, isBlueDef);
                  const towerStats = (fieldSettings.towers as any)[`t${tier}`];

                  const target = TowerLogic.selectTarget(towerPos, enemies, allies, LOGIC_TOWER_RANGE, match.currentDuration);
                  if (target) {
                      const hasMinions = enemies.minions.some(m => m.hp > 0 && getDistance(m, towerPos) <= LOGIC_TOWER_RANGE);
                      TowerLogic.applyDamage(match, target, towerStats, dt, false, hasMinions, defendingTeam);
                  }
              }
          });
      });

      const nexusPos = isBlueDef ? BASES.BLUE : BASES.RED;
      const nexusStats = fieldSettings.towers.nexus;
      
      const target = TowerLogic.selectTarget(nexusPos, enemies, allies, LOGIC_NEXUS_RANGE, match.currentDuration);
      if (target) {
          const hasMinions = enemies.minions.some(m => m.hp > 0 && getDistance(m, nexusPos) <= LOGIC_NEXUS_RANGE);
          TowerLogic.applyDamage(match, target, nexusStats, dt, true, hasMinions, defendingTeam);
      }
  });
};
