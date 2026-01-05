// ==========================================
// FILE PATH: /src/engine/match/phases/SiegePhase.ts
// ==========================================
import { LiveMatch, Hero, RoleSettings, BattlefieldSettings, BattleSettings } from '../../../types';
import { applyRoleBonus } from '../systems/RoleManager';
import { getDistance, BASES } from '../../data/MapData';

// 타워의 대략적인 좌표를 계산하는 헬퍼 함수
const getTowerPos = (lane: string, tier: number, isBlueSide: boolean) => {
  let start = isBlueSide ? { x: 5, y: 95 } : { x: 95, y: 5 }; // 본진
  let end = isBlueSide ? { x: 95, y: 5 } : { x: 5, y: 95 };   // 적진

  let ratio = 0;
  // 1차: 50%, 2차: 75%, 3차: 90% 지점
  if (tier === 1) ratio = 0.5;
  if (tier === 2) ratio = 0.75;
  if (tier === 3) ratio = 0.9;

  let tx = start.x + (end.x - start.x) * ratio;
  let ty = start.y + (end.y - start.y) * ratio;

  // 탑/봇은 직선이 아니므로 좌표 보정
  if (lane === 'TOP') {
      if (isBlueSide) ty = 10; else tx = 10;
  } else if (lane === 'BOT') {
      if (isBlueSide) tx = 90; else ty = 90;
  }

  return { x: tx, y: ty };
};

export const processSiegePhase = (
  match: LiveMatch, 
  heroes: Hero[], 
  fieldSettings: BattlefieldSettings,
  roleSettings: RoleSettings, 
  battleSettings: BattleSettings, 
  dt: number
) => {
  // [밸런스 수정 1] 타워 내구도 기본값 대폭 상향 (5,000 -> 30,000)
  // 사용자가 설정을 건드리지 않았을 때도 게임이 길어지도록 안전장치 적용
  const towerHp = fieldSettings.tower?.hp || 30000;
  const towerGold = fieldSettings.tower?.rewardGold || 150;

  const allPlayers = [...match.blueTeam, ...match.redTeam];

  allPlayers.forEach(p => {
    // 죽은 유저는 공성 불가
    if (p.currentHp <= 0 || p.respawnTimer > 0) return;

    const isBlue = match.blueTeam.includes(p);
    const enemyStats = isBlue ? match.stats.red : match.stats.blue;
    const enemyBase = isBlue ? BASES.RED : BASES.BLUE;
    const teamName = isBlue ? 'BLUE' : 'RED';
    const enemyName = isBlue ? 'RED' : 'BLUE';

    const hero = heroes.find(h => h.id === p.heroId);
    if (!hero) return;

    // 1. 넥서스 공성 로직
    const distToNexus = getDistance(p, enemyBase);
    
    // 사거리 내에 넥서스가 있는가?
    if (distToNexus <= (hero.stats.range / 100 * 2) + 5) {
        // 억제기(3차 타워)가 하나라도 밀려야 넥서스 타격 가능
        const openLanes = ['top', 'mid', 'bot'].filter(l => (enemyStats.towers as any)[l] >= 3);

        if (openLanes.length > 0) {
            const { siegeMod } = applyRoleBonus(p, hero.role, true, [], roleSettings);
            
            // [밸런스 수정 2] 건물 방어력 적용 (데미지 40%만 적용)
            // 건물은 방어력이 높다는 컨셉을 위해 데미지 계수를 0.4로 설정
            let dmg = hero.stats.ad * siegeMod * 1.5 * dt;

            // 거신병 버프 효과 (기존 2.0배 -> 1.5배로 하향 조정)
            if ((isBlue ? match.stats.blue : match.stats.red).activeBuffs.siegeUnit) {
                dmg *= 3.0;
            }

            enemyStats.nexusHp -= dmg;

            // 로그는 너무 자주 뜨지 않게 확률적으로 기록
            if (Math.random() < 0.01) {
                match.logs.push({
                    time: Math.floor(match.currentDuration),
                    message: `🏰 [${hero.name}] 넥서스 타격! (남은 HP: ${Math.floor(enemyStats.nexusHp)})`,
                    type: 'TOWER',
                    team: teamName as 'BLUE'|'RED'
                });
            }
            return; 
        }
    }

    // 2. 타워 공성 로직
    if (p.lane !== 'JUNGLE') {
        const lane = p.lane.toLowerCase(); // top, mid, bot
        const brokenCount = (enemyStats.towers as any)[lane];

        // 아직 파괴되지 않은 타워가 있다면
        if (brokenCount < 3) {
            const targetTier = brokenCount + 1;
            const towerPos = getTowerPos(p.lane, targetTier, isBlue);
            const distToTower = getDistance(p, towerPos);

            // 타워 사거리 내 접근 (약 8.0 거리)
            if (distToTower <= 8) {
                const { siegeMod } = applyRoleBonus(p, hero.role, true, [], roleSettings);
                
                // [밸런스 수정 3] 타워 데미지 공식 (40%만 적용)
                let dmg = hero.stats.ad * siegeMod * 0.4 * dt;

                // [밸런스 수정 4] 파괴 확률 계산
                // 타워 HP가 30,000일 때, 데미지가 300이면 확률은 1% (틱당)
                // 즉, 혼자서 30,000 데미지를 누적시켜야 깨지는 것과 통계적으로 동일함
                const destroyChance = (dmg * 5) / towerHp;

                if (Math.random() < destroyChance) {
                    // 타워 파괴 확정
                    (enemyStats.towers as any)[lane]++;

                    // 글로벌 골드 지급
                    (isBlue ? match.blueTeam : match.redTeam).forEach(member => member.gold += towerGold);

                    match.logs.push({
                        time: Math.floor(match.currentDuration),
                        message: `🔨 [${hero.name}] ${enemyName}팀의 ${lane.toUpperCase()} ${targetTier}차 포탑 파괴!`,
                        type: 'TOWER',
                        team: teamName as 'BLUE'|'RED'
                    });
                }
            }
        }
    }
  });
};