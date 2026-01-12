import { Hero, LiveMatch } from '../../types';
import { useGameStore } from '../../store/useGameStore';

import { processDraftTurn } from './systems/BanPickEngine'; 
import { updatePlayerBehavior } from './systems/PlayerSystem'; 
import { updateNeutralObjectives } from './systems/ObjectiveSystem'; 
import { processGrowthPhase } from './phases/GrowthPhase';
import { processSiegePhase } from './phases/SiegePhase';
import { processCombatPhase } from './phases/CombatPhase';
import { updateLivePlayerStats } from './systems/ItemManager'; 
import { BASES } from '../data/MapData';

export function updateLiveMatches(matches: LiveMatch[], heroes: Hero[], delta: number): LiveMatch[] {
  const state = useGameStore.getState();
  const shopItems = state.shopItems || []; 
  
  const { battleSettings, fieldSettings, roleSettings } = state.gameState;

  const safeField = fieldSettings || { 
    colossus: { hp: 15000, armor: 80, rewardGold: 100, respawnTime: 300, attack: 50 },
    watcher: { hp: 20000, armor: 120, rewardGold: 150, buffType: 'COMBAT', buffAmount: 20, buffDuration: 180, respawnTime: 420 }, 
    tower: { hp: 30000, armor: 200, rewardGold: 150 }, 
    jungle: { density: 50, yield: 50, attack: 30, defense: 20, threat: 0, xp: 160, gold: 80 }
  };

  const safeRole = roleSettings || {
    executor: { damage: 15, defense: 15 },
    tracker: { gold: 20, smiteChance: 1.5 },
    prophet: { cdrPerLevel: 2 },
    slayer: { structureDamage: 30 },
    guardian: { survivalRate: 20 }
  };

  return matches.map(m => {
    const match = { ...m, logs: [...m.logs], blueTeam: [...m.blueTeam], redTeam: [...m.redTeam] };

    // =============================================
    // PHASE 1: 밴픽 (Draft) - [고배속 대응 수정]
    // =============================================
    if (match.status === 'DRAFTING') {
       if (!match.draft) return match;

       // 경과 시간을 타이머에서 뺌
       match.draft.timer -= delta;

       // 타이머가 0 이하로 내려갔다면, 밀린 시간만큼 턴을 계속 진행시킴 (while 루프)
       // *주의: 무한 루프 방지를 위해 한 틱당 최대 20번(풀 드래프트)까지만 처리
       let loopGuard = 0;
       
       while (match.draft.timer <= 0 && match.status === 'DRAFTING' && loopGuard < 25) {
           loopGuard++;
           
           // AI 밴/픽 진행 (IQ 50 기준)
           processDraftTurn(match, heroes, 50);
           
           match.draft.turnIndex++;
           
           // 다음 턴을 위한 시간 설정 (기본 30초 + 랜덤 고민시간)
           // 시간이 많이 흘렀다면(delta가 크다면) timer는 여전히 음수일 것이므로 루프가 다시 돔
           const nextDecisionTime = 2 + Math.random() * 8;
           match.draft.timer += (30 + nextDecisionTime); // 시간 빚 탕감 느낌으로 더해줌
           match.draft.decisionTime = nextDecisionTime; 

           // [게임 시작] 20번째 턴(픽 종료) 도달 시
           if (match.draft.turnIndex >= 20) {
               match.status = 'PLAYING';
               match.logs.push({ time: 0, message: "미니언 생성! 전군 출격!", type: 'START' });

               // 플레이어 초기화 함수
               const initPlayer = (p: any, isBlue: boolean) => {
                   const h = heroes.find(x => x.id === p.heroId);
                   if(h) { 
                       p.level = 1;
                       p.items = [];
                       (p as any).exp = 0;
                       updateLivePlayerStats(p, h);
                       p.currentHp = p.maxHp;
                       p.currentMp = p.maxMp;
                       p.respawnTimer = 0;
                       p.totalDamageDealt = 0;
                       p.x = isBlue ? BASES.BLUE.x : BASES.RED.x;
                       p.y = isBlue ? BASES.BLUE.y : BASES.RED.y;
                       (p as any).pathIdx = 0;
                   }
               };

               match.blueTeam.forEach(p => initPlayer(p, true));
               match.redTeam.forEach(p => initPlayer(p, false));
               
               // 게임이 시작되었으므로 밴픽 루프 종료
               break; 
           }
       }
       return match;
    }

    // =============================================
    // PHASE 2: 인게임 시뮬레이션 (Playing)
    // =============================================
    if (match.stats.blue.nexusHp <= 0 || match.stats.red.nexusHp <= 0) return match;

    match.currentDuration += delta;

    processGrowthPhase(match, battleSettings, safeField, heroes, delta);
    updateNeutralObjectives(match, safeField, delta);

    [...match.blueTeam, ...match.redTeam].forEach(player => {
        updatePlayerBehavior(player, match, heroes, shopItems, safeRole, delta);
    });

    processSiegePhase(match, heroes, safeField, safeRole, battleSettings, delta);

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

    return match;
  });
}
