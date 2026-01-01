// ==========================================
// FILE PATH: /src/store/slices/gameSlice.ts
// ==========================================
import { StateCreator } from 'zustand';
import { GameStore, GameSlice } from '../types';
import { INITIAL_HEROES } from '../../data/heroes';
import { INITIAL_ITEMS } from '../../data/items';
import { GameState, Hero } from '../../types';
import { JUNGLE_CONFIG } from '../../data/jungle';
import { INITIAL_CUSTOM_IMAGES } from '../../data/initialImages';

import { createLiveMatches, finishMatch, updateLiveMatches } from '../../engine/MatchEngine';
import { initUserPool, updateUserActivity, getTopRankers, userPool } from '../../engine/UserManager';
import { analyzeHeroMeta, calculateUserEcosystem } from '../../engine/RankingSystem';
import { updatePostInteractions, generatePostAsync } from '../../engine/CommunityEngine';
import { calculateTargetSentiment, smoothSentiment } from '../../engine/SentimentEngine';

const initialGameState: GameState = {
  season: 1, day: 1, hour: 12, minute: 0, second: 0,
  isPlaying: false, gameSpeed: 1,
  userSentiment: 60, 
  ccu: 0, 
  totalUsers: 3000, 
  userStatus: { totalGames: 0, playingUsers: 0, queuingUsers: 0, avgWaitTime: 0, tierDistribution: [] },
  topRankers: [],
  godStats: { totalMatches: 0, izmanWins: 0, izmanAvgKills: '0.0', izmanAvgTime: '00:00', danteWins: 0, danteAvgKills: '0.0', danteAvgTime: '00:00', avgGameDuration: 0, guardianDeathRate: 0, godAwakenRate: 0 },
  itemStats: {},
  liveMatches: [],
  tierConfig: { 
    challengerRank: 200, 
    master: 4800, ace: 3800, joker: 3200, gold: 2100, silver: 1300, bronze: 300,
    promos: { master: 5, ace: 5, joker: 5, gold: 3, silver: 3, bronze: 3 }
  },
  battleSettings: {
    izman: { 
      name: '이즈마한', atkRatio: 1, defRatio: 1, hpRatio: 10000, 
      guardianHp: 25000, towerAtk: 100, trait: '광란', servantGold: 14, servantXp: 30, 
      minions: { melee: { label: '광신도', hp: 550, def: 10, atk: 25, gold: 21, xp: 60 }, ranged: { label: '암흑 사제', hp: 350, def: 0, atk: 45, gold: 14, xp: 30 }, siege: { label: '암흑기사', hp: 950, def: 40, atk: 70, gold: 60, xp: 90 } } 
    },
    dante: { 
      name: '단테', atkRatio: 1, defRatio: 1, hpRatio: 10000, 
      guardianHp: 25000, towerAtk: 100, trait: '가호', servantGold: 14, servantXp: 30, 
      minions: { melee: { label: '수도사', hp: 550, def: 10, atk: 25, gold: 21, xp: 60 }, ranged: { label: '구도자', hp: 350, def: 0, atk: 45, gold: 14, xp: 30 }, siege: { label: '성전사', hp: 950, def: 40, atk: 70, gold: 60, xp: 90 } } 
    },
    economy: { minionGold: 14, minionXp: 30 }
  },
  fieldSettings: {
    // [밸런스 패치] 포탑 내구도 대폭 상향 (3000 -> 10000, 방어 50 -> 150)
    tower: { hp: 10000, armor: 150, rewardGold: 150 },
    colossus: { hp: 8000, armor: 80, rewardGold: 100, attack: 50, respawnTime: 300 },
    watcher: { hp: 12000, armor: 120, rewardGold: 150, buffType: 'COMBAT', buffAmount: 20, buffDuration: 180, respawnTime: 420 },
    jungle: JUNGLE_CONFIG.DEFAULT_SETTINGS
  },
  roleSettings: {
    executor: { damage: 10, defense: 10 },
    tracker: { gold: 20, smiteChance: 1.5 },
    prophet: { cdrPerLevel: 2 },
    slayer: { structureDamage: 30 },
    guardian: { survivalRate: 20 }
  },
  aiConfig: { provider: 'GEMINI', apiKey: '', model: 'gemini-2.5-flash', enabled: false },
  customImages: INITIAL_CUSTOM_IMAGES 
};

export const createGameSlice: StateCreator<GameStore, [], [], GameSlice> = (set, get) => ({
  gameState: initialGameState,

  setSpeed: (s) => set((state) => ({ gameState: { ...state.gameState, gameSpeed: s } })),
  togglePlay: () => set((state) => ({ gameState: { ...state.gameState, isPlaying: !state.gameState.isPlaying } })),
  setGameState: (updates) => set((state) => ({ gameState: { ...state.gameState, ...updates } })),

  updateBattleSettings: (s) => set((state) => ({ gameState: { ...state.gameState, battleSettings: { ...state.gameState.battleSettings, ...s } } })),
  updateFieldSettings: (s) => set((state) => ({ gameState: { ...state.gameState, fieldSettings: { ...state.gameState.fieldSettings, ...s } } })),
  updateTierConfig: (c) => set((state) => ({ gameState: { ...state.gameState, tierConfig: c } })),
  updateAIConfig: (c) => set((state) => ({ gameState: { ...state.gameState, aiConfig: { ...state.gameState.aiConfig, ...c } } })),
  updateRoleSettings: (s) => set((state) => ({ gameState: { ...state.gameState, roleSettings: { ...state.gameState.roleSettings, ...s } } })),

  setCustomImage: (id, imageData) => set((state) => ({
    gameState: { ...state.gameState, customImages: { ...state.gameState.customImages, [id]: imageData } }
  })),

  removeCustomImage: (id) => set((state) => {
    const newImages = { ...state.gameState.customImages };
    delete newImages[id];
    return { gameState: { ...state.gameState, customImages: newImages } };
  }),

  loadModData: (modData: any) => set((state) => {
    const currentHeroesMap = new Map(state.heroes.map(h => [h.id, h]));
    const newHeroes: Hero[] = modData.heroes.map((modHero: Hero) => {
      const existingHero = currentHeroesMap.get(modHero.id);
      if (existingHero) {
        return { ...modHero, record: existingHero.record, tier: existingHero.tier, rank: existingHero.rank, recentWinRate: existingHero.recentWinRate, avgKda: existingHero.avgKda };
      } else {
        return modHero;
      }
    });
    const newGameState = {
      ...state.gameState,
      battleSettings: modData.settings?.battle || state.gameState.battleSettings,
      fieldSettings: modData.settings?.field || state.gameState.fieldSettings,
      roleSettings: modData.settings?.role || state.gameState.roleSettings,
      customImages: { ...state.gameState.customImages, ...(modData.images || {}) }
    };
    return { heroes: newHeroes, shopItems: modData.items || state.shopItems, gameState: newGameState };
  }),

  tick: (deltaSeconds: number) => {
    const state = get();
    if (!state.gameState || !state.gameState.isPlaying) return;

    const { heroes, gameState, communityPosts } = state;
    let { hour, minute, second, day, totalUsers, tierConfig, liveMatches } = gameState;

    // 1. 시간 누적
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
    const prevTotalMinutes = gameState.day * 1440 + gameState.hour * 60 + Math.floor(gameState.minute);
    const isNewMinute = currentTotalMinutes > prevTotalMinutes;
    const isNewHour = hour !== gameState.hour;

    // 2. 유저 성장
    let nextTotalUsers = totalUsers;
    if (isNewHour) {
      const growth = Math.floor(Math.random() * 5) + 1 + Math.floor(totalUsers * 0.0005);
      nextTotalUsers += growth;
    }

    if (userPool.length === 0) initUserPool(heroes, nextTotalUsers);
    if (isNewMinute || liveMatches.length === 0) updateUserActivity(hour, heroes);

    // 3. 매치 업데이트
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

    const nextGodStats = { ...gameState.godStats };
    const nextItemStats = { ...gameState.itemStats }; 

    endedMatches.forEach(match => {
        const result = finishMatch(match, nextHeroes, day, hour, gameState.battleSettings, tierConfig);
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

    // 5. 매치 생성
    let finalMatches = ongoingMatches;
    const shouldCreate = (Math.floor(second) % 10 === 0 && Math.floor(second) !== Math.floor(gameState.second)) || ongoingMatches.length === 0;

    if (shouldCreate) {
        const idleUsers = userPool.filter(u => u.status === 'IDLE');
        if (idleUsers.length >= 10) {
            const newMatches = createLiveMatches(nextHeroes, onlineUsers, Date.now(), tierConfig);
            finalMatches = [...ongoingMatches, ...newMatches];
        }
    }

    // 6. 분 단위 통계 업데이트
    let analyzedHeroes = nextHeroes;
    let userStatus = gameState.userStatus;
    let topRankers = gameState.topRankers;
    let newSentiment = gameState.userSentiment;
    let nextPosts = [...communityPosts];

    if (isNewMinute) {
        analyzedHeroes = analyzeHeroMeta(nextHeroes);
        userStatus = calculateUserEcosystem(onlineUsers, nextTotalUsers, tierConfig);

        const sortedUsers = [...userPool].sort((a, b) => b.score - a.score);
        sortedUsers.forEach((u, idx) => {
            u.rank = idx + 1; 
            u.isChallenger = (u.score >= tierConfig.master && u.rank <= tierConfig.challengerRank);
        });

        topRankers = getTopRankers(analyzedHeroes, tierConfig);
        newSentiment = smoothSentiment(newSentiment, calculateTargetSentiment(gameState, analyzedHeroes, communityPosts));
        nextPosts = updatePostInteractions(nextPosts, currentTotalMinutes);

        const isAIReady = gameState.aiConfig && gameState.aiConfig.enabled && gameState.aiConfig.apiKey;
        if (isAIReady && Math.random() < 0.1) {
            generatePostAsync(Date.now(), analyzedHeroes, tierConfig, currentTotalMinutes, gameState.aiConfig, userPool, gameState.battleSettings, gameState.fieldSettings)
            .then(aiPost => {
                if (aiPost) set(prev => ({ communityPosts: [aiPost, ...prev.communityPosts].slice(0, 150) }));
            });
        }
    }

    set({
      heroes: analyzedHeroes,
      communityPosts: nextPosts,
      gameState: {
        ...gameState,
        second, minute, hour, day,
        ccu: onlineUsers,
        totalUsers: nextTotalUsers,
        userStatus,
        topRankers,
        godStats: nextGodStats, 
        itemStats: nextItemStats, 
        liveMatches: finalMatches,
        userSentiment: newSentiment
      }
    });
  },

  hardReset: () => {
    const currentAI = get().gameState.aiConfig;
    userPool.length = 0; 
    set({
      gameState: { ...initialGameState, aiConfig: currentAI },
      heroes: INITIAL_HEROES,
      shopItems: INITIAL_ITEMS,
      communityPosts: [],     
      selectedPost: null
    });
  }
});
