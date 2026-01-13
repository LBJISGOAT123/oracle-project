import { GameState, Hero, Post } from '../types';
import { updateLiveMatches } from './match/MatchUpdater';
import { createLiveMatches } from './match/MatchCreator';
import { finishMatch } from './match/MatchSettlement';
import { initUserPool, userPool, getTopRankers } from './system/UserManager'; 
import { UserActivitySystem } from './system/UserActivitySystem';
import { analyzeHeroMeta, calculateUserEcosystem } from './system/RankingSystem';
import { updatePostInteractions, generatePostAsync } from './system/CommunityEngine';
import { calculateTargetSentiment, smoothSentiment } from './system/SentimentEngine';

export class CoreEngine {
  /**
   * [메인 진입점]
   * 외부에서는 이 함수를 프레임당 1번만 호출합니다.
   * 내부적으로 시간을 쪼개어 시뮬레이션 안정성을 확보합니다.
   */
  static processTick(
    initialState: GameState,
    initialHeroes: Hero[],
    initialPosts: Post[],
    totalDelta: number,
    updateStateCallback: (updates: Partial<GameState>, newHeroes?: Hero[], newPosts?: Post[]) => void
  ) {
    try {
      // 1. 시뮬레이션에 사용할 임시 상태 변수들 (매 루프마다 갱신됨)
      let currentState = { ...initialState };
      let currentHeroes = initialHeroes;
      let currentPosts = [...initialPosts];
      
      let remainingTime = totalDelta;
      
      // [최적화] 배속에 따라 한 틱당 연산할 시간 간격(dt) 설정
      // 배속이 높을수록 dt를 키워서 연산 횟수를 줄임 (정밀도와 성능의 타협)
      let stepSize = 1.0; 
      if (initialState.gameSpeed >= 60) stepSize = 2.0;      // 60배속: 2초 단위 연산
      else if (initialState.gameSpeed >= 10) stepSize = 1.0; // 10배속: 1초 단위 연산
      else stepSize = 0.5;                                   // 1~3배속: 0.5초 단위 연산 (부드러움)

      // 2. 내부 시뮬레이션 루프 (React 렌더링 없이 순수 JS 연산만 반복)
      while (remainingTime > 0) {
        const dt = Math.min(remainingTime, stepSize);
        
        // 단일 스텝 실행
        const result = this.executeSingleStep(currentState, currentHeroes, currentPosts, dt);
        
        // 결과 갱신
        currentState = { ...currentState, ...result.stateUpdates };
        if (result.newHeroes) currentHeroes = result.newHeroes;
        if (result.newPosts) currentPosts = result.newPosts;

        remainingTime -= dt;
      }

      // 3. 최종 결과만 React State에 반영 (1 Frame = 1 Render)
      updateStateCallback(currentState, currentHeroes, currentPosts);

    } catch (err) {
      console.error("Critical Engine Error:", err);
    }
  }

  /**
   * [내부 로직] 단일 시간 스텝(dt) 만큼 게임을 진행시킵니다.
   */
  private static executeSingleStep(
    state: GameState,
    heroes: Hero[],
    posts: Post[],
    deltaSeconds: number
  ) {
    let { hour, minute, second, day, totalUsers, tierConfig, liveMatches, godStats, itemStats } = state;

    // A. 시간 흐름 처리
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

    // 유저 풀 초기화 안전장치
    if (!userPool || userPool.length === 0) {
      if (heroes.length > 0) initUserPool(heroes, totalUsers);
      return { stateUpdates: { second, minute, hour, day }, newHeroes: heroes, newPosts: posts };
    }

    // B. 유저 활동 시뮬레이션 (초당 1회 빈도로 제한하여 성능 확보)
    if (Math.floor(second) % 2 === 0) {
       UserActivitySystem.updateTraffic(hour + (minute/60), userPool);
    }

    // C. 매치 업데이트 (가장 무거운 로직)
    let updatedMatches = liveMatches;
    const nextGodStats = { ...godStats };
    const nextItemStats = { ...itemStats }; 

    try {
      // 실제 매치 로직 수행
      const updatedMatchesRaw = updateLiveMatches([...liveMatches], heroes, deltaSeconds);
      
      // 로그 관리: 너무 많이 쌓이지 않게 자름
      updatedMatches = updatedMatchesRaw.map(m => ({
          ...m,
          logs: m.logs.length > 30 ? m.logs.slice(-30) : [...m.logs],
      }));

      // 종료된 매치 정산
      const isMatchEnded = (m: any) => (m.stats.blue.nexusHp <= 0 || m.stats.red.nexusHp <= 0);
      const ongoingMatches = updatedMatches.filter(m => !isMatchEnded(m));
      const endedMatches = updatedMatches.filter(m => isMatchEnded(m));

      endedMatches.forEach(match => {
        try {
          const result = finishMatch(match, heroes, day, hour, state.battleSettings, tierConfig);
          nextGodStats.totalMatches++;
          if (result.isBlueWin) nextGodStats.danteWins++; else nextGodStats.izmanWins++;

          // 아이템 통계 갱신
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

      updatedMatches = ongoingMatches;
    } catch (matchError) {
      console.warn("Match Update Skipped:", matchError);
    }

    // D. 매치 생성 (유저 풀 기반)
    // 매 10초마다 체크 (부하 분산)
    const onlineUsers = userPool.filter(u => u && u.status !== 'OFFLINE').length;
    let finalMatches = updatedMatches;
    
    // [최적화] 대기열 체크 빈도 조절
    const shouldCheckQueue = (Math.floor(second) % 10 === 0);
    const saturation = (updatedMatches.length * 10) / Math.max(1, userPool.length);

    if (shouldCheckQueue && saturation < 0.9) {
        const idleUsers = userPool.filter(u => u && u.status === 'IDLE');
        if (idleUsers.length >= 10) {
            const newMatches = createLiveMatches(heroes, onlineUsers, Date.now(), tierConfig);
            finalMatches = [...updatedMatches, ...newMatches];
        }
    }

    // E. 주기적 랭킹/통계 업데이트 (5분마다)
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
            userPool.forEach((u, idx) => {
                if (u) {
                    u.rank = idx + 1; 
                    u.isChallenger = (u.score >= tierConfig.master && u.rank <= tierConfig.challengerRank);
                }
            });

            nextTopRankers = getTopRankers(finalHeroes, tierConfig);
            nextSentiment = smoothSentiment(nextSentiment, calculateTargetSentiment(state, finalHeroes, finalPosts));
            finalPosts = updatePostInteractions(finalPosts, currentTotalMinutes);

            const isAIReady = state.aiConfig && state.aiConfig.enabled;
            if (isAIReady && Math.random() < 0.1) {
                generatePostAsync(Date.now(), finalHeroes, tierConfig, currentTotalMinutes, state.aiConfig, userPool, state.battleSettings, state.fieldSettings)
                .then(aiPost => { 
                    // 비동기 결과는 다음 틱에 반영되거나 무시됨 (구조상 한계이나 치명적이지 않음)
                }).catch(() => {});
            }
          } catch (updateError) {
              console.warn("Periodic Update Skipped:", updateError);
          }
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
