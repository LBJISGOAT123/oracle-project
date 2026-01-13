// ==========================================
// FILE PATH: /src/engine/CoreEngine.ts
// ==========================================
import { GameState, Hero, Post } from '../types';
import { updateLiveMatches } from './match/MatchUpdater';
import { createLiveMatches } from './match/MatchCreator';
import { finishMatch } from './match/MatchSettlement';
import { initUserPool, userPool, getTopRankers } from './system/UserManager'; 
import { UserActivitySystem } from './system/UserActivitySystem';
import { analyzeHeroMeta, calculateUserEcosystem } from './system/RankingSystem';
import { updatePostInteractions, generatePostAsync } from './system/CommunityEngine';
import { calculateTargetSentiment, smoothSentiment } from './system/SentimentEngine';

const MAX_STEPS_PER_FRAME = 10; 

export class CoreEngine {
  static processTick(
    initialState: GameState,
    initialHeroes: Hero[],
    initialPosts: Post[],
    totalDelta: number,
    updateStateCallback: (updates: Partial<GameState>, newHeroes?: Hero[], newPosts?: Post[]) => void
  ) {
    try {
      let currentState = { ...initialState };
      let currentHeroes = initialHeroes;
      let currentPosts = [...initialPosts];
      
      let remainingTime = totalDelta;
      
      // 배속에 따른 dt 조정
      let stepSize = 0.5; 
      if (initialState.gameSpeed >= 600) stepSize = 5.0;     
      else if (initialState.gameSpeed >= 60) stepSize = 3.0; 
      else if (initialState.gameSpeed >= 10) stepSize = 1.5; 

      let loopCount = 0;

      while (remainingTime > 0 && loopCount < MAX_STEPS_PER_FRAME) {
        const dt = Math.min(remainingTime, stepSize);
        
        const result = this.executeSingleStep(currentState, currentHeroes, currentPosts, dt);
        
        currentState = { ...currentState, ...result.stateUpdates };
        if (result.newHeroes) currentHeroes = result.newHeroes;
        if (result.newPosts) currentPosts = result.newPosts;

        remainingTime -= dt;
        loopCount++;
      }

      updateStateCallback(currentState, currentHeroes, currentPosts);

    } catch (err) {
      console.error("Critical Engine Error:", err);
    }
  }

  private static executeSingleStep(
    state: GameState,
    heroes: Hero[],
    posts: Post[],
    deltaSeconds: number
  ) {
    let { hour, minute, second, day, totalUsers, tierConfig, liveMatches, godStats, itemStats } = state;

    // A. 시간 흐름
    second += deltaSeconds;
    if (second >= 60) {
      const extraMinutes = Math.floor(second / 60);
      second %= 60;
      minute += extraMinutes;
      if (minute >= 60) {
        const extraHours = Math.floor(minute / 60);
        minute %= 60;
        hour += extraHours;
        if (hour >= 24) {
          const extraDays = Math.floor(hour / 24);
          hour %= 24;
          day += extraDays;
        }
      }
    }

    const currentTotalMinutes = day * 1440 + hour * 60 + Math.floor(minute);
    const isNewMinute = Math.floor(minute) !== Math.floor(state.minute);

    if (!userPool || userPool.length === 0) {
      if (heroes.length > 0) initUserPool(heroes, totalUsers);
      return { stateUpdates: { second, minute, hour, day }, newHeroes: heroes, newPosts: posts };
    }

    // B. 유저 활동
    if (Math.floor(second) % 5 === 0) {
       UserActivitySystem.updateTraffic(hour + (minute/60), userPool);
    }

    // C. 매치 업데이트 (분산 처리 제거 -> 매 프레임 전체 업데이트)
    let updatedMatches = [...liveMatches];
    const nextGodStats = { ...godStats };
    const nextItemStats = { ...itemStats }; 

    try {
      // [수정] 모든 매치를 매 프레임 업데이트 (부드러움 확보)
      const processedMatches = updateLiveMatches(updatedMatches, heroes, deltaSeconds);
      
      updatedMatches = processedMatches.map(m => ({
          ...m,
          logs: m.logs.length > 15 ? m.logs.slice(-15) : [...m.logs],
      }));

      // 종료 처리
      const isMatchEnded = (m: any) => (m.stats.blue.nexusHp <= 0 || m.stats.red.nexusHp <= 0);
      const endedMatches = updatedMatches.filter(m => isMatchEnded(m));
      updatedMatches = updatedMatches.filter(m => !isMatchEnded(m));

      endedMatches.forEach(match => {
        try {
          const result = finishMatch(match, heroes, day, hour, state.battleSettings, tierConfig);
          nextGodStats.totalMatches++;
          if (result.isBlueWin) nextGodStats.danteWins++; else nextGodStats.izmanWins++;

          [...match.blueTeam, ...match.redTeam].forEach(p => {
              if(!p.items) return;
              p.items.forEach((item: any) => {
                  if (!nextItemStats[item.id]) nextItemStats[item.id] = { itemId: item.id, totalPicks: 0, totalWins: 0, totalKills: 0, totalDeaths: 0, totalAssists: 0 };
                  const st = nextItemStats[item.id];
                  st.totalPicks++;
                  const isWin = (match.blueTeam.includes(p) && result.isBlueWin) || (match.redTeam.includes(p) && !result.isBlueWin);
                  if (isWin) st.totalWins++;
                  st.totalKills += p.kills; st.totalDeaths += p.deaths; st.totalAssists += p.assists;
              });
          });
        } catch (settleError) {
            console.error("Match Settlement Failed:", settleError);
        }
      });

    } catch (matchError) {
      console.warn("Match Update Skipped:", matchError);
    }

    // D. 매치 생성 (최대 60개 유지)
    const onlineUsers = userPool.filter(u => u && u.status !== 'OFFLINE').length;
    let finalMatches = updatedMatches;
    
    if ((Math.floor(second) % 10 === 0) && updatedMatches.length < 60) { 
        const idleUsers = userPool.filter(u => u && u.status === 'IDLE');
        if (idleUsers.length >= 10) {
            const newMatches = createLiveMatches(heroes, onlineUsers, Date.now(), tierConfig);
            finalMatches = [...updatedMatches, ...newMatches.slice(0, 3)];
        }
    }

    // E. 통계 업데이트
    let finalHeroes = heroes;
    let finalPosts = posts;
    let nextUserStatus = state.userStatus;
    let nextTopRankers = state.topRankers;
    let nextSentiment = state.userSentiment;

    if (isNewMinute && Math.floor(minute) % 5 === 0) { 
      if (userPool.length > 0) {
          try {
            finalHeroes = analyzeHeroMeta([...heroes]);
            nextUserStatus = calculateUserEcosystem(onlineUsers, userPool.length, tierConfig);
            userPool.sort((a, b) => (b.score || 0) - (a.score || 0));
            userPool.forEach((u, idx) => { if(u) { u.rank = idx + 1; u.isChallenger = (u.score >= tierConfig.master && u.rank <= tierConfig.challengerRank); } });
            nextTopRankers = getTopRankers(finalHeroes, tierConfig);
            nextSentiment = smoothSentiment(nextSentiment, calculateTargetSentiment(state, finalHeroes, finalPosts));
            finalPosts = updatePostInteractions(finalPosts, currentTotalMinutes);

            if (state.aiConfig && state.aiConfig.enabled && Math.random() < 0.1) {
                generatePostAsync(Date.now(), finalHeroes, tierConfig, currentTotalMinutes, state.aiConfig, userPool, state.battleSettings, state.fieldSettings).then(()=>{}).catch(()=>{});
            }
          } catch (updateError) {}
      }
    }

    return {
      stateUpdates: {
        second, minute, hour, day,
        ccu: onlineUsers,
        totalUsers: userPool.length, 
        userStatus: nextUserStatus,
        topRankers: nextTopRankers,
        godStats: nextGodStats, 
        itemStats: nextItemStats, 
        liveMatches: finalMatches,
        userSentiment: nextSentiment
      },
      newHeroes: finalHeroes,
      newPosts: finalPosts
    };
  }
}
