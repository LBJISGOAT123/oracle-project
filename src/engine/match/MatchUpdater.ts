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

  // matches.map을 통해 항상 새로운 객체 배열을 반환합니다. (불변성 유지)
  return matches.map(m => {
    // 딥카피를 통해 원본 데이터 오염 방지 및 리액트 리렌더링 유도
    const match = { ...m, logs: [...m.logs], blueTeam: [...m.blueTeam], redTeam: [...m.redTeam] };

    // 1. 드래프트 로직 (기존 유지)
    if (match.status === 'DRAFTING') {
        if (!match.draft) return match;
        match.draft.timer -= delta;
        if (match.draft.timer <= 0) {
            const turn = match.draft.turnIndex;
            let currentUserIq = 50; 
            if (turn >= 10) { 
                const pickIdx = turn - 10;
                const isBlue = pickIdx % 2 === 0;
                const teamIdx = Math.floor(pickIdx / 2);
                const player = isBlue ? match.blueTeam[teamIdx] : match.redTeam[teamIdx];
                const user = userPool.find(u => u.name === player.name);
                if (user) currentUserIq = user.brain;
            }
            processDraftTurn(match, heroes, currentUserIq);
            match.draft.turnIndex++;
            match.draft.timer = 1.0; 

            if (match.draft.turnIndex >= 20) {
                match.status = 'PLAYING';
                match.logs = [...match.logs, { time: 0, message: "밴픽 종료. 전장에 오신 것을 환영합니다.", type: 'START' }];
                [...match.blueTeam, ...match.redTeam].forEach(p => {
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

        // 모든 페이즈 실행 (기존 기능 100% 유지)
        processGrowthPhase(match, battleSettings, heroes, dt);
        if (Math.random() < (0.05 * dt)) { 
            [...match.blueTeam, ...match.redTeam].forEach(p => attemptBuyItem(p, shopItems, heroes));
        }
        processCombatPhase(match, heroes, battleSettings, roleSettings, watcherBuffType, watcherBuffAmount, dt);
        processSiegePhase(match, heroes, safeField, roleSettings, battleSettings, dt);
        processObjectiveLogic(match, safeField, dt);

        remainingTime -= dt;
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