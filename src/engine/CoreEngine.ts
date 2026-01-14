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

// [핵심] 
// 1. 고정 타임 스텝: 0.1초 (10 FPS 정밀도)
// 2. 최대 루프: 36000 (1시간을 0.1초로 쪼개도 소화 가능하도록 대폭 상향)
const FIXED_STEP = 0.1; 
const MAX_STEPS = 36000; 

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
      let loopCount = 0;

      // [수정] 남은 시간이 FIXED_STEP보다 작아질 때까지 무조건 반복
      // "1분"을 누르면 이 루프가 600번 돕니다. (컴퓨터에겐 순식간임)
      while (remainingTime >= FIXED_STEP && loopCount < MAX_STEPS) {
        
        // 무조건 0.1초씩만 진행
        const result = this.executeSingleStep(currentState, currentHeroes, currentPosts, FIXED_STEP);
        
        currentState = { ...currentState, ...result.stateUpdates };
        if (result.newHeroes) currentHeroes = result.newHeroes;
        if (result.newPosts) currentPosts = result.newPosts;

        remainingTime -= FIXED_STEP;
        loopCount++;
      }

      // 0.1초 미만의 자투리 시간 처리 (예: 0.04초)
      // 이 정도는 순간이동해도 타워 사거리를 못 벗어나므로 안전함
      if (remainingTime > 0) {
           const result = this.executeSingleStep(currentState, currentHeroes, currentPosts, remainingTime);
           currentState = { ...currentState, ...result.stateUpdates };
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

    // B. 유저 활동 (1분 단위)
    if (isNewMinute) {
       UserActivitySystem.updateTraffic(hour + (minute/60), userPool);
    }

    // C. 매치 업데이트
    let updatedMatches = [...liveMatches];
    const nextGodStats = { ...godStats };
    const nextItemStats = { ...itemStats }; 

    try {
      const processedMatches = updateLiveMatches(updatedMatches, heroes, deltaSeconds);
      
      updatedMatches = processedMatches.map(m => ({
          ...m,
          logs: m.logs.length > 15 ? m.logs.slice(-15) : [...m.logs],
      }));

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

    // D. 매치 생성
    if (Math.floor(second) % 10 === 0 && Math.floor(second - deltaSeconds) % 10 !== 0) { 
        if (updatedMatches.length < 60) {
            const onlineUsers = userPool.filter(u => u && u.status !== 'OFFLINE').length;
            const idleUsers = userPool.filter(u => u && u.status === 'IDLE');
            if (idleUsers.length >= 10) {
                const newMatches = createLiveMatches(heroes, onlineUsers, Date.now(), tierConfig);
                updatedMatches = [...updatedMatches, ...newMatches.slice(0, 3)];
            }
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
            const onlineUsers = userPool.filter(u => u && u.status !== 'OFFLINE').length;
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
        totalUsers: userPool.length, 
        userStatus: nextUserStatus,
        topRankers: nextTopRankers,
        godStats: nextGodStats, 
        itemStats: nextItemStats, 
        liveMatches: updatedMatches,
        userSentiment: nextSentiment
      },
      newHeroes: finalHeroes,
      newPosts: finalPosts
    };
  }
}
