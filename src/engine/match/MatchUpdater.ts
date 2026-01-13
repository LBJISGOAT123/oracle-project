// ==========================================
// FILE PATH: /src/engine/match/MatchUpdater.ts
// ==========================================
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

import { MinionSystem } from './systems/MinionSystem';
import { JungleSystem } from './systems/JungleSystem';
import { ProjectileSystem } from './systems/ProjectileSystem';
// [추가] 거신병 로직 임포트
import { ColossusLogic } from './logics/ColossusLogic';

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
    if (!Array.isArray(m.minions)) m.minions = [];
    if (!Array.isArray(m.projectiles)) m.projectiles = [];
    if (!Array.isArray(m.jungleMobs)) m.jungleMobs = [];
    if (!Array.isArray(m.logs)) m.logs = [];

    if (typeof m.stats.blue.nexusHp !== 'number') m.stats.blue.nexusHp = Number(m.stats.blue.nexusHp);
    if (typeof m.stats.red.nexusHp !== 'number') m.stats.red.nexusHp = Number(m.stats.red.nexusHp);

    const match = { ...m, logs: [...m.logs], blueTeam: [...m.blueTeam], redTeam: [...m.redTeam] };

    if (match.stats.blue.nexusHp <= 0 || match.stats.red.nexusHp <= 0) {
        return match;
    }

    if (match.status === 'DRAFTING') {
       if (!match.draft) return match;
       match.draft.timer -= delta;
       let loopGuard = 0;
       
       while (match.draft.timer <= 0 && match.status === 'DRAFTING' && loopGuard < 25) {
           loopGuard++;
           processDraftTurn(match, heroes, 50);
           match.draft.turnIndex++;
           const nextDecisionTime = 2 + Math.random() * 8;
           match.draft.timer += (30 + nextDecisionTime);
           match.draft.decisionTime = nextDecisionTime; 

           if (match.draft.turnIndex >= 20) {
               match.status = 'PLAYING';
               match.logs.push({ time: 0, message: "미니언 생성! 전군 출격!", type: 'START' });

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
               
               match.minions = [];
               match.projectiles = [];
               match.jungleMobs = [];
               break; 
           }
       }
       return match;
    }

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

    // [핵심] 미니언 업데이트 전에 거신병만 따로 업데이트
    // 거신병은 minions 배열에 들어있지만, 별도 로직으로 처리해야 함
    if (match.minions) {
        match.minions.forEach(m => {
            if (m.type === 'SUMMONED_COLOSSUS') {
                ColossusLogic.update(m, match, battleSettings, delta);
            }
        });
    }

    // 일반 미니언 업데이트 (MinionSystem 내부에서 거신병은 건너뛰도록 수정해둠)
    MinionSystem.update(match, battleSettings, delta);
    
    JungleSystem.update(match, delta);
    ProjectileSystem.update(match, delta);

    return match;
  });
}
