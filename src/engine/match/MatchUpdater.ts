// ==========================================
// FILE PATH: /src/engine/match/MatchUpdater.ts
// ==========================================

import { Hero, LiveMatch } from '../../types';
import { useGameStore } from '../../store/useGameStore';
import { applyColossusReward, applyWatcherReward, processSiegeUnit } from './ObjectiveSystem';
import { attemptBuyItem } from './ItemManager';
import { processCombatPhase } from './phases/CombatPhase';
import { processSiegePhase } from './phases/SiegePhase';
import { processGrowthPhase } from './phases/GrowthPhase';
import { JUNGLE_CONFIG } from '../../data/jungle';

export function updateLiveMatches(matches: LiveMatch[], heroes: Hero[], timeSteps: number): LiveMatch[] {
  const state = useGameStore.getState();
  if (!state || !state.gameState) return matches;

  const fieldSettings = state.gameState.fieldSettings || { tower: { hp: 3000, armor: 50, rewardGold: 80 }, colossus: { hp: 8000, armor: 80, rewardGold: 100, attack: 50 }, watcher: { hp: 12000, armor: 120, rewardGold: 150, buffType: 'COMBAT', buffAmount: 20, buffDuration: 180 }, jungle: JUNGLE_CONFIG.DEFAULT_SETTINGS };
  const battleSettings = state.gameState.battleSettings;
  const roleSettings = state.gameState.roleSettings;
  const shopItems = state.shopItems || []; 

  const watcherBuffType = fieldSettings.watcher?.buffType || 'COMBAT';
  const watcherBuffAmount = (fieldSettings.watcher?.buffAmount || 20) / 100;

  return matches.map(match => {
    // 종료 조건 체크
    if (match.stats.blue.nexusHp <= 0 || match.stats.red.nexusHp <= 0) {
        match.duration = match.currentDuration; 
        return match;
    }
    if (match.currentDuration >= 3600) {
        if (match.score.blue > match.score.red) match.stats.red.nexusHp = 0;
        else match.stats.blue.nexusHp = 0;
        return match;
    }

    try {
        for (let i = 0; i < timeSteps; i++) {
            if (match.stats.blue.nexusHp <= 0 || match.stats.red.nexusHp <= 0) break;
            match.currentDuration += 1;

            // [거신병 공성 효과 처리]
            processSiegeUnit(match);

            // [주시자 버프 만료 체크]
            ['blue', 'red'].forEach((side) => {
                const s = (match.stats as any)[side];
                if (s.activeBuffs.voidPower && match.currentDuration > s.activeBuffs.voidBuffEndTime) {
                    s.activeBuffs.voidPower = false;
                    const team = side === 'blue' ? match.blueTeam : match.redTeam;
                    team.forEach((p: any) => p.buffs = p.buffs.filter((b: string) => b !== 'VOID'));
                }
            });

            // [아이템 구매] (30초마다)
            if (match.currentDuration % 30 === 0) {
                [...match.blueTeam, ...match.redTeam].forEach(p => {
                    attemptBuyItem(p, shopItems, heroes);
                });
            }

            // [전투/공성/성장 페이즈]
            processCombatPhase(match, heroes, battleSettings, roleSettings, watcherBuffType, watcherBuffAmount);

            // [수정: 하수인 스펙 반영을 위해 battleSettings 전달]
            processSiegePhase(match, heroes, fieldSettings, roleSettings, battleSettings);

            processGrowthPhase(match, battleSettings, heroes);

            // [신규] 1. 거신병 스폰 로직 (타이머 기반)
            if (match.currentDuration >= match.nextColossusSpawnTime) {
              // 젠 시간이 되었으므로 교전 발생 확률 증가 (0.0005 -> 0.005, 약 10배)
              // 즉, 젠 되자마자 바로 먹히진 않고 눈치 싸움하다가 가져감
              if (Math.random() < 0.005) {
                const blueJunglerAlive = match.blueTeam.some(p => heroes.find(h=>h.id===p.heroId)?.role === '추적자' && p.currentHp > 0);
                const redJunglerAlive = match.redTeam.some(p => heroes.find(h=>h.id===p.heroId)?.role === '추적자' && p.currentHp > 0);

                let blueChance = 0.5;
                const smiteBonus = (roleSettings.tracker.smiteChance - 1.0) / 2; 
                if (blueJunglerAlive && !redJunglerAlive) blueChance = 0.5 + smiteBonus;
                if (!blueJunglerAlive && redJunglerAlive) blueChance = 0.5 - smiteBonus;

                const isBlueObj = Math.random() < blueChance;
                (isBlueObj ? match.blueTeam : match.redTeam).forEach(p => p.gold += fieldSettings.colossus.rewardGold);

                if(isBlueObj) { match.stats.blue.colossus++; applyColossusReward(match, true); }
                else { match.stats.red.colossus++; applyColossusReward(match, false); }

                // [중요] 다음 스폰 시간 설정 (5분 후 리젠)
                match.nextColossusSpawnTime = match.currentDuration + 300; 
              }
            }

            // [신규] 2. 주시자 스폰 로직 (타이머 기반)
            if (match.currentDuration >= match.nextWatcherSpawnTime) {
              if (Math.random() < 0.003) { 
                const isBlueObj = Math.random() < 0.5; 
                (isBlueObj ? match.blueTeam : match.redTeam).forEach(p => p.gold += fieldSettings.watcher.rewardGold);

                if(isBlueObj) { match.stats.blue.watcher++; match.stats.blue.fury++; applyWatcherReward(match, true); }
                else { match.stats.red.watcher++; match.stats.red.fury++; applyWatcherReward(match, false); }

                // [중요] 다음 스폰 시간 설정 (7분 후 리젠 - 주시자는 더 늦게 뜸)
                match.nextWatcherSpawnTime = match.currentDuration + 420;
              }
            }
        }
    } catch (error) {
        console.warn("Sim Error:", error);
        match.currentDuration += timeSteps; 
    }

    return match;
  });
}