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

  const { fieldSettings, battleSettings, roleSettings } = state.gameState;
  const shopItems = state.shopItems || []; 

  // 필드 설정 안전값 (데이터가 없을 경우 대비)
  const safeField = fieldSettings || { 
    colossus: { hp: 8000, armor: 80, rewardGold: 100, respawnTime: 300, attack: 50 }, 
    watcher: { hp: 12000, armor: 100, rewardGold: 150, respawnTime: 420, buffType: 'COMBAT', buffAmount: 20 },
    jungle: { density: 50, yield: 50, attack: 30, defense: 20, threat: 0, xp: 160, gold: 80 }
  };
  const watcherBuffType = safeField.watcher?.buffType || 'COMBAT';
  const watcherBuffAmount = (safeField.watcher?.buffAmount || 20) / 100;

  return matches.map(m => {
    // 불변성을 위해 객체 복사 (로그 및 팀 배열)
    const match = { ...m, logs: [...m.logs], blueTeam: [...m.blueTeam], redTeam: [...m.redTeam] };

    // ----------------------------------------------------------------
    // 1. 드래프트(밴픽) 로직
    // ----------------------------------------------------------------
    if (match.status === 'DRAFTING') {
        if (!match.draft) return match;

        match.draft.timer -= delta;
        const triggerTime = match.draft.decisionTime !== undefined ? match.draft.decisionTime : 0;

        if (match.draft.timer <= triggerTime) {
            processDraftTurn(match, heroes, 50); // 봇 지능 50 설정
            match.draft.turnIndex++;
            match.draft.timer = 40; 
            match.draft.decisionTime = 5 + Math.random() * 30; 

            // 밴픽 종료 시 게임 시작 처리
            if (match.draft.turnIndex >= 20) {
                match.status = 'PLAYING';
                match.logs = [...match.logs, { time: 0, message: "밴픽 종료. 전장에 오신 것을 환영합니다.", type: 'START' }];

                // 영웅 스탯 초기화 (체력, 마나 등)
                [...match.blueTeam, ...match.redTeam].forEach(p => {
                    const h = heroes.find(x => x.id === p.heroId);
                    if (h) { 
                        p.maxHp = h.stats.hp; 
                        p.currentHp = h.stats.hp;
                        // [마나 초기화]
                        p.maxMp = h.stats.mp || 300;
                        p.currentMp = h.stats.mp || 300;
                        p.mpRegen = h.stats.mpRegen || 5;

                        p.respawnTimer = 0; // 시작 시 생존 상태
                    }
                });
            }
        }
        return match;
    }

    // ----------------------------------------------------------------
    // 2. 인게임 시뮬레이션 로직
    // ----------------------------------------------------------------

    // 넥서스 파괴 체크 (게임 종료)
    if (match.stats.blue.nexusHp <= 0 || match.stats.red.nexusHp <= 0) return match;

    match.currentDuration += delta;
    let remainingTime = delta;

    // 프레임 분할 처리 (Delta Time Slicing)
    while (remainingTime > 0) {
        const dt = Math.min(remainingTime, 1.0); // 최대 1초 단위로 끊어서 연산

        // [A] 부활 시스템: 죽은 유저 타이머 감소 및 부활 처리
        const allPlayers = [...match.blueTeam, ...match.redTeam];
        allPlayers.forEach(p => {
            if (p.respawnTimer > 0) {
                p.respawnTimer -= dt;
                // 타이머 종료 시 부활 (체력/마나 풀회복)
                if (p.respawnTimer <= 0) {
                    p.respawnTimer = 0;
                    p.currentHp = p.maxHp;
                    p.currentMp = p.maxMp;
                }
            }
        });

        // [B] 성장 페이즈 (골드, 경험치, 자연회복)
        // * processGrowthPhase 내부에서 respawnTimer 체크함
        processGrowthPhase(match, battleSettings, safeField, heroes, dt);

        // [C] 아이템 구매 (AI)
        if (Math.random() < (0.05 * dt)) { 
            // 살아있는 사람만 상점 이용 가능

            // 블루팀 구매 시도 (적: 레드팀 정보 전달)
            match.blueTeam
                .filter(p => p.respawnTimer <= 0 && p.currentHp > 0)
                .forEach(p => attemptBuyItem(p, shopItems, heroes, match.redTeam, match.currentDuration));

            // 레드팀 구매 시도 (적: 블루팀 정보 전달)
            match.redTeam
                .filter(p => p.respawnTimer <= 0 && p.currentHp > 0)
                .forEach(p => attemptBuyItem(p, shopItems, heroes, match.blueTeam, match.currentDuration));
        }

        // [D] 전투, 공성, 오브젝트 처리
        // 각 함수 내부에서 생존 여부(currentHp > 0) 체크함
        processCombatPhase(match, heroes, battleSettings, roleSettings, watcherBuffType, watcherBuffAmount, dt);
        processSiegePhase(match, heroes, safeField, roleSettings, battleSettings, dt);
        processObjectiveLogic(match, safeField, dt);

        remainingTime -= dt;
    }

    return match;
  });
}

/**
 * 중립 오브젝트(거신병, 주시자) 스폰 및 전투 로직
 */
function processObjectiveLogic(match: LiveMatch, fieldSettings: any, dt: number) {
    if (!match.objectives) return;

    (['colossus', 'watcher'] as const).forEach((type) => {
        const obj = match.objectives[type];
        const setting = fieldSettings[type];
        if(!setting) return;

        // 스폰 시간 도달 시 등장
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

        // 살아있을 때 (체력 감소 시뮬레이션)
        if (obj.status === 'ALIVE') {
            // 시간이 지날수록 더 빨리 녹음 (게임 템포 조절)
            const reduction = 100 / (100 + (setting.armor || 50));
            const dps = (200 + (match.currentDuration / 10)) * dt; 

            obj.hp -= dps * reduction;

            // 처치됨
            if (obj.hp <= 0) {
                obj.hp = 0; 
                obj.status = 'DEAD'; 
                obj.nextSpawnTime = match.currentDuration + (setting.respawnTime || 300);

                // 랜덤하게 처치 팀 결정 (50:50) -> 추후 오브젝트 전투 로직 고도화 가능
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