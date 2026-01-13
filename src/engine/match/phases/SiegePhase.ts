import { LiveMatch, Hero, RoleSettings, BattlefieldSettings, BattleSettings } from '../../../types';
import { applyRoleBonus } from '../systems/RoleManager';
import { getDistance, BASES } from '../../data/MapData';
import { TOWER_COORDS } from '../constants/MapConstants';

const calcMitigatedDamage = (rawDmg: number, armor: number) => {
  const reduction = 100 / (100 + armor);
  return rawDmg * reduction;
};

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

  // 1. [플레이어 -> 구조물 공격]
  allPlayers.forEach(p => {
    if (p.currentHp <= 0 || p.respawnTimer > 0) return;

    const isBlue = match.blueTeam.includes(p);
    const enemyStats = isBlue ? match.stats.red : match.stats.blue;
    const enemyBase = isBlue ? BASES.RED : BASES.BLUE;
    
    const hero = heroes.find(h => h.id === p.heroId);
    if (!hero) return;

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
                const rawDmg = hero.stats.ad * siegeMod;
                const realDmg = calcMitigatedDamage(rawDmg, tStats.armor) * dt;
                
                // [안전장치] 초기화 안된 경우
                if (!(enemyStats as any).laneHealth) {
                    (enemyStats as any).laneHealth = { top: tStats.hp, mid: tStats.hp, bot: tStats.hp };
                }
                
                // [핵심] 체력 깎기
                (enemyStats as any).laneHealth[laneKey] -= realDmg;

                // [핵심] 체력 0 이하 시 파괴 처리
                if ((enemyStats as any).laneHealth[laneKey] <= 0) {
                    (enemyStats.towers as any)[laneKey]++;
                    (isBlue ? match.blueTeam : match.redTeam).forEach(m => m.gold += tStats.rewardGold);
                    match.logs.push({ time: Math.floor(match.currentDuration), message: `🔥 [${hero.name}] ${targetTier}차 포탑 철거!`, type: 'TOWER', team: isBlue ? 'BLUE' : 'RED' });
                    
                    // 다음 타워 체력 세팅 (다음 티어 스펙 가져오기)
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
            const realDmg = calcMitigatedDamage(rawDmg, nStats.armor) * dt;

            enemyStats.nexusHp -= realDmg;
        }
    }
  });

  // 2. [구조물 -> 플레이어 방어] (백도어/레이저)
  allPlayers.forEach(p => {
    if (p.currentHp <= 0 || p.respawnTimer > 0) return;
    const isBlue = match.blueTeam.includes(p);
    const enemyStats = isBlue ? match.stats.red : match.stats.blue;
    const enemyMinions = match.minions || [];

    if (p.lane !== 'JUNGLE') {
        const laneKey = p.lane.toLowerCase();
        const brokenCount = (enemyStats.towers as any)[laneKey];
        if (brokenCount < 3) {
            const targetTier = brokenCount + 1;
            const towerPos = getTowerPos(p.lane, targetTier, !isBlue);
            const dist = getDistance(p, towerPos);

            if (dist <= 10) {
                const hasMinion = enemyMinions.some(m => m.team === (isBlue ? 'BLUE' : 'RED') && m.hp > 0 && getDistance(m, towerPos) < 15);
                const tStats = (fieldSettings.towers as any)[`t${targetTier}`];
                let towerDmg = (tStats.atk || 200) * dt;

                if (!hasMinion) towerDmg *= 3.0; // 백도어 패널티

                p.currentHp -= calcMitigatedDamage(towerDmg, p.level * 5 + 30);
            }
        }
    }

    const inhibitorsDown = enemyStats.towers.top >= 3 || enemyStats.towers.mid >= 3 || enemyStats.towers.bot >= 3;
    const enemyBase = isBlue ? BASES.RED : BASES.BLUE;
    const distToNexus = getDistance(p, enemyBase);

    if (distToNexus <= 15) {
        if (!inhibitorsDown) {
            p.currentHp -= 2000 * dt; // 억제기 생존 시 레이저
        } else {
            const nStats = fieldSettings.towers.nexus;
            const nexusDmg = (nStats.atk || 500) * dt;
            p.currentHp -= calcMitigatedDamage(nexusDmg, p.level * 5 + 30);
        }
    }
  });
};
