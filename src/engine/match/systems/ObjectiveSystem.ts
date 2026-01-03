// ==========================================
// FILE PATH: /src/engine/match/systems/ObjectiveSystem.ts
// ==========================================
import { LiveMatch } from '../../../types';
import { useGameStore } from '../../../store/useGameStore';
import { POI, getDistance } from '../../data/MapData';

/**
 * 1. 거신병 처치 보상 적용 (버프 부여)
 */
export function applyColossusReward(match: LiveMatch, isBlueTeam: boolean) {
  const teamName = isBlueTeam ? '단테' : '이즈마한';
  const teamColor = isBlueTeam ? 'BLUE' : 'RED';
  const stats = isBlueTeam ? match.stats.blue : match.stats.red;

  stats.activeBuffs.siegeUnit = true;

  match.logs.push({ 
    time: match.currentDuration, 
    message: `🤖 ${teamName} 진영이 거신병을 해킹했습니다! (공성 강화)`, 
    type: 'COLOSSUS', 
    team: teamColor 
  });
}

/**
 * 2. 주시자 처치 보상 적용 (버프 부여)
 */
export function applyWatcherReward(match: LiveMatch, isBlueTeam: boolean) {
  const settings = useGameStore.getState().gameState.fieldSettings;
  const teamName = isBlueTeam ? '단테' : '이즈마한';
  const teamColor = isBlueTeam ? 'BLUE' : 'RED';
  const stats = isBlueTeam ? match.stats.blue : match.stats.red;

  // 설정값 적용
  const buffDuration = settings?.watcher?.buffDuration || 180;

  stats.activeBuffs.voidPower = true;
  stats.activeBuffs.voidBuffEndTime = match.currentDuration + buffDuration;

  match.logs.push({
    time: match.currentDuration,
    message: `👁️ ${teamName} 진영이 공허의 힘을 얻었습니다! (전투력 상승)`,
    type: 'WATCHER',
    team: teamColor
  });
}

/**
 * 3. [구버전 호환용] 거신병 공성 로직
 * *중요*: 실제 공성 로직은 'phases/SiegePhase.ts'로 이동했습니다.
 * 이 함수는 혹시 모를 호출 에러를 방지하기 위해 빈 껍데기로 남겨둡니다.
 */
export function processSiegeUnit(match: LiveMatch) {
  // 아무것도 하지 않음 (SiegePhase.ts에서 처리함)
}

/**
 * 4. 중립 오브젝트(거신병, 주시자) 상태 업데이트 (스폰 및 데미지 처리)
 * MatchUpdater에서 호출됨
 */
export const updateNeutralObjectives = (match: LiveMatch, fieldSettings: any, dt: number) => {
    (['colossus', 'watcher'] as const).forEach(type => {
        const obj = match.objectives[type];
        const setting = fieldSettings[type];
        if (!obj || !setting) return;

        // 1) 스폰 타이밍 체크
        if (obj.status === 'DEAD' && match.currentDuration >= obj.nextSpawnTime) {
            obj.status = 'ALIVE';
            obj.hp = setting.hp;
            obj.maxHp = setting.hp;
            match.logs.push({ 
                time: match.currentDuration, 
                message: `📢 ${type === 'colossus' ? '거신병' : '주시자'}가 전장에 등장했습니다!`, 
                type: 'START' 
            });
        }

        // 2) 사냥 로직 (주변 영웅에 의한 데미지 처리)
        if (obj.status === 'ALIVE') {
            const objectivePos = type === 'colossus' ? POI.BARON : POI.DRAGON;

            // 근처(반경 15)에 있는 살아있는 영웅 찾기
            const nearbyHeroes = [...match.blueTeam, ...match.redTeam].filter(p => 
                p.currentHp > 0 && p.respawnTimer <= 0 && getDistance(p, objectivePos) < 15
            );

            if (nearbyHeroes.length > 0) {
                // 초당 데미지 계산 (단순화: 레벨 * 15 + 아이템수 * 10)
                const dps = nearbyHeroes.reduce((sum, p) => sum + (p.level * 15) + (p.items.length * 10), 0);
                obj.hp -= dps * dt;

                // 처치됨
                if (obj.hp <= 0) {
                    obj.status = 'DEAD';
                    obj.nextSpawnTime = match.currentDuration + (setting.respawnTime || 300);

                    // 막타 팀 판정 (주변에 더 많은 팀원이 있는 쪽이 획득)
                    const blueCnt = nearbyHeroes.filter(p => match.blueTeam.includes(p)).length;
                    const redCnt = nearbyHeroes.length - blueCnt;
                    const isBlueWin = blueCnt >= redCnt; // 동점이면 블루 우선(운)

                    if (type === 'colossus') {
                        match.stats[isBlueWin ? 'blue' : 'red'].colossus++;
                        applyColossusReward(match, isBlueWin);
                    } else {
                        match.stats[isBlueWin ? 'blue' : 'red'].watcher++;
                        applyWatcherReward(match, isBlueWin);
                    }
                }
            }
        }
    });
};