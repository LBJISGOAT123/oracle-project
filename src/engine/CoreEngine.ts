// ==========================================
// FILE PATH: /src/engine/CoreEngine.ts
// ==========================================

import { GameState, Hero, Post } from '../types';

// [Match 관련] - match 폴더 내부
import { updateLiveMatches } from './match/MatchUpdater';
import { createLiveMatches } from './match/MatchCreator';
import { finishMatch } from './match/MatchSettlement';

// [System 관련] - ★ system 폴더로 이동됨 ★
import { initUserPool, updateUserActivity, userPool } from './system/UserManager'; // getTopRankers가 필요하면 추가
import { analyzeHeroMeta, calculateUserEcosystem } from './system/RankingSystem';
import { updatePostInteractions, generatePostAsync, generateCommentAsync } from './system/CommunityEngine';
import { calculateTargetSentiment, smoothSentiment } from './system/SentimentEngine';
import { getTopRankers } from './system/UserManager';

/**
 * 게임의 모든 시뮬레이션 계산을 담당하는 핵심 엔진입니다.
 */
export class CoreEngine {
  static processTick(
    state: GameState,
    heroes: Hero[],
    posts: Post[],
    deltaSeconds: number,
    updateStateCallback: (updates: Partial<GameState>, newHeroes?: Hero[], newPosts?: Post[]) => void
  ) {
    let { hour, minute, second, day, totalUsers, tierConfig, liveMatches, godStats, itemStats } = state;

    // 1. 시간 흐름 처리
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

    // 2. 유저 성장
    let nextTotalUsers = totalUsers;
    if (isNewHour) {
      const growth = Math.floor(Math.random() * 5) + 1 + Math.floor(totalUsers * 0.0005);
      nextTotalUsers += growth;
    }

    if (userPool.length === 0) initUserPool(heroes, nextTotalUsers);
    if (isNewMinute || liveMatches.length === 0) updateUserActivity(hour, heroes);

    // 3. 매치 업데이트 (라이브 시뮬레이션)
    let nextHeroes = [...heroes];
    const updatedMatchesRaw = updateLiveMatches([...liveMatches], nextHeroes, deltaSeconds);

    const updatedMatches = updatedMatchesRaw.map(m => ({
        ...m,
        logs: m.logs.length > 60 ? m.logs.slice(-60) : [...m.logs],
        blueTeam: [...m.blueTeam],
        redTeam: [...m.redTeam]
    }));

    // 4. 게임 종료 및 정산
    const isMatchEnded = (m: any) => (m.stats.blue.nexusHp <= 0 || m.stats.red.nexusHp <= 0);
    const ongoingMatches = updatedMatches.filter(m => !isMatchEnded(m));
    const endedMatches = updatedMatches.filter(m => isMatchEnded(m));

    const nextGodStats = { ...godStats };
    const nextItemStats = { ...itemStats }; 

    endedMatches.forEach(match => {
        const result = finishMatch(match, nextHeroes, day, hour, state.battleSettings, tierConfig);
        nextGodStats.totalMatches++;
        if (result.isBlueWin) nextGodStats.danteWins++; else nextGodStats.izmanWins++;

        [...match.blueTeam, ...match.redTeam].forEach(p => {
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
    });

    const onlineUsers = userPool.filter(u => u.status !== 'OFFLINE').length;

    // 5. 새 매치 생성
    let finalMatches = ongoingMatches;
    const shouldCreate = (Math.floor(second) % 10 === 0 && Math.floor(second) !== Math.floor(state.second)) || ongoingMatches.length === 0;

    if (shouldCreate) {
        const idleUsers = userPool.filter(u => u.status === 'IDLE');
        if (idleUsers.length >= 10) {
            const newMatches = createLiveMatches(nextHeroes, onlineUsers, Date.now(), tierConfig);
            finalMatches = [...ongoingMatches, ...newMatches];
        }
    }

    // 6. 분 단위 통계 및 커뮤니티 업데이트
    let finalHeroes = nextHeroes;
    let finalPosts = [...posts];
    let nextUserStatus = state.userStatus;
    let nextTopRankers = state.topRankers;
    let nextSentiment = state.userSentiment;

    if (isNewMinute) {
        finalHeroes = analyzeHeroMeta(nextHeroes);
        nextUserStatus = calculateUserEcosystem(onlineUsers, nextTotalUsers, tierConfig);

        const sortedUsers = [...userPool].sort((a, b) => b.score - a.score);
        sortedUsers.forEach((u, idx) => {
            u.rank = idx + 1; 
            u.isChallenger = (u.score >= tierConfig.master && u.rank <= tierConfig.challengerRank);
        });

        nextTopRankers = getTopRankers(finalHeroes, tierConfig);
        nextSentiment = smoothSentiment(nextSentiment, calculateTargetSentiment(state, finalHeroes, finalPosts));
        finalPosts = updatePostInteractions(finalPosts, currentTotalMinutes);

        // AI 글/댓글 작성
        const isAIReady = state.aiConfig && state.aiConfig.enabled;

        // [글 작성]
        if (isAIReady && Math.random() < 0.1) {
            generatePostAsync(Date.now(), finalHeroes, tierConfig, currentTotalMinutes, state.aiConfig, userPool, state.battleSettings, state.fieldSettings)
            .then(aiPost => {
                if (aiPost) {
                    updateStateCallback({}, undefined, [aiPost, ...finalPosts].slice(0, 150));
                }
            });
        }

        // [댓글 작성]
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
                });
            }
        }
    }

    // 최종 상태 반환
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
  }
}