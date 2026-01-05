// ==========================================
// FILE PATH: /src/engine/match/MatchUpdater.ts
// ==========================================
import { Hero, LiveMatch } from '../../types';
import { useGameStore } from '../../store/useGameStore';

// [시스템 모듈 Import]
import { processDraftTurn } from './systems/BanPickEngine'; 
import { updatePlayerBehavior } from './systems/PlayerSystem'; 
import { updateNeutralObjectives } from './systems/ObjectiveSystem'; 
import { processGrowthPhase } from './phases/GrowthPhase';
import { processSiegePhase } from './phases/SiegePhase';
// ▼ [추가] 전투 페이즈 import
import { processCombatPhase } from './phases/CombatPhase';
import { updateLivePlayerStats } from './systems/ItemManager'; 
import { BASES } from '../data/MapData';

export function updateLiveMatches(matches: LiveMatch[], heroes: Hero[], delta: number): LiveMatch[] {
  const state = useGameStore.getState();
  const shopItems = state.shopItems || []; 
  
  // 설정값 가져오기
  const { battleSettings, fieldSettings, roleSettings } = state.gameState;

  // [안전장치] 필드 설정 기본값 (설정 파일이 깨지거나 없을 때 방어)
  const safeField = fieldSettings || { 
    colossus: { hp: 15000, armor: 80, rewardGold: 100, respawnTime: 300, attack: 50 }, // 거신병 체력 상향
    watcher: { hp: 20000, armor: 120, rewardGold: 150, buffType: 'COMBAT', buffAmount: 20, buffDuration: 180, respawnTime: 420 }, // 주시자 체력 상향
    
    // [핵심] 타워 체력 6배 상향 (5,000 -> 30,000)
    tower: { hp: 30000, armor: 200, rewardGold: 150 }, 
    
    jungle: { density: 50, yield: 50, attack: 30, defense: 20, threat: 0, xp: 160, gold: 80 }
  };

// ... 아래 로직 동일 ...

  // [안전장치] 역할군 밸런스 설정 기본값
  const safeRole = roleSettings || {
    executor: { damage: 15, defense: 15 },
    tracker: { gold: 20, smiteChance: 1.5 },
    prophet: { cdrPerLevel: 2 },
    slayer: { structureDamage: 30 },
    guardian: { survivalRate: 20 }
  };

  return matches.map(m => {
    // 불변성 유지를 위한 객체 복사
    const match = { ...m, logs: [...m.logs], blueTeam: [...m.blueTeam], redTeam: [...m.redTeam] };

    // =============================================
    // PHASE 1: 밴픽 (Draft)
    // =============================================
    if (match.status === 'DRAFTING') {
       if (!match.draft) return match;
       match.draft.timer -= delta;
       const triggerTime = match.draft.decisionTime || 0;

       if (match.draft.timer <= triggerTime) {
           // AI 밴/픽 진행 (IQ 50 기준)
           processDraftTurn(match, heroes, 50);
           
           match.draft.turnIndex++;
           match.draft.timer = 30; // 턴 시간 초기화
           match.draft.decisionTime = 5 + Math.random() * 20; // 다음 턴 생각 시간 랜덤

           // [게임 시작] 20번째 턴(픽 종료) 도달 시
           if (match.draft.turnIndex >= 20) {
               match.status = 'PLAYING';
               match.logs.push({ time: 0, message: "미니언 생성! 전군 출격!", type: 'START' });

               // 플레이어 초기화 함수
               const initPlayer = (p: any, isBlue: boolean) => {
                   const h = heroes.find(x => x.id === p.heroId);
                   if(h) { 
                       // 1. 레벨 및 아이템 초기화
                       p.level = 1;
                       p.items = [];
                       (p as any).exp = 0;

                       // 2. [핵심] 스탯 계산 적용
                       updateLivePlayerStats(p, h);

                       // 3. 체력/마나 완충
                       p.currentHp = p.maxHp;
                       p.currentMp = p.maxMp;
                       p.respawnTimer = 0;
                       p.totalDamageDealt = 0;

                       // 4. 본진 위치로 이동
                       p.x = isBlue ? BASES.BLUE.x : BASES.RED.x;
                       p.y = isBlue ? BASES.BLUE.y : BASES.RED.y;
                       (p as any).pathIdx = 0;
                   }
               };

               match.blueTeam.forEach(p => initPlayer(p, true));
               match.redTeam.forEach(p => initPlayer(p, false));
           }
       }
       return match;
    }

    // =============================================
    // PHASE 2: 인게임 시뮬레이션 (Playing)
    // =============================================
    
    // 게임 종료 조건 체크 (이미 끝난 게임은 연산 X)
    if (match.stats.blue.nexusHp <= 0 || match.stats.red.nexusHp <= 0) return match;

    match.currentDuration += delta;

    // 1. 성장 페이즈 (자연 골드, 경험치, 재생)
    processGrowthPhase(match, battleSettings, safeField, heroes, delta);

    // 2. 오브젝트 페이즈 (스폰 및 교전 상태 업데이트)
    updateNeutralObjectives(match, safeField, delta);

    // 3. 플레이어 행동 AI (이동, 전투, 구매)
    [...match.blueTeam, ...match.redTeam].forEach(player => {
        updatePlayerBehavior(player, match, heroes, shopItems, safeRole, delta);
    });

    // 4. 공성 페이즈 (타워/넥서스 파괴)
    processSiegePhase(match, heroes, safeField, safeRole, battleSettings, delta);

    // ▼▼▼ [핵심 수정] 전투 페이즈 추가 (PVP 데미지 처리) ▼▼▼
    const watcherSettings = safeField.watcher;
    processCombatPhase(
        match, 
        heroes, 
        battleSettings, 
        safeRole, 
        watcherSettings?.buffType || 'COMBAT', 
        watcherSettings?.buffAmount || 20, 
        delta
    );
    // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

    return match;
  });
}