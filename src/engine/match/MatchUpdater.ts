// ==========================================
// FILE PATH: /src/engine/match/MatchUpdater.ts
// ==========================================
import { Hero, LiveMatch } from '../../types';
import { useGameStore } from '../../store/useGameStore';

// [모듈화된 시스템들 Import]
import { processDraftTurn } from './systems/BanPickEngine'; 
import { updatePlayerBehavior } from './systems/PlayerSystem'; // [NEW] 플레이어 AI
import { updateNeutralObjectives } from './systems/ObjectiveSystem'; // [NEW] 오브젝트 관리
import { processGrowthPhase } from './phases/GrowthPhase';
import { processSiegePhase } from './phases/SiegePhase';
import { BASES } from '../data/MapData';

export function updateLiveMatches(matches: LiveMatch[], heroes: Hero[], delta: number): LiveMatch[] {
  const state = useGameStore.getState();
  const shopItems = state.shopItems || []; 
  const { battleSettings, fieldSettings, roleSettings } = state.gameState;

  // 필드 설정 안전값 (Default Fallback)
  const safeField = fieldSettings || { 
    colossus: { hp: 8000, armor: 80, rewardGold: 100, respawnTime: 300, attack: 50 }, 
    watcher: { hp: 12000, armor: 120, rewardGold: 150, respawnTime: 420, buffType: 'COMBAT', buffAmount: 20 },
    jungle: { density: 50, yield: 50, attack: 30, defense: 20, threat: 0, xp: 160, gold: 80 }
  };

  return matches.map(m => {
    // 불변성 유지 (Logs, Team 배열 복사)
    const match = { ...m, logs: [...m.logs], blueTeam: [...m.blueTeam], redTeam: [...m.redTeam] };

    // ---------------------------------------------
    // PHASE 1: 밴픽 (Draft)
    // ---------------------------------------------
    if (match.status === 'DRAFTING') {
       if (!match.draft) return match;
       match.draft.timer -= delta;
       const triggerTime = match.draft.decisionTime || 0;

       if (match.draft.timer <= triggerTime) {
           processDraftTurn(match, heroes, 50);
           match.draft.turnIndex++;
           match.draft.timer = 30; 
           match.draft.decisionTime = 5 + Math.random() * 20;

           // 게임 시작 초기화
           if (match.draft.turnIndex >= 20) {
               match.status = 'PLAYING';
               match.logs.push({ time: 0, message: "미니언 생성! 전군 출격!", type: 'START' });

               const initPlayer = (p: any, isBlue: boolean) => {
                   const h = heroes.find(x => x.id === p.heroId);
                   if(h) { 
                       p.maxHp = h.stats.hp; p.currentHp = h.stats.hp; 
                       p.maxMp = h.stats.mp || 300; p.currentMp = h.stats.mp || 300;
                       p.respawnTimer = 0;
                       // 본진 좌표로 이동
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

    // ---------------------------------------------
    // PHASE 2: 인게임 시뮬레이션 (Playing)
    // ---------------------------------------------
    if (match.stats.blue.nexusHp <= 0 || match.stats.red.nexusHp <= 0) return match;

    match.currentDuration += delta;

    // 1. 성장 페이즈 (미니언 생성, 자연 골드, 경험치)
    processGrowthPhase(match, battleSettings, safeField, heroes, delta);

    // 2. 오브젝트 페이즈 (거신병/주시자 스폰 및 전투)
    updateNeutralObjectives(match, safeField, delta);

    // 3. 플레이어 행동 페이즈 (AI 판단 -> 이동 -> 전투 -> 구매)
    [...match.blueTeam, ...match.redTeam].forEach(player => {
        updatePlayerBehavior(player, match, heroes, shopItems, roleSettings, delta);
    });

    // 4. 공성 페이즈 (타워/넥서스 파괴)
    processSiegePhase(match, heroes, safeField, roleSettings, battleSettings, delta);

    return match;
  });
}