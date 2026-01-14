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
  const settings = useGameStore.getState().gameState.fieldSettings.colossus;
  const stackCount = stats.colossus; 
  const scaleFactor = 1.0 + Math.max(0, stackCount - 1) * 0.1;

  stats.activeBuffs.siegeUnit = true;

  if (!match.minions) match.minions = [];
  const startPos = isBlueTeam ? BASES.BLUE : BASES.RED;
  
  const baseHp = settings.hp || 15000;
  const baseAtk = settings.attack || 300;
  const baseArmor = settings.armor || 100;
  const finalHp = Math.floor(baseHp * scaleFactor);
  const finalAtk = Math.floor(baseAtk * scaleFactor);
  const finalArmor = Math.floor(baseArmor * scaleFactor);

  match.minions.push({
    id: `summoned_colossus_${Date.now()}`,
    type: 'SUMMONED_COLOSSUS',
    team: teamColor,
    lane: 'MID', 
    x: startPos.x, y: startPos.y,
    hp: finalHp, maxHp: finalHp, atk: finalAtk,
    // @ts-ignore
    armor: finalArmor,
    pathIdx: 0
  });

  const upgradeMsg = stackCount > 1 ? ` (Lv.${stackCount} 강화: +${Math.round((scaleFactor-1)*100)}%)` : '';
  match.logs.push({ time: match.currentDuration, message: `🤖 ${teamName} 진영이 거신병을 소환했습니다!${upgradeMsg} 미드 라인으로 진격합니다!`, type: 'COLOSSUS', team: teamColor });
}

export function applyWatcherReward(match: LiveMatch, isBlueTeam: boolean) {
  const teamName = isBlueTeam ? '단테' : '이즈마한';
  const teamColor = isBlueTeam ? 'BLUE' : 'RED';
  
  const allies = isBlueTeam ? match.blueTeam : match.redTeam;
  allies.forEach(p => {
    if (p.currentHp > 0 && p.respawnTimer <= 0) {
        if (!p.buffs.includes('WATCHER_BUFF')) {
            p.buffs.push('WATCHER_BUFF');
        }
    }
  });

  match.logs.push({
    time: match.currentDuration,
    message: `👁️ ${teamName} 진영이 공허의 힘을 얻었습니다! (사망 시 소실)`,
    type: 'WATCHER',
    team: teamColor
  });
}

export const updateNeutralObjectives = (match: LiveMatch, fieldSettings: any, dt: number) => {
    (['colossus', 'watcher'] as const).forEach(type => {
        const obj = match.objectives[type];
        const setting = fieldSettings[type];
        if (!obj || !setting) return;

        // 1. 스폰 로직
        if (obj.status === 'DEAD' && match.currentDuration >= obj.nextSpawnTime) {
            obj.status = 'ALIVE';
            obj.hp = setting.hp;
            obj.maxHp = setting.hp;
            // 부활 시 마지막 공격 시간 초기화
            (obj as any).lastAttackedTime = 0;
            match.logs.push({ time: match.currentDuration, message: `📢 ${type === 'colossus' ? '거신병' : '주시자'}가 전장에 등장했습니다!`, type: 'START' });
        }

        // 2. 살아있을 때 로직 (피격 및 회복)
        if (obj.status === 'ALIVE') {
            const objectivePos = type === 'colossus' ? POI.BARON : POI.DRAGON;
            
            // 주변 15거리 내에 살아있는 영웅이 있는지 확인 (어그로 범위)
            const nearbyHeroes = [...match.blueTeam, ...match.redTeam].filter(p => p.currentHp > 0 && p.respawnTimer <= 0 && getDistance(p, objectivePos) < 15);

            if (nearbyHeroes.length > 0) {
                // [전투 중] 데미지 입음
                const dps = nearbyHeroes.reduce((sum, p) => sum + (p.level * 15) + (p.items.length * 10), 0);
                obj.hp -= dps * dt;
                
                // 마지막 공격 시간 기록
                (obj as any).lastAttackedTime = match.currentDuration;

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
            } else {
                // [비전투 상태] -> 회복(Reset) 로직
                const lastAttacked = (obj as any).lastAttackedTime || 0;
                
                // 마지막 공격으로부터 10초가 지났고, 체력이 깎여있다면
                if (match.currentDuration - lastAttacked > 10 && obj.hp < obj.maxHp) {
                    // 초당 최대 체력의 20%씩 고속 회복
                    const regenAmount = obj.maxHp * 0.2 * dt;
                    obj.hp += regenAmount;
                    
                    if (obj.hp > obj.maxHp) obj.hp = obj.maxHp;
                }
            }
        }
    });
};
