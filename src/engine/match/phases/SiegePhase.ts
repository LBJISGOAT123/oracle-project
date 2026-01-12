import { LiveMatch, Hero, RoleSettings, BattlefieldSettings, BattleSettings } from '../../../types';
import { applyRoleBonus } from '../systems/RoleManager';
import { getDistance, BASES } from '../../data/MapData';
// [수정 완료] 경로 깊이 수정: ../../../ (src 폴더로 이동)
import { TOWER_COORDS } from '../../../components/battle/spectate/map/MapConstants';

// 데미지 감소 공식 (방어력 적용)
const calcMitigatedDamage = (rawDmg: number, armor: number) => {
  const reduction = 100 / (100 + armor);
  return rawDmg * reduction;
};

// 타워 좌표 찾기
const getTowerPos = (lane: string, tier: number, isBlueSide: boolean) => {
  const teamCoords = isBlueSide ? TOWER_COORDS.BLUE : TOWER_COORDS.RED;
  const laneKey = lane.toUpperCase();
  // @ts-ignore
  if (teamCoords[laneKey] && teamCoords[laneKey][tier - 1]) {
    // @ts-ignore
    return teamCoords[laneKey][tier - 1];
  }
  return isBlueSide ? BASES.BLUE : BASES.RED;
};

export const processSiegePhase = (
  match: LiveMatch, 
  heroes: Hero[], 
  fieldSettings: BattlefieldSettings,
  roleSettings: RoleSettings, 
  battleSettings: BattleSettings, 
  dt: number
) => {
  const towerStats = fieldSettings.tower || { hp: 30000, armor: 100, rewardGold: 150 };
  const towerAtk = 200; 
  
  const guardianStats = {
    hp: battleSettings.izman.guardianHp || 25000,
    atk: battleSettings.izman.towerAtk || 300,
    armor: 150
  };

  const allPlayers = [...match.blueTeam, ...match.redTeam];

  allPlayers.forEach(p => {
    if (p.currentHp <= 0 || p.respawnTimer > 0) return;

    const isBlue = match.blueTeam.includes(p);
    const enemyStats = isBlue ? match.stats.red : match.stats.blue;
    const enemyBase = isBlue ? BASES.RED : BASES.BLUE;
    const teamName = isBlue ? 'BLUE' : 'RED';
    
    const hero = heroes.find(h => h.id === p.heroId);
    if (!hero) return;

    // 1. 타워 공성
    if (p.lane !== 'JUNGLE') {
        const laneKey = p.lane.toLowerCase();
        const brokenCount = (enemyStats.towers as any)[laneKey];

        if (brokenCount < 3) {
            const targetTier = brokenCount + 1;
            const towerPos = getTowerPos(p.lane, targetTier, !isBlue);
            const dist = getDistance(p, towerPos);

            if (dist <= 10) {
                // 타워 반격
                const towerDmg = calcMitigatedDamage(towerAtk, p.level * 5 + 30) * dt; 
                p.currentHp -= towerDmg;

                // 타워 공격
                const { siegeMod } = applyRoleBonus(p, hero.role, true, [], roleSettings);
                const rawDmg = hero.stats.ad * siegeMod;
                const realDmg = calcMitigatedDamage(rawDmg, towerStats.armor) * dt;
                const destroyProb = realDmg / towerStats.hp;

                if (Math.random() < destroyProb) {
                    (enemyStats.towers as any)[laneKey]++;
                    (isBlue ? match.blueTeam : match.redTeam).forEach(m => m.gold += towerStats.rewardGold);
                    
                    match.logs.push({
                        time: Math.floor(match.currentDuration),
                        message: `🔥 [${hero.name}] ${targetTier}차 포탑 철거!`,
                        type: 'TOWER',
                        team: teamName as any
                    });
                }
            }
        }
    }

    // 2. 넥서스 공성
    const inhibitorsDown = 
      enemyStats.towers.top >= 3 || 
      enemyStats.towers.mid >= 3 || 
      enemyStats.towers.bot >= 3;

    if (inhibitorsDown) {
        const distToNexus = getDistance(p, enemyBase);
        if (distToNexus <= 12) { 
            // 넥서스 반격
            const guardianDmg = calcMitigatedDamage(guardianStats.atk, p.level * 5 + 50) * dt;
            p.currentHp -= guardianDmg;

            // 넥서스 공격
            const { siegeMod } = applyRoleBonus(p, hero.role, true, [], roleSettings);
            const myStats = isBlue ? match.stats.blue : match.stats.red;
            const buffFactor = myStats.activeBuffs.siegeUnit ? 2.5 : 1.0;

            const rawDmg = hero.stats.ad * siegeMod * buffFactor;
            const realDmg = calcMitigatedDamage(rawDmg, guardianStats.armor) * dt;

            enemyStats.nexusHp -= realDmg;

            if (Math.random() < 0.02) {
                match.logs.push({
                    time: Math.floor(match.currentDuration),
                    message: `⚔️ [${hero.name}] 수호자 타격 중!`,
                    type: 'TOWER',
                    team: teamName as any
                });
            }
        }
    }
  });
};
