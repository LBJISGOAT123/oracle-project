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
  static processTick(
    initialState: GameState,
    initialHeroes: Hero[],
    initialPosts: Post[],
    totalDelta: number,
    baseStepSize: number, 
    updateStateCallback: (
        updates: Partial<GameState>, 
        newHeroes: Hero[], 
        newPosts: Post[], 
        remainingTime: number
    ) => void
  ) {
    try {
      let currentState = { ...initialState };
      let currentHeroes = initialHeroes;
      let currentPosts = [...initialPosts];
      
      let remainingTime = totalDelta;
      let currentStep = baseStepSize;
      
      if (remainingTime > 600) currentStep = 10.0;      
      else if (remainingTime > 60) currentStep = 1.0;   
      else if (remainingTime > 5) currentStep = 0.5;    

      let loopCount = 0;
      const MAX_LOOPS = 200; 

      while (remainingTime >= currentStep && loopCount < MAX_LOOPS) {
        const result = this.executeSingleStep(currentState, currentHeroes, currentPosts, currentStep);
        currentState = { ...currentState, ...result.stateUpdates };
        if (result.newHeroes) currentHeroes = result.newHeroes;
        if (result.newPosts) currentPosts = result.newPosts;
        remainingTime -= currentStep;
        loopCount++;
      }
      updateStateCallback(currentState, currentHeroes, currentPosts, remainingTime);
    } catch (err) { console.error("Critical Engine Error:", err); }
  }

  private static executeSingleStep(state: GameState, heroes: Hero[], posts: Post[], deltaSeconds: number) {
    let { hour, minute, second, day, totalUsers, tierConfig, liveMatches, godStats, itemStats } = state;

    second += deltaSeconds;
    if (second >= 60) {
      const extraMinutes = Math.floor(second / 60); second %= 60; minute += extraMinutes;
      if (minute >= 60) {
        const extraHours = Math.floor(minute / 60); minute %= 60; hour += extraHours;
        if (hour >= 24) { const extraDays = Math.floor(hour / 24); hour %= 24; day += extraDays; }
      }
    }
    const currentTotalMinutes = day * 1440 + hour * 60 + Math.floor(minute);
    const isNewMinute = Math.floor(minute) !== Math.floor(state.minute);
    const isNewHour = Math.floor(hour) !== Math.floor(state.hour);
    const onlineCount = userPool ? userPool.filter(u => u.status !== 'OFFLINE').length : 0;

    if (!userPool || userPool.length === 0) {
      if (heroes.length > 0) initUserPool(heroes, totalUsers);
      return { stateUpdates: { second, minute, hour, day, ccu: 0 }, newHeroes: heroes, newPosts: posts };
    }
    if (isNewMinute && Math.floor(minute) % 10 === 0) UserActivitySystem.updateTraffic(hour + (minute/60), userPool);

    let updatedMatches = [...liveMatches];
    const nextGodStats = { ...godStats };
    const nextItemStats = { ...itemStats }; 

    try {
      updatedMatches = updateLiveMatches(updatedMatches, heroes, deltaSeconds);
      
      // [AutoFix & Zombie Killer]
      // 데이터 무결성 검사 + 체력 음수인 놈 강제 사망 처리
      updatedMatches.forEach(match => {
          [...match.blueTeam, ...match.redTeam].forEach(p => {
              // HP NaN 복구
              if (isNaN(p.currentHp) || p.currentHp === Infinity) {
                  p.currentHp = p.respawnTimer > 0 ? 0 : (p.maxHp || 1000);
              }
              if (isNaN(p.maxHp) || p.maxHp <= 0) p.maxHp = 1000;
              
              // [핵심] 좀비 처리: 체력이 0 이하인데 살아있다고(respawnTimer 0) 우기면 죽여버림
              if (p.currentHp <= 0 && p.respawnTimer <= 0) {
                  p.currentHp = 0;
                  p.deaths++;
                  p.respawnTimer = 10 + (p.level * 3); // 강제 부활 타이머
                  
                  // 로그는 남기지 않음 (자연사 처리)
              }

              // MP NaN 복구 & Clamp
              if (isNaN(p.currentMp)) p.currentMp = 0;
              if (isNaN(p.maxMp)) p.maxMp = 300;
              if (p.currentHp > p.maxHp) p.currentHp = p.maxHp;
              if (p.currentMp > p.maxMp) p.currentMp = p.maxMp;

              if (isNaN(p.gold)) p.gold = 0;
              if (isNaN(p.totalGold)) p.totalGold = p.gold;
              if (isNaN(p.x)) p.x = 50; 
              if (isNaN(p.y)) p.y = 50;
          });
      });

      const isMatchEnded = (m: any) => (m.stats.blue.nexusHp <= 0 || m.stats.red.nexusHp <= 0);
      const endedMatches = updatedMatches.filter(m => isMatchEnded(m));
      updatedMatches = updatedMatches.filter(m => !isMatchEnded(m));

      endedMatches.forEach(match => {
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
      });
    } catch (matchError) { console.warn("Match Update Skipped:", matchError); }

    if (Math.floor(second) % 10 === 0 && Math.floor(second - deltaSeconds) % 10 !== 0) { 
        const limit = state.maxMatches || 10;
        if (updatedMatches.length < limit) {
            const idleUsers = userPool.filter(u => u && u.status === 'IDLE');
            const spaceAvailable = limit - updatedMatches.length;
            if (idleUsers.length >= 10 && spaceAvailable > 0) {
                const newMatches = createLiveMatches(heroes, onlineCount, Date.now(), tierConfig);
                updatedMatches = [...updatedMatches, ...newMatches.slice(0, spaceAvailable)];
            }
        }
    }

    let finalHeroes = heroes;
    let finalPosts = posts;
    let nextUserStatus = state.userStatus;
    let nextTopRankers = state.topRankers;
    let nextSentiment = state.userSentiment;

    if (isNewHour) { 
      if (userPool.length > 0) {
          try {
            finalHeroes = analyzeHeroMeta([...heroes]);
            nextUserStatus = calculateUserEcosystem(onlineCount, userPool.length, tierConfig);
            userPool.sort((a, b) => (b.score || 0) - (a.score || 0));
            userPool.forEach((u, idx) => { if(u) { u.rank = idx + 1; u.isChallenger = (u.score >= tierConfig.master && u.rank <= tierConfig.challengerRank); } });
            nextTopRankers = getTopRankers(finalHeroes, tierConfig);
            nextSentiment = smoothSentiment(nextSentiment, calculateTargetSentiment(state, finalHeroes, finalPosts));
            if (state.aiConfig && state.aiConfig.enabled && Math.random() < 0.5) generatePostAsync(Date.now(), finalHeroes, tierConfig, currentTotalMinutes, state.aiConfig, userPool, state.battleSettings, state.fieldSettings).then(()=>{}).catch(()=>{});
          } catch (updateError) {}
      }
    }
    if (isNewMinute && Math.floor(minute) % 10 === 0) finalPosts = updatePostInteractions(finalPosts, currentTotalMinutes);

    return {
      stateUpdates: {
        second, minute, hour, day, totalUsers: userPool.length, ccu: onlineCount, 
        userStatus: nextUserStatus, topRankers: nextTopRankers, godStats: nextGodStats, 
        itemStats: nextItemStats, liveMatches: updatedMatches, userSentiment: nextSentiment
      },
      newHeroes: finalHeroes, newPosts: finalPosts
    };
  }
}
