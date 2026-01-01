// === FILE: /src/engine/match/MatchUpdater.ts ===

// ==========================================
// FILE PATH: /src/engine/match/MatchUpdater.ts
// ==========================================
import { Hero, LiveMatch } from '../../types';
import { userPool } from '../UserManager';
import { processDraftTurn } from './BanPickEngine'; 
import { useGameStore } from '../../store/useGameStore';
import { applyColossusReward, applyWatcherReward } from './ObjectiveSystem';
import { attemptBuyItem } from './ItemManager';
import { processCombatPhase } from './phases/CombatPhase';
import { processSiegePhase } from './phases/SiegePhase';
import { processGrowthPhase } from './phases/GrowthPhase';

export function updateLiveMatches(matches: LiveMatch[], heroes: Hero[], delta: number): LiveMatch[] {
  const state = useGameStore.getState();
  if (!state || !state.gameState) return matches;

  const { fieldSettings, battleSettings, roleSettings } = state.gameState;
  const shopItems = state.shopItems || []; 

  const safeField = fieldSettings || { 
    colossus: { hp: 8000, armor: 80, rewardGold: 100, respawnTime: 300 }, 
    watcher: { hp: 12000, armor: 100, rewardGold: 150, respawnTime: 420, buffType: 'COMBAT', buffAmount: 20 }
  };
  const watcherBuffType = safeField.watcher?.buffType || 'COMBAT';
  const watcherBuffAmount = (safeField.watcher?.buffAmount || 20) / 100;

  return matches.map(m => {
    // 딥카피 (React 리렌더링 감지용)
    const match = { ...m, logs: [...m.logs], blueTeam: [...m.blueTeam], redTeam: [...m.redTeam] };

    // [안전장치 추가] 밴픽/게임 로직 중 에러 발생 시 해당 매치만 건너뛰고 진행
    try {
        // 1. 드래프트 로직
        if (match.status === 'DRAFTING') {
            if (!match.draft) return match;
            match.draft.timer -= delta;
            
            if (match.draft.timer <= 0) {
                const turn = match.draft.turnIndex;
                let currentUserIq = 50; 
                
                // 픽 순서가 되었을 때, 해당 유저의 지능(IQ)을 가져옴
                if (turn >= 10) { 
                    const pickIdx = turn - 10;
                    const isBlue = pickIdx % 2 === 0;
                    const teamIdx = Math.floor(pickIdx / 2);
                    const player = isBlue ? match.blueTeam[teamIdx] : match.redTeam[teamIdx];
                    
                    // player가 undefined일 경우를 대비
                    if (player) {
                        const user = userPool.find(u => u.name === player.name);
                        if (user) currentUserIq = user.brain;
                    }
                }

                // 밴픽 처리 실행 (에러 발생 가능 지점)
                processDraftTurn(match, heroes, currentUserIq);
                
                match.draft.turnIndex++;
                match.draft.timer = 1.0; // 밴픽 사이 딜레이

                // 밴픽 종료 조건 (20턴: 10밴 + 10픽)
                if (match.draft.turnIndex >= 20) {
                    match.status = 'PLAYING';
                    match.logs = [...match.logs, { time: 0, message: "밴픽 종료. 전장에 오신 것을 환영합니다.", type: 'START' }];
                    
                    // 영웅 스탯 초기화
                    [...match.blueTeam, ...match.redTeam].forEach(p => {
                        if (!p.heroId) return; // 픽 실패 시 건너뜀
                        const h = heroes.find(x => x.id === p.heroId);
                        if (h) { p.maxHp = h.stats.hp; p.currentHp = h.stats.hp; }
                    });
                }
            }
            return match;
        }

        // 2. 인게임 로직
        if (match.stats.blue.nexusHp <= 0 || match.stats.red.nexusHp <= 0) return match;

        match.currentDuration += delta;
        let remainingTime = delta;

        while (remainingTime > 0) {
            const dt = Math.min(remainingTime, 1.0);

            processGrowthPhase(match, battleSettings, heroes, dt);
            if (Math.random() < (0.05 * dt)) { 
                [...match.blueTeam, ...match.redTeam].forEach(p => attemptBuyItem(p, shopItems, heroes));
            }
            processCombatPhase(match, heroes, battleSettings, roleSettings, watcherBuffType, watcherBuffAmount, dt);
            processSiegePhase(match, heroes, safeField, roleSettings, battleSettings, dt);
            processObjectiveLogic(match, safeField, dt);

            remainingTime -= dt;
        }
    } catch (error) {
        console.error(`Match ${match.id} Error:`, error);
        // 에러 발생 시 안전하게 밴픽을 강제 종료하고 게임을 시작시키거나, 매치를 유지함
        if (match.status === 'DRAFTING') {
             match.status = 'PLAYING';
             match.logs.push({ time: 0, message: "시스템 오류로 밴픽이 조기 종료되었습니다.", type: 'START' });
        }
    }

    return match;
  });
}

function processObjectiveLogic(match: LiveMatch, fieldSettings: any, dt: number) {
    if (!match.objectives) return;
    (['colossus', 'watcher'] as const).forEach((type) => {
        const obj = match.objectives[type];
        const setting = fieldSettings[type];
        if(!setting) return;
        if (obj.status === 'DEAD' && match.currentDuration >= obj.nextSpawnTime) {
            obj.status = 'ALIVE'; obj.hp = setting.hp; obj.maxHp = setting.hp;
            match.logs = [...match.logs, { time: match.currentDuration, message: `📢 ${type === 'colossus' ? '거신병' : '주시자'} 등장!`, type: 'START' }];
        }
        if (obj.status === 'ALIVE') {
            const reduction = 100 / (100 + (setting.armor || 50));
            const dps = (200 + (match.currentDuration / 10)) * dt; 
            obj.hp -= dps * reduction;
            if (obj.hp <= 0) {
                obj.hp = 0; obj.status = 'DEAD'; obj.nextSpawnTime = match.currentDuration + (setting.respawnTime || 300);
                const isBlueWin = Math.random() > 0.5;
                if (type === 'colossus') {
                    if(isBlueWin) match.stats.blue.colossus++; else match.stats.red.colossus++;
                    applyColossusReward(match, isBlueWin);
                } else {
                    if(isBlueWin) match.stats.blue.watcher++; else match.stats.red.watcher++;
                    applyWatcherReward(match, isBlueWin);
                }
            }
        }
    });
}
