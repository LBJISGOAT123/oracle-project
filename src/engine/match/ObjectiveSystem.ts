// ==========================================
// FILE PATH: /src/engine/match/ObjectiveSystem.ts
// ==========================================

import { LiveMatch } from '../../types';
import { useGameStore } from '../../store/useGameStore';

/**
 * 거신병 처치 효과
 */
export function applyColossusReward(match: LiveMatch, isBlueTeam: boolean) {
  const teamName = isBlueTeam ? '단테' : '이즈마한';
  const teamColor = isBlueTeam ? 'BLUE' : 'RED';
  const stats = isBlueTeam ? match.stats.blue : match.stats.red;

  stats.activeBuffs.siegeUnit = true;

  match.logs.push({
    time: match.currentDuration,
    message: `🤖 ${teamName} 진영이 거신병을 해킹하여 아군으로 만들었습니다!`,
    type: 'COLOSSUS',
    team: teamColor
  });
}

/**
 * 거신병 공성 로직 (설정된 공격력 반영)
 */
export function processSiegeUnit(match: LiveMatch) {
  // [추가] 설정값 가져오기
  const settings = useGameStore.getState().gameState.fieldSettings;
  // 설정된 공격력 (기본값 50)
  const attackPower = settings?.colossus?.attack || 50;

  // 공격력에 따른 파괴 확률 계산 (공격력 100이면 10% 확률)
  const destroyChance = attackPower / 1000; 

  const processTeamSiege = (isBlueAttacker: boolean) => {
    const attackerStats = isBlueAttacker ? match.stats.blue : match.stats.red;
    const defenderStats = isBlueAttacker ? match.stats.red : match.stats.blue;
    const attackerColor = isBlueAttacker ? 'BLUE' : 'RED';

    if (attackerStats.activeBuffs.siegeUnit) {
      if (Math.random() < destroyChance) {
        const lanes = ['top', 'mid', 'bot'] as const;
        const validLanes = lanes.filter(l => defenderStats.towers[l] < 3);

        if (validLanes.length > 0) {
          const lane = validLanes[Math.floor(Math.random() * validLanes.length)];
          defenderStats.towers[lane]++;
          const tier = defenderStats.towers[lane];
          const laneName = lane === 'top' ? '탑' : lane === 'mid' ? '미드' : '바텀';

          attackerStats.activeBuffs.siegeUnit = false; 

          match.logs.push({
            time: match.currentDuration,
            message: `💥 거신병(공격력 ${attackPower})이 ${laneName} ${tier}차 포탑을 박살냈습니다!`,
            type: 'TOWER',
            team: attackerColor
          });
        } else {
          attackerStats.activeBuffs.siegeUnit = false;
        }
      }
    }
  };

  processTeamSiege(true);
  processTeamSiege(false);
}

/**
 * 주시자 처치 효과 (설정된 버프/지속시간 반영)
 */
export function applyWatcherReward(match: LiveMatch, isBlueTeam: boolean) {
  const settings = useGameStore.getState().gameState.fieldSettings;
  const teamName = isBlueTeam ? '단테' : '이즈마한';
  const teamColor = isBlueTeam ? 'BLUE' : 'RED';
  const stats = isBlueTeam ? match.stats.blue : match.stats.red;

  // 설정값 적용
  const buffDuration = settings?.watcher?.buffDuration || 180;
  const buffType = settings?.watcher?.buffType || 'COMBAT';

  stats.activeBuffs.voidPower = true;
  // [추가] 버프 종료 시간 설정 (현재시간 + 지속시간)
  stats.activeBuffs.voidBuffEndTime = match.currentDuration + buffDuration;

  const team = isBlueTeam ? match.blueTeam : match.redTeam;
  team.forEach(p => {
    if (!p.buffs) p.buffs = [];
    if (!p.buffs.includes('VOID')) p.buffs.push('VOID');
  });

  const buffName = buffType === 'COMBAT' ? '전투력' : '골드 획득량';

  match.logs.push({
    time: match.currentDuration,
    message: `👁️ ${teamName} 진영이 공허의 힘(${buffName} 증가)을 ${buffDuration}초간 흡수했습니다!`,
    type: 'WATCHER',
    team: teamColor
  });
}