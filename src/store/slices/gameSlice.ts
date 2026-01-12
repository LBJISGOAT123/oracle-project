// ==========================================
// FILE PATH: /src/store/slices/gameSlice.ts
// ==========================================
import { StateCreator } from 'zustand';
import { GameStore, GameSlice } from '../types';
import { INITIAL_CUSTOM_IMAGES } from '../../data/initialImages';
import { GameState } from '../../types';
import { CoreEngine } from '../../engine/CoreEngine';
// [경로 수정됨] engine/UserManager -> engine/system/UserManager
import { userPool } from '../../engine/system/UserManager'; 
import { INITIAL_HEROES } from '../../data/heroes';
import { INITIAL_ITEMS } from '../../data/items';

// 로컬 스토리지에서 AI 설정 불러오기
const loadSavedAIConfig = () => {
  try {
    const saved = localStorage.getItem('GW_AI_CONFIG');
    return saved ? JSON.parse(saved) : null;
  } catch (e) { return null; }
};

const savedAI = loadSavedAIConfig();

const initialGameState: GameState = {
  season: 1, day: 1, hour: 12, minute: 0, second: 0,
  isPlaying: false, gameSpeed: 1,
  userSentiment: 60, ccu: 0, totalUsers: 3000, 
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
    izman: { name: '이즈마한', atkRatio: 1.5, defRatio: 1, hpRatio: 10000, guardianHp: 25000, towerAtk: 100, trait: '광란', servantGold: 14, servantXp: 30, minions: { melee: { label: '광신도', hp: 550, def: 10, atk: 25, gold: 21, xp: 60 }, ranged: { label: '암흑 사제', hp: 350, def: 0, atk: 45, gold: 14, xp: 30 }, siege: { label: '암흑기사', hp: 950, def: 40, atk: 70, gold: 60, xp: 90 } } },
    dante: { name: '단테', atkRatio: 1.5, defRatio: 1, hpRatio: 10000, guardianHp: 25000, towerAtk: 100, trait: '가호', servantGold: 14, servantXp: 30, minions: { melee: { label: '수도사', hp: 550, def: 10, atk: 25, gold: 21, xp: 60 }, ranged: { label: '구도자', hp: 350, def: 0, atk: 45, gold: 14, xp: 30 }, siege: { label: '성전사', hp: 950, def: 40, atk: 70, gold: 60, xp: 90 } } },
    economy: { minionGold: 14, minionXp: 30 }
  },
  fieldSettings: {
    tower: { hp: 3000, armor: 200, rewardGold: 350 },
    colossus: { hp: 8000, armor: 80, rewardGold: 100, attack: 50, respawnTime: 300 },
    watcher: { hp: 12000, armor: 120, rewardGold: 150, buffType: 'COMBAT', buffAmount: 20, buffDuration: 180, respawnTime: 420 },
    jungle: { density: 50, yield: 50, attack: 30, defense: 20, threat: 0, xp: 160, gold: 80 }
  },
  roleSettings: {
    executor: { damage: 10, defense: 10 },
    tracker: { gold: 20, smiteChance: 1.5 },
    prophet: { cdrPerLevel: 2 },
    slayer: { structureDamage: 30 },
    guardian: { survivalRate: 20 }
  },
  aiConfig: savedAI || { provider: 'GEMINI', apiKey: '', model: 'gemini-2.5-flash', enabled: false },
  customImages: INITIAL_CUSTOM_IMAGES 
};

export const createGameSlice: StateCreator<GameStore, [], [], GameSlice> = (set, get) => ({
  gameState: initialGameState,

  setSpeed: (s) => set((state) => ({ gameState: { ...state.gameState, gameSpeed: s } })),
  togglePlay: () => set((state) => ({ gameState: { ...state.gameState, isPlaying: !state.gameState.isPlaying } })),
  setGameState: (updates) => set((state) => ({ gameState: { ...state.gameState, ...updates } })),

  tick: (deltaSeconds: number) => {
    const state = get();
    if (!state.gameState || !state.gameState.isPlaying) return;

    // 엔진에게 계산 위임 (매 프레임 호출)
    CoreEngine.processTick(
      state.gameState,
      state.heroes,
      state.communityPosts,
      deltaSeconds,
      // 콜백: 엔진이 계산을 마치면 이 함수를 통해 스토어를 업데이트함
      (updates, newHeroes, newPosts) => {
        set((current) => ({
          gameState: { ...current.gameState, ...updates },
          heroes: newHeroes || current.heroes,
          communityPosts: newPosts || current.communityPosts
        }));
      }
    );
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