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
import { ColossusLogic } from './logics/ColossusLogic';

// [최적화] VisualSystem 제거 (렌더링만 느려지게 함)

export function updateLiveMatches(matches: LiveMatch[], heroes: Hero[], delta: number): LiveMatch[] {
  const state = useGameStore.getState();
  const shopItems = state.shopItems || []; 
  const { battleSettings, fieldSettings, roleSettings } = state.gameState;

  // [안전장치] 설정값 누락 방지
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
    // [최적화] 배열 할당 최소화
    // 기존: m.logs = [] (매번 새 배열) -> 변경: 필요한 경우만 초기화
    if (!m.minions) m.minions = [];
    if (!m.projectiles) m.projectiles = [];
    if (!m.jungleMobs) m.jungleMobs = [];
    if (!m.logs) m.logs = [];
    
    // [최적화] 시각 이펙트 배열 제거 (메모리 절약)
    // if (!Array.isArray(m.visualEffects)) m.visualEffects = []; 
    // delete m.visualEffects; // 아예 삭제

    // [중요] 불필요한 Spread 연산(...) 제거
    // 원본 객체(m)를 직접 수정하지 않고, shallow copy 한 번만 수행
    const match = { ...m }; 

    // [최적화] 로그 정리: 로그가 100개 넘어가면 앞부분 잘라냄 (메모리 누수 방지)
    if (match.logs.length > 100) {
        match.logs = match.logs.slice(-50); 
    }

    // 좌표 보정 (NaN 방지)
    [...match.blueTeam, ...match.redTeam].forEach(p => {
        if (p.totalGold === undefined || p.totalGold < p.gold) {
            const itemValue = p.items.reduce((sum, i) => sum + (i.cost || 0), 0);
            p.totalGold = Math.floor(p.gold + itemValue);
        }
        if (isNaN(p.x)) p.x = 50;
        if (isNaN(p.y)) p.y = 50;
    });

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
               
               // [최적화] 게임 시작 로그 하나만 남기고 나머지 초기화
               match.logs = [{ time: 0, message: "게임이 시작되었습니다!", type: 'START' }];

               const initPlayer = (p: any, isBlue: boolean) => {
                   const h = heroes.find(x => x.id === p.heroId);
                   if(h) { 
                       p.level = 1; p.items = []; (p as any).exp = 0;
                       updateLivePlayerStats(p, h);
                       p.currentHp = p.maxHp; p.currentMp = p.maxMp; p.respawnTimer = 0;
                       p.totalDamageDealt = 0;
                       p.x = isBlue ? BASES.BLUE.x : BASES.RED.x;
                       p.y = isBlue ? BASES.BLUE.y : BASES.RED.y;
                       (p as any).pathIdx = 0;
                       p.cooldowns = { q:0, w:0, e:0, r:0 };
                       p.isRecalling = false;
                       p.currentRecallTime = 0;
                       p.killStreak = 0;
                       p.bounty = 0;
                       p.totalGold = 500; 
                   }
               };
               match.blueTeam.forEach(p => initPlayer(p, true));
               match.redTeam.forEach(p => initPlayer(p, false));
               
               match.minions = []; match.projectiles = []; match.jungleMobs = [];
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
        match, heroes, battleSettings, safeRole, 
        watcherSettings?.buffType || 'COMBAT', 
        watcherSettings?.buffAmount || 20, 
        delta
    );

    if (match.minions) {
        match.minions.forEach(m => {
            if (m.type === 'SUMMONED_COLOSSUS') {
                ColossusLogic.update(m, match, battleSettings, delta);
            }
        });
    }

    MinionSystem.update(match, battleSettings, delta, heroes);
    JungleSystem.update(match, delta);
    ProjectileSystem.update(match, delta);
    
    // [최적화] VisualSystem 업데이트 제거 (안씀)
    // VisualSystem.update(match, delta);

    return match;
  });
}
