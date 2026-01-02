// ==========================================
// FILE PATH: /src/engine/match/MatchUpdater.ts
// ==========================================
import { Hero, LiveMatch } from '../../types';
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

  // [중요] 모든 설정값 가져오기
  const { fieldSettings, battleSettings, roleSettings } = state.gameState;
  const shopItems = state.shopItems || []; 

  // 필드 설정 안전값 (초기화 전이라도 에러 안 나게)
  const safeField = fieldSettings || { 
    colossus: { hp: 8000, armor: 80, rewardGold: 100, respawnTime: 300, attack: 50 }, 
    watcher: { hp: 12000, armor: 120, rewardGold: 150, buffType: 'COMBAT', buffAmount: 20, buffDuration: 180, respawnTime: 420 },
    jungle: { density: 50, yield: 50, attack: 30, defense: 20, threat: 0, xp: 160, gold: 80 },
    tower: { hp: 5000, armor: 50, rewardGold: 150 }
  };
  const watcherBuffType = safeField.watcher?.buffType || 'COMBAT';
  const watcherBuffAmount = (safeField.watcher?.buffAmount || 20) / 100;

  return matches.map(m => {
    // 불변성 유지를 위한 객체 복사
    const match = { ...m, logs: [...m.logs], blueTeam: [...m.blueTeam], redTeam: [...m.redTeam] };

    // ----------------------------------------------------------------
    // 1. 드래프트(밴픽) 로직
    // ----------------------------------------------------------------
    if (match.status === 'DRAFTING') {
        if (!match.draft) return match;

        match.draft.timer -= delta;
        const triggerTime = match.draft.decisionTime !== undefined ? match.draft.decisionTime : 0;

        if (match.draft.timer <= triggerTime) {
            processDraftTurn(match, heroes, 50); // 봇 뇌지컬 평균 50
            match.draft.turnIndex++;
            match.draft.timer = 40; 
            match.draft.decisionTime = 5 + Math.random() * 30; 

            // 밴픽 종료 시 게임 시작
            if (match.draft.turnIndex >= 20) {
                match.status = 'PLAYING';
                match.logs = [...match.logs, { time: 0, message: "밴픽 종료. 전장에 오신 것을 환영합니다.", type: 'START' }];

                // 스탯 초기화
                [...match.blueTeam, ...match.redTeam].forEach(p => {
                    const h = heroes.find(x => x.id === p.heroId);
                    if (h) { 
                        p.maxHp = h.stats.hp; 
                        p.currentHp = h.stats.hp;
                        p.maxMp = h.stats.mp || 300;
                        p.currentMp = h.stats.mp || 300;
                        p.mpRegen = h.stats.mpRegen || 5;
                        p.respawnTimer = 0; 
                    }
                });
            }
        }
        return match;
    }

    // ----------------------------------------------------------------
    // 2. 인게임 시뮬레이션
    // ----------------------------------------------------------------

    if (match.stats.blue.nexusHp <= 0 || match.stats.red.nexusHp <= 0) return match;

    match.currentDuration += delta;
    let remainingTime = delta;

    // 프레임 쪼개기 (최대 1초 단위)
    while (remainingTime > 0) {
        const dt = Math.min(remainingTime, 1.0); 

        // [A] 부활 시스템
        [...match.blueTeam, ...match.redTeam].forEach(p => {
            if (p.respawnTimer > 0) {
                p.respawnTimer -= dt;
                if (p.respawnTimer <= 0) {
                    p.respawnTimer = 0;
                    p.currentHp = p.maxHp;
                    p.currentMp = p.maxMp;
                }
            }
        });

        // [B] 성장 페이즈 (Updated)
        // 하수인 스탯, 정글 스탯 설정 반영됨
        processGrowthPhase(match, battleSettings, safeField, heroes, dt);

        // [C] 아이템 구매
        if (Math.random() < (0.05 * dt)) { 
            match.blueTeam
                .filter(p => p.respawnTimer <= 0 && p.currentHp > 0)
                .forEach(p => attemptBuyItem(p, shopItems, heroes, match.redTeam, match.currentDuration));
            match.redTeam
                .filter(p => p.respawnTimer <= 0 && p.currentHp > 0)
                .forEach(p => attemptBuyItem(p, shopItems, heroes, match.blueTeam, match.currentDuration));
        }

        // [D] 전투 페이즈 (Updated)
        // 진영별 공격력/방어력 버프 반영됨
        processCombatPhase(match, heroes, battleSettings, roleSettings, watcherBuffType, watcherBuffAmount, dt);

        // [E] 공성 페이즈 (Updated)
        // 포탑 내구도 및 공격력 설정 반영됨
        processSiegePhase(match, heroes, safeField, roleSettings, battleSettings, dt);

        // [F] 오브젝트 로직
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
            obj.status = 'ALIVE'; 
            obj.hp = setting.hp; 
            obj.maxHp = setting.hp;
            match.logs = [...match.logs, { 
                time: match.currentDuration, 
                message: `📢 ${type === 'colossus' ? '거신병' : '주시자'} 등장!`, 
                type: 'START' 
            }];
        }

        if (obj.status === 'ALIVE') {
            const reduction = 100 / (100 + (setting.armor || 50));
            const dps = (200 + (match.currentDuration / 10)) * dt; 
            obj.hp -= dps * reduction;

            if (obj.hp <= 0) {
                obj.hp = 0; 
                obj.status = 'DEAD'; 
                obj.nextSpawnTime = match.currentDuration + (setting.respawnTime || 300);

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