// ==========================================
// FILE PATH: /src/store/slices/gameSlice.ts
// ==========================================

import { StateCreator } from 'zustand';
import { GameStore, GameSlice } from '../types';
import { INITIAL_HEROES } from '../../data/heroes';
import { INITIAL_ITEMS } from '../../data/items';
import { GameState } from '../../types';
import { JUNGLE_CONFIG } from '../../data/jungle';
import { Hero } from '../../types';
import { INITIAL_CUSTOM_IMAGES } from '../../data/initialImages';

import { createLiveMatches, finishMatch, updateLiveMatches } from '../../engine/MatchEngine';
import { initUserPool, updateUserActivity, getTopRankers, userPool } from '../../engine/UserManager';
import { analyzeHeroMeta, calculateUserEcosystem } from '../../engine/RankingSystem';
import { updatePostInteractions, generatePostAsync, generateCommentAsync } from '../../engine/CommunityEngine';
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
    promos: {
      master: 5, ace: 5, joker: 5, gold: 3, silver: 3, bronze: 3
    }
  },

  battleSettings: {
    izman: { name: '이즈마한', atkRatio: 1, defRatio: 1, hpRatio: 10000, guardianHp: 5000, towerAtk: 100, trait: '광란', servantGold: 14, servantXp: 30, minions: { melee: { label: '광신도', hp: 550, def: 10, atk: 25, gold: 21, xp: 60 }, ranged: { label: '암흑 사제', hp: 350, def: 0, atk: 45, gold: 14, xp: 30 }, siege: { label: '암흑기사', hp: 950, def: 40, atk: 70, gold: 60, xp: 90 } } },
    dante: { name: '단테', atkRatio: 1, defRatio: 1, hpRatio: 10000, guardianHp: 5000, towerAtk: 100, trait: '가호', servantGold: 14, servantXp: 30, minions: { melee: { label: '수도사', hp: 550, def: 10, atk: 25, gold: 21, xp: 60 }, ranged: { label: '구도자', hp: 350, def: 0, atk: 45, gold: 14, xp: 30 }, siege: { label: '성전사', hp: 950, def: 40, atk: 70, gold: 60, xp: 90 } } },
    economy: { minionGold: 14, minionXp: 30 }
  },
  fieldSettings: {
    tower: { hp: 3000, armor: 50, rewardGold: 80 },
    colossus: { hp: 8000, armor: 80, rewardGold: 100, attack: 50 },
    watcher: { hp: 12000, armor: 120, rewardGold: 150, buffType: 'COMBAT', buffAmount: 20, buffDuration: 180 },
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
    const { hour, minute, second, day, totalUsers, tierConfig, liveMatches } = gameState;

    let ns = (second || 0) + deltaSeconds;
    let nm = minute, nh = hour, nd = day;

    while (ns >= 60) { ns -= 60; nm++; }
    while (nm >= 60) { nm -= 60; nh++; }
    while (nh >= 24) { nh -= 24; nd++; }

    const isNewMinute = minute !== nm;
    const isNewHour = hour !== nh;
    const currentTotalMinutes = (nd * 1440) + (nh * 60) + nm;

    // 가입자 자연 증가
    let nextTotalUsers = totalUsers;
    if (isNewHour) {
      const growth = Math.floor(Math.random() * 5) + 1 + Math.floor(totalUsers * 0.0005);
      nextTotalUsers += growth;
    }

    // 유저 풀 및 활동 갱신
    if (isNewMinute) {
        if (userPool.length < nextTotalUsers) {
            initUserPool(heroes, nextTotalUsers);
        }
        updateUserActivity(nh, heroes);
    }

    let nextHeroes = [...heroes];
    let updatedMatches = updateLiveMatches([...liveMatches], nextHeroes, deltaSeconds);

    const ongoingMatches = updatedMatches.filter(m => m.currentDuration < m.duration);
    const endedMatches = updatedMatches.filter(m => m.currentDuration >= m.duration);

    const nextGodStats = { ...gameState.godStats };
    const nextItemStats = { ...gameState.itemStats }; 

    endedMatches.forEach(match => {
        // [수정] 여기서 tierConfig를 인자로 넘겨줍니다.
        const result = finishMatch(match, nextHeroes, nd, nh, gameState.battleSettings, tierConfig);

        nextGodStats.totalMatches++;
        if (result.isBlueWin) nextGodStats.danteWins++; else nextGodStats.izmanWins++;

        const prevIzmanKills = parseFloat(nextGodStats.izmanAvgKills) * (nextGodStats.totalMatches - 1);
        const prevDanteKills = parseFloat(nextGodStats.danteAvgKills) * (nextGodStats.totalMatches - 1);
        nextGodStats.izmanAvgKills = ((prevIzmanKills + result.redKills) / nextGodStats.totalMatches).toFixed(1);
        nextGodStats.danteAvgKills = ((prevDanteKills + result.blueKills) / nextGodStats.totalMatches).toFixed(1);

        const processItemStats = (players: any[], isWin: boolean) => {
            players.forEach(p => {
                p.items.forEach((item: any) => {
                    if (!nextItemStats[item.id]) {
                        nextItemStats[item.id] = { itemId: item.id, totalPicks: 0, totalWins: 0, totalKills: 0, totalDeaths: 0, totalAssists: 0 };
                    }
                    const stat = nextItemStats[item.id];
                    stat.totalPicks++;
                    if (isWin) stat.totalWins++;
                    stat.totalKills += p.kills;
                    stat.totalDeaths += p.deaths;
                    stat.totalAssists += p.assists;
                });
            });
        };
        processItemStats(match.blueTeam, result.isBlueWin);
        processItemStats(match.redTeam, !result.isBlueWin);
    });

    const onlineUsers = userPool.filter(u => u.status !== 'OFFLINE').length;
    let finalMatches = ongoingMatches;

    if (ns % 10 < deltaSeconds) {
        const idleUsers = userPool.filter(u => u.status === 'IDLE');
        if (idleUsers.length >= 10 && ongoingMatches.length < 50) {
            const newMatches = createLiveMatches(nextHeroes, onlineUsers, Date.now(), tierConfig);
            finalMatches = [...ongoingMatches, ...newMatches];
        }
    }

    let analyzedHeroes = nextHeroes;
    let userStatus = gameState.userStatus;
    let topRankers = gameState.topRankers;
    let newSentiment = gameState.userSentiment;

    if (isNewMinute) {
        analyzedHeroes = analyzeHeroMeta(nextHeroes);
        userStatus = calculateUserEcosystem(onlineUsers, nextTotalUsers, tierConfig);

        const sortedUsers = [...userPool].sort((a, b) => b.score - a.score);
        sortedUsers.forEach((u, idx) => {
            u.rank = idx + 1; 
            if (u.score >= tierConfig.master && u.rank <= tierConfig.challengerRank) {
                u.isChallenger = true;
            } else {
                u.isChallenger = false;
            }
        });

        topRankers = getTopRankers(analyzedHeroes, tierConfig);
        const targetSentiment = calculateTargetSentiment(gameState, analyzedHeroes, communityPosts);
        newSentiment = smoothSentiment(newSentiment, targetSentiment);
    }

    let nextPosts = [...communityPosts];
    if (isNewMinute) {
        nextPosts = updatePostInteractions(nextPosts, currentTotalMinutes);

        const isAIReady = gameState.aiConfig && gameState.aiConfig.enabled && gameState.aiConfig.apiKey;
        const postChance = 0.05 + (onlineUsers / 10000); 

        if (Math.random() < postChance) {
            const uniqueId = Date.now(); 
            if (isAIReady) {
                generatePostAsync(uniqueId, analyzedHeroes, tierConfig, currentTotalMinutes, gameState.aiConfig, userPool, gameState.battleSettings, gameState.fieldSettings)
                .then(aiPost => {
                    if (aiPost) {
                        set(prev => ({ 
                            communityPosts: [aiPost, ...prev.communityPosts].sort((a,b) => b.createdAt - a.createdAt).slice(0, 200) 
                        }));
                    }
                });
            }
        }

        if (nextPosts.length > 0) {
            const recentPosts = nextPosts.slice(0, 15);
            const targetPost = recentPosts[Math.floor(Math.random() * recentPosts.length)];

            if (targetPost && Math.random() < 0.3) {
                if (isAIReady) {
                    generateCommentAsync(targetPost, gameState.aiConfig, userPool, tierConfig).then(comment => {
                        if (comment) {
                            set(prev => {
                                const posts = [...prev.communityPosts];
                                const p = posts.find(post => post.id === targetPost.id);
                                if (p) {
                                    p.commentList.push(comment);
                                    p.comments++;
                                }
                                return { communityPosts: posts };
                            });
                        }
                    });
                }
            }
        }
    }

    if (nextPosts.length > 200) nextPosts = nextPosts.sort((a,b) => b.createdAt - a.createdAt).slice(0, 200);

    set({
      heroes: analyzedHeroes,
      communityPosts: nextPosts, 
      gameState: {
        ...gameState,
        second: ns,
        minute: nm, hour: nh, day: nd,
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
    set({
      gameState: { ...initialGameState, aiConfig: currentAI },
      heroes: INITIAL_HEROES,
      shopItems: INITIAL_ITEMS,
      communityPosts: [],     
      selectedPost: null
    });
  }
});