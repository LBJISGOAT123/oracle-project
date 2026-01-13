// ==========================================
// FILE PATH: /src/engine/match/systems/ObjectiveSystem.ts
// ==========================================
import { LiveMatch } from '../../../types';
import { useGameStore } from '../../../store/useGameStore';
import { POI, getDistance, BASES } from '../../data/MapData';

export function applyColossusReward(match: LiveMatch, isBlueTeam: boolean) {
  const teamName = isBlueTeam ? '단테' : '이즈마한';
  const teamColor = isBlueTeam ? 'BLUE' : 'RED';
  const stats = isBlueTeam ? match.stats.blue : match.stats.red;

  stats.activeBuffs.siegeUnit = true;

  if (!match.minions) match.minions = [];
  
  const startPos = isBlueTeam ? BASES.BLUE : BASES.RED;
  
  match.minions.push({
    id: `summoned_colossus_${Date.now()}`,
    type: 'SUMMONED_COLOSSUS',
    team: teamColor,
    lane: 'MID', 
    x: startPos.x, 
    y: startPos.y,
    hp: 15000, 
    maxHp: 15000, 
    atk: 300,
    pathIdx: 0
  });

  match.logs.push({ 
    time: match.currentDuration, 
    message: `🤖 ${teamName} 진영이 거신병을 소환했습니다! 미드 라인으로 진격합니다!`, 
    type: 'COLOSSUS', 
    team: teamColor 
  });
}

export function applyWatcherReward(match: LiveMatch, isBlueTeam: boolean) {
  const settings = useGameStore.getState().gameState.fieldSettings;
  const teamName = isBlueTeam ? '단테' : '이즈마한';
  const teamColor = isBlueTeam ? 'BLUE' : 'RED';
  const stats = isBlueTeam ? match.stats.blue : match.stats.red;

  const buffDuration = settings?.watcher?.buffDuration || 180;

  stats.activeBuffs.voidPower = true;
  stats.activeBuffs.voidBuffEndTime = match.currentDuration + buffDuration;

  match.logs.push({
    time: match.currentDuration,
    message: `👁️ ${teamName} 진영이 공허의 힘을 얻었습니다!`,
    type: 'WATCHER',
    team: teamColor
  });
}

export const updateNeutralObjectives = (match: LiveMatch, fieldSettings: any, dt: number) => {
    (['colossus', 'watcher'] as const).forEach(type => {
        const obj = match.objectives[type];
        const setting = fieldSettings[type];
        if (!obj || !setting) return;

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

        if (obj.status === 'ALIVE') {
            const objectivePos = type === 'colossus' ? POI.BARON : POI.DRAGON;
            const nearbyHeroes = [...match.blueTeam, ...match.redTeam].filter(p => 
                p.currentHp > 0 && p.respawnTimer <= 0 && getDistance(p, objectivePos) < 15
            );

            if (nearbyHeroes.length > 0) {
                const dps = nearbyHeroes.reduce((sum, p) => sum + (p.level * 15) + (p.items.length * 10), 0);
                obj.hp -= dps * dt;

                if (obj.hp <= 0) {
                    obj.status = 'DEAD';
                    obj.nextSpawnTime = match.currentDuration + (setting.respawnTime || 300);

                    const blueCnt = nearbyHeroes.filter(p => match.blueTeam.includes(p)).length;
                    const redCnt = nearbyHeroes.length - blueCnt;
                    const isBlueWin = blueCnt >= redCnt;

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
