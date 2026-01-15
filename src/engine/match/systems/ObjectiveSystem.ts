// ==========================================
// FILE PATH: /src/engine/match/systems/ObjectiveSystem.ts
// ==========================================
import { LiveMatch } from '../../../types';
import { useGameStore } from '../../../store/useGameStore';
import { POI, getDistance, BASES } from '../../data/MapData';

// [거신병 보상]
export function applyColossusReward(match: LiveMatch, isBlueTeam: boolean) {
  const teamName = isBlueTeam ? '단테' : '이즈마한';
  const teamColor = isBlueTeam ? '#58a6ff' : '#e84057';
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

  // 알림 트리거
  useGameStore.getState().setAnnouncement({
      type: 'OBJECTIVE',
      title: '거신병 해킹 성공!',
      subtext: `${teamName} 진영이 거신병을 해킹하여 소환했습니다.`,
      color: teamColor,
      duration: 5.0,
      createdAt: Date.now()
  });
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

  // 알림 트리거
  useGameStore.getState().setAnnouncement({
      type: 'OBJECTIVE',
      title: '심연의 주시자 처치!',
      subtext: `${teamName} 진영이 주시자를 처형하고 공허의 힘을 흡수합니다!`,
      color: '#f1c40f',
      duration: 5.0,
      createdAt: Date.now()
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
            
            // 주변 12거리 내의 살아있는 영웅들 탐색
            const nearbyHeroes = [...match.blueTeam, ...match.redTeam].filter(p => 
                p.currentHp > 0 && p.respawnTimer <= 0 && getDistance(p, objectivePos) < 12
            );

            if (nearbyHeroes.length > 0) {
                // 팀별 DPS 계산
                let blueDmg = 0;
                let redDmg = 0;

                nearbyHeroes.forEach(p => {
                    const dmg = (p.level * 30) + (p.items.length * 20); // 대략적인 영웅 DPS
                    if (match.blueTeam.includes(p)) blueDmg += dmg;
                    else redDmg += dmg;
                });

                // 총 데미지 (이번 틱)
                const totalDmgTick = (blueDmg + redDmg) * dt;
                
                // [오브젝트 반격]
                const damagePerHero = (setting.attack || 50) * dt;
                nearbyHeroes.forEach(h => { h.currentHp -= damagePerHero; });
                (obj as any).lastAttackedTime = match.currentDuration;

                // [처치 판정]
                // 이번 틱 데미지로 죽는가?
                if (obj.hp <= totalDmgTick) {
                    obj.hp = 0;
                    obj.status = 'DEAD';
                    obj.nextSpawnTime = match.currentDuration + (setting.respawnTime || 300);

                    // [핵심 수정] 머릿수가 아니라 "데미지 비중"으로 확률적 막타 판정
                    // (스틸의 묘미를 살리기 위해, 데미지가 쎈 쪽이 확률이 높음)
                    const totalDps = blueDmg + redDmg;
                    if (totalDps > 0) {
                        const blueChance = blueDmg / totalDps;
                        const isBlueWin = Math.random() < blueChance;
                        
                        if (type === 'colossus') applyColossusReward(match, isBlueWin);
                        else applyWatcherReward(match, isBlueWin);
                    } else {
                        // 만약 둘다 0데미지라면(그럴리 없겠지만), 머릿수로 fallback
                        const blueCnt = nearbyHeroes.filter(p => match.blueTeam.includes(p)).length;
                        if (type === 'colossus') applyColossusReward(match, blueCnt > 0);
                        else applyWatcherReward(match, blueCnt > 0);
                    }
                } else {
                    // 안 죽었으면 체력 감소
                    obj.hp -= totalDmgTick;
                }
            } else {
                // [리셋] 비전투 시 회복
                const lastAttacked = (obj as any).lastAttackedTime || 0;
                if (match.currentDuration - lastAttacked > 10 && obj.hp < obj.maxHp) {
                    obj.hp += obj.maxHp * 0.1 * dt; 
                    if (obj.hp > obj.maxHp) obj.hp = obj.maxHp;
                }
            }
        }
    });
};
