// ==========================================
// FILE PATH: /src/engine/match/systems/ObjectiveSystem.ts
// ==========================================
import { LiveMatch } from '../../../types';
import { POI, getDistance, BASES } from '../../data/MapData';

// [거신병 보상]
export function applyColossusReward(match: LiveMatch, isBlueTeam: boolean) {
  const teamName = isBlueTeam ? '단테' : '이즈마한';
  const teamCode = isBlueTeam ? 'BLUE' : 'RED';
  
  const stats = isBlueTeam ? match.stats.blue : match.stats.red;
  stats.colossus++;
  const scaleFactor = 1.0 + (stats.colossus * 0.2); 
  stats.activeBuffs.siegeUnit = true;

  if (!match.minions) match.minions = [];
  const startPos = isBlueTeam ? BASES.BLUE : BASES.RED;
  
  const finalHp = Math.floor(15000 * scaleFactor);
  const finalAtk = Math.floor(300 * scaleFactor);
  const finalArmor = Math.floor(100 * scaleFactor);

  match.minions.push({
    id: `summoned_colossus_${Date.now()}`,
    type: 'SUMMONED_COLOSSUS',
    team: teamCode,
    lane: 'MID', 
    x: startPos.x, y: startPos.y,
    hp: finalHp, maxHp: finalHp, atk: finalAtk,
    // @ts-ignore
    armor: finalArmor, pathIdx: 0
  });

  match.logs.push({ 
    time: Math.floor(match.currentDuration), 
    message: `🤖 [거신병] ${teamName} 팀이 거신병을 소환했습니다!`, 
    type: 'COLOSSUS', team: teamCode 
  });
  
  // [수정] 전역 알림(setAnnouncement) 제거 -> 관전 화면에서 로그를 보고 띄우도록 변경
}

// [주시자 보상]
export function applyWatcherReward(match: LiveMatch, isBlueTeam: boolean) {
  const teamName = isBlueTeam ? '단테' : '이즈마한';
  const teamCode = isBlueTeam ? 'BLUE' : 'RED';

  const stats = isBlueTeam ? match.stats.blue : match.stats.red;
  stats.watcher++;
  
  const allies = isBlueTeam ? match.blueTeam : match.redTeam;
  allies.forEach(p => {
    if (p.currentHp > 0 && p.respawnTimer <= 0) {
        if (!p.buffs.includes('WATCHER_BUFF')) {
            p.buffs.push('WATCHER_BUFF');
        }
    }
  });

  match.logs.push({
    time: Math.floor(match.currentDuration),
    message: `👁️ [주시자] ${teamName} 팀이 공허의 힘을 획득했습니다!`,
    type: 'WATCHER',
    team: teamCode
  });

  // [수정] 전역 알림(setAnnouncement) 제거
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
            (obj as any).lastAttackedTime = 0;
            
            match.logs.push({ 
                time: Math.floor(match.currentDuration), 
                message: `📢 ${type === 'colossus' ? '거신병' : '주시자'}가 전장에 등장했습니다!`, 
                type: 'START' 
            });
        }

        // 2. 전투 로직
        if (obj.status === 'ALIVE') {
            const objectivePos = type === 'colossus' ? POI.BARON : POI.DRAGON;
            
            const nearbyHeroes = [...match.blueTeam, ...match.redTeam].filter(p => 
                p.currentHp > 0 && p.respawnTimer <= 0 && getDistance(p, objectivePos) < 12
            );

            if (nearbyHeroes.length > 0) {
                let blueDmg = 0;
                let redDmg = 0;

                nearbyHeroes.forEach(p => {
                    const dmg = (p.level * 30) + (p.items.length * 20); 
                    if (match.blueTeam.includes(p)) blueDmg += dmg;
                    else redDmg += dmg;
                });

                const totalDmgTick = (blueDmg + redDmg) * dt;
                
                const damagePerHero = (setting.attack || 50) * dt;
                nearbyHeroes.forEach(h => { h.currentHp -= damagePerHero; });
                (obj as any).lastAttackedTime = match.currentDuration;

                if (obj.hp <= totalDmgTick) {
                    obj.hp = 0;
                    obj.status = 'DEAD';
                    obj.nextSpawnTime = match.currentDuration + (setting.respawnTime || 300);

                    const totalDps = blueDmg + redDmg;
                    if (totalDps > 0) {
                        const blueChance = blueDmg / totalDps;
                        const isBlueWin = Math.random() < blueChance;
                        
                        if (type === 'colossus') applyColossusReward(match, isBlueWin);
                        else applyWatcherReward(match, isBlueWin);
                    } else {
                        const blueCnt = nearbyHeroes.filter(p => match.blueTeam.includes(p)).length;
                        if (type === 'colossus') applyColossusReward(match, blueCnt > 0);
                        else applyWatcherReward(match, blueCnt > 0);
                    }
                } else {
                    obj.hp -= totalDmgTick;
                }
            } else {
                const lastAttacked = (obj as any).lastAttackedTime || 0;
                if (match.currentDuration - lastAttacked > 10 && obj.hp < obj.maxHp) {
                    obj.hp += obj.maxHp * 0.1 * dt; 
                    if (obj.hp > obj.maxHp) obj.hp = obj.maxHp;
                }
            }
        }
    });
};
