// ==========================================
// FILE PATH: /src/engine/match/phases/SiegePhase.ts
// ==========================================
import { LiveMatch, Hero, RoleSettings, BattlefieldSettings, BattleSettings, LivePlayer } from '../../../types';
// [경로 수정됨] systems 폴더 참조
import { applyRoleBonus } from '../systems/RoleManager';
import { getDistance, BASES } from '../../data/MapData';

// 타워의 대략적인 좌표를 계산하는 헬퍼 함수
const getTowerPos = (lane: string, tier: number, isBlueSide: boolean) => {
  // 맵 크기 100x100 기준
  // tier 1: 전선 최전방, tier 3: 본진 입구

  // 라인별 좌표 계수 설정
  let start = isBlueSide ? { x: 5, y: 95 } : { x: 95, y: 5 }; // 본진
  let end = isBlueSide ? { x: 95, y: 5 } : { x: 5, y: 95 };   // 적진

  // 탑/봇은 꺾이는 지점 고려 (간단히 직선상의 지점으로 근사화하여 판정)
  // 실제로는 MapData의 Path를 따라가야 정확하지만, 여기서는 공성 판정용 근사치 사용

  let ratio = 0;
  // 적 타워를 공격하는 것이므로, 내 진영에서 얼마나 먼지를 계산
  // 1차 타워: 맵의 50% 지점 부근, 2차: 75%, 3차: 90% (본진 앞)
  if (tier === 1) ratio = 0.5;
  if (tier === 2) ratio = 0.75;
  if (tier === 3) ratio = 0.9;

  if (!isBlueSide) {
      // 레드팀 입장에서 블루팀 타워 공격 시 비율 반전 아님 (출발점이 다르므로 로직 동일)
      // 단, start/end가 바뀌었으므로 보간법만 적용하면 됨
  }

  // 탑/봇/미드에 따른 좌표 보정
  let tx = start.x + (end.x - start.x) * ratio;
  let ty = start.y + (end.y - start.y) * ratio;

  if (lane === 'TOP') {
      if (isBlueSide) ty = 10; // 위쪽 벽
      else tx = 10;
  } else if (lane === 'BOT') {
      if (isBlueSide) tx = 90; // 오른쪽 벽
      else ty = 90;
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
  // 타워/넥서스 스탯 설정
  const towerHp = fieldSettings.tower?.hp || 5000;
  const towerGold = fieldSettings.tower?.rewardGold || 150;

  // 모든 살아있는 플레이어에 대해 공성 판정
  const allPlayers = [...match.blueTeam, ...match.redTeam];

  allPlayers.forEach(p => {
    if (p.currentHp <= 0 || p.respawnTimer > 0) return;

    const isBlue = match.blueTeam.includes(p);
    const enemyStats = isBlue ? match.stats.red : match.stats.blue;
    const enemyBase = isBlue ? BASES.RED : BASES.BLUE;
    const teamName = isBlue ? 'BLUE' : 'RED';
    const enemyName = isBlue ? 'RED' : 'BLUE';

    const hero = heroes.find(h => h.id === p.heroId);
    if (!hero) return;

    // 1. 넥서스 공성 (적 본진 근처인가?)
    const distToNexus = getDistance(p, enemyBase);

    // 넥서스 공격 가능 범위 (사거리 + 5)
    if (distToNexus <= (hero.stats.range / 100 * 2) + 5) {
        // 모든 억제기(3차 타워)가 밀렸는지 체크 (간소화: 하나라도 밀리면 공격 가능)
        const openLanes = ['top', 'mid', 'bot'].filter(l => (enemyStats.towers as any)[l] >= 3);

        if (openLanes.length > 0) {
            // [공격 실행]
            const { siegeMod } = applyRoleBonus(p, hero.role, true, [], roleSettings);
            let dmg = hero.stats.ad * siegeMod * dt;

            // 거신병 버프 있으면 2배
            if ((isBlue ? match.stats.blue : match.stats.red).activeBuffs.siegeUnit) {
                dmg *= 2.0;
            }

            enemyStats.nexusHp -= dmg;

            // 가끔 로그 출력
            if (Math.random() < 0.01) {
                match.logs.push({
                    time: Math.floor(match.currentDuration),
                    message: `🏰 [${hero.name}] 넥서스 타격! (남은 HP: ${Math.floor(enemyStats.nexusHp)})`,
                    type: 'TOWER',
                    team: teamName as 'BLUE'|'RED'
                });
            }

            // 게임 종료 조건은 MatchUpdater나 CoreEngine에서 체크함
            return; 
        }
    }

    // 2. 타워 공성 (현재 라인의 타워)
    if (p.lane !== 'JUNGLE') {
        const lane = p.lane.toLowerCase(); // top, mid, bot
        const brokenCount = (enemyStats.towers as any)[lane];

        // 아직 파괴되지 않은 다음 타워 (1~3차)
        if (brokenCount < 3) {
            const targetTier = brokenCount + 1;
            const towerPos = getTowerPos(p.lane, targetTier, isBlue);
            const distToTower = getDistance(p, towerPos);

            // 타워 사거리 내 접근
            if (distToTower <= 8) {
                const { siegeMod } = applyRoleBonus(p, hero.role, true, [], roleSettings);
                let dmg = hero.stats.ad * siegeMod * dt;

                // [중요] 타워 HP가 데이터 구조에 없으므로, 확률적 파괴 로직을 "데미지 누적"처럼 사용
                // (데미지 / 타워총체력) 확률로 파괴 카운트 증가
                // 예: 타워체력 5000, 데미지 500 -> 10% 확률로 파괴 (즉 10초 때리면 깨짐)
                // 이를 통해 HP를 깎는 것과 통계적으로 동일한 효과를 냄.

                const destroyChance = dmg / towerHp;

                if (Math.random() < destroyChance) {
                    (enemyStats.towers as any)[lane]++;

                    // 보상 지급 (팀 전원)
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