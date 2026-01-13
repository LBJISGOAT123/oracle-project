import { GameState, Hero, Post } from '../types';
import { updateLiveMatches } from './match/MatchUpdater';
import { createLiveMatches } from './match/MatchCreator';
import { finishMatch } from './match/MatchSettlement';
import { initUserPool, updateUserActivity, userPool, getTopRankers } from './system/UserManager'; 
import { analyzeHeroMeta, calculateUserEcosystem } from './system/RankingSystem';
import { updatePostInteractions, generatePostAsync, generateCommentAsync } from './system/CommunityEngine';
import { calculateTargetSentiment, smoothSentiment } from './system/SentimentEngine';

export class CoreEngine {
  static processTick(
    state: GameState,
    heroes: Hero[],
    posts: Post[],
    deltaSeconds: number,
    updateStateCallback: (updates: Partial<GameState>, newHeroes?: Hero[], newPosts?: Post[]) => void
  ) {
    try {
      let { hour, minute, second, day, totalUsers, tierConfig, liveMatches, godStats, itemStats } = state;

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
      const isNewHour = hour !== state.hour;

      if (!userPool || userPool.length === 0) {
        if (heroes.length > 0) initUserPool(heroes, totalUsers);
        updateStateCallback({ second, minute, hour, day }, heroes, posts);
        return; 
      }

      let nextTotalUsers = totalUsers;
      if (isNewHour) {
        const growth = Math.floor(Math.random() * 5) + 1;
        nextTotalUsers += growth;
      }

      if (isNewMinute || liveMatches.length === 0) updateUserActivity(hour, heroes);

      let nextHeroes = [...heroes];
      let updatedMatches = liveMatches;
      
      try {
        const updatedMatchesRaw = updateLiveMatches([...liveMatches], nextHeroes, deltaSeconds);
        updatedMatches = updatedMatchesRaw.map(m => ({
            ...m,
            logs: m.logs.length > 30 ? m.logs.slice(-30) : [...m.logs],
            blueTeam: [...m.blueTeam],
            redTeam: [...m.redTeam]
        }));
      } catch (matchError) {
        console.warn("Match Update Skipped:", matchError);
      }

      const isMatchEnded = (m: any) => (m.stats.blue.nexusHp <= 0 || m.stats.red.nexusHp <= 0);
      const ongoingMatches = updatedMatches.filter(m => !isMatchEnded(m));
      const endedMatches = updatedMatches.filter(m => isMatchEnded(m));

      const nextGodStats = { ...godStats };
      const nextItemStats = { ...itemStats }; 

      // [CRITICAL FIX] 매치 종료 처리를 Try-Catch로 보호 (3초 뒤 튕김 원인)
      endedMatches.forEach(match => {
        try {
          const result = finishMatch(match, nextHeroes, day, hour, state.battleSettings, tierConfig);
          nextGodStats.totalMatches++;
          if (result.isBlueWin) nextGodStats.danteWins++; else nextGodStats.izmanWins++;

          [...match.blueTeam, ...match.redTeam].forEach(p => {
              if(!p.items) return;
              p.items.forEach((item: any) => {
                  if (!nextItemStats[item.id]) {
                      nextItemStats[item.id] = { itemId: item.id, totalPicks: 0, totalWins: 0, totalKills: 0, totalDeaths: 0, totalAssists: 0 };
                  }
                  const st = nextItemStats[item.id];
                  st.totalPicks++;
                  const isWin = (match.blueTeam.includes(p) && result.isBlueWin) || (match.redTeam.includes(p) && !result.isBlueWin);
                  if (isWin) st.totalWins++;
                  st.totalKills += p.kills; st.totalDeaths += p.deaths; st.totalAssists += p.assists;
              });
          });
        } catch (settleError) {
            console.error("Match Settlement Failed (Skipped):", settleError);
        }
      });

      const onlineUsers = userPool.filter(u => u && u.status !== 'OFFLINE').length;

      let finalMatches = ongoingMatches;
      const shouldCreate = (Math.floor(second) % 10 === 0 && Math.floor(second) !== Math.floor(state.second)) || ongoingMatches.length === 0;

      if (shouldCreate) {
          const idleUsers = userPool.filter(u => u && u.status === 'IDLE');
          if (idleUsers.length >= 10) {
              const newMatches = createLiveMatches(nextHeroes, onlineUsers, Date.now(), tierConfig);
              finalMatches = [...ongoingMatches, ...newMatches];
          }
      }

      let finalHeroes = nextHeroes;
      let finalPosts = [...posts];
      let nextUserStatus = state.userStatus;
      let nextTopRankers = state.topRankers;
      let nextSentiment = state.userSentiment;

      if (isNewMinute && Math.floor(minute) % 5 === 0) { 
        if (userPool.length > 0) {
            try {
              finalHeroes = analyzeHeroMeta(nextHeroes);
              nextUserStatus = calculateUserEcosystem(onlineUsers, nextTotalUsers, tierConfig);

              userPool.sort((a, b) => (b.score || 0) - (a.score || 0));
              userPool.forEach((u, idx) => {
                  if (u) {
                      u.rank = idx + 1; 
                      const config = tierConfig || { master: 4800, challengerRank: 50 };
                      u.isChallenger = (u.score >= config.master && u.rank <= config.challengerRank);
                  }
              });

              nextTopRankers = getTopRankers(finalHeroes, tierConfig);
              nextSentiment = smoothSentiment(nextSentiment, calculateTargetSentiment(state, finalHeroes, finalPosts));
              finalPosts = updatePostInteractions(finalPosts, currentTotalMinutes);

              const isAIReady = state.aiConfig && state.aiConfig.enabled;

              if (isAIReady && Math.random() < 0.1) {
                  generatePostAsync(Date.now(), finalHeroes, tierConfig, currentTotalMinutes, state.aiConfig, userPool, state.battleSettings, state.fieldSettings)
                  .then(aiPost => {
                      if (aiPost) {
                          updateStateCallback({}, undefined, [aiPost, ...finalPosts].slice(0, 150));
                      }
                  }).catch(() => {});
              }

              if (isAIReady && finalPosts.length > 0 && Math.random() < 0.6) {
                  const activePosts = finalPosts.filter(p => (currentTotalMinutes - p.createdAt) < 180);
                  if (activePosts.length > 0) {
                      const targetPost = activePosts[Math.floor(Math.random() * activePosts.length)];
                      generateCommentAsync(targetPost, state.aiConfig, userPool, tierConfig)
                      .then(newComment => {
                          if (newComment) {
                              updateStateCallback({}, undefined, finalPosts.map(p => 
                                  p.id === targetPost.id ? { ...p, comments: p.comments + 1, commentList: [...p.commentList, newComment] } : p
                              ));
                          }
                      }).catch(() => {});
                  }
              }
            } catch (updateError) {
                console.warn("Periodic Update Skipped:", updateError);
            }
        }
      }

      updateStateCallback({
          second, minute, hour, day,
          ccu: onlineUsers,
          totalUsers: nextTotalUsers,
          userStatus: nextUserStatus,
          topRankers: nextTopRankers,
          godStats: nextGodStats, 
          itemStats: nextItemStats, 
          liveMatches: finalMatches,
          userSentiment: nextSentiment
      }, finalHeroes, finalPosts);

    } catch (err) {
      console.error("Critical Engine Error (Recovered):", err);
    }
  }
}
