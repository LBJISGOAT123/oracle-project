import { StateCreator } from 'zustand';
import { GameStore, GameSlice } from '../types';
import { INITIAL_CUSTOM_IMAGES } from '../../data/initialImages';
import { GameState } from '../../types';
import { CoreEngine } from '../../engine/CoreEngine';
import { userPool } from '../../engine/system/UserManager'; 
import { INITIAL_HEROES } from '../../data/heroes';
import { INITIAL_ITEMS } from '../../data/items';
import { TOWER_COORDS, POI } from '../../engine/match/constants/MapConstants';

const loadSavedAIConfig = () => { try { return JSON.parse(localStorage.getItem('GW_AI_CONFIG') || 'null'); } catch { return null; } };
const savedAI = loadSavedAIConfig();

const initialPositions = {
  colossus: POI.BARON, watcher: POI.DRAGON, jungle: POI.JUNGLE_SPOTS,
  towers: { blue: { top: TOWER_COORDS.BLUE.TOP, mid: TOWER_COORDS.BLUE.MID, bot: TOWER_COORDS.BLUE.BOT, nexus: TOWER_COORDS.BLUE.NEXUS }, red: { top: TOWER_COORDS.RED.TOP, mid: TOWER_COORDS.RED.MID, bot: TOWER_COORDS.RED.BOT, nexus: TOWER_COORDS.RED.NEXUS } }
};

const initialGameState: GameState = {
  season: 1, day: 1, hour: 12, minute: 0, second: 0,
  isPlaying: false, gameSpeed: 1, userSentiment: 60, ccu: 0, totalUsers: 3000, maxMatches: 10,
  userStatus: { totalGames: 0, playingUsers: 0, queuingUsers: 0, avgWaitTime: 0, tierDistribution: [] },
  topRankers: [],
  godStats: { totalMatches: 0, izmanWins: 0, izmanAvgKills: '0.0', izmanAvgTime: '00:00', danteWins: 0, danteAvgKills: '0.0', danteAvgTime: '00:00', avgGameDuration: 0, guardianDeathRate: 0, godAwakenRate: 0 },
  itemStats: {}, liveMatches: [],
  tierConfig: { challengerRank: 200, master: 4800, ace: 3800, joker: 3200, gold: 2100, silver: 1300, bronze: 300, promos: { master: 5, ace: 5, joker: 5, gold: 3, silver: 3, bronze: 3 } },
  battleSettings: {
    izman: { name: '이즈마한', atkRatio: 1.5, defRatio: 1, hpRatio: 10000, guardianHp: 25000, towerAtk: 100, trait: '광란', servantGold: 14, servantXp: 30, minions: { melee: { label: '광신도', hp: 550, def: 10, atk: 25, gold: 21, xp: 60 }, ranged: { label: '암흑 사제', hp: 350, def: 0, atk: 45, gold: 14, xp: 30 }, siege: { label: '암흑기사', hp: 950, def: 40, atk: 70, gold: 60, xp: 90 } } },
    dante: { name: '단테', atkRatio: 1.5, defRatio: 1, hpRatio: 10000, guardianHp: 25000, towerAtk: 100, trait: '가호', servantGold: 14, servantXp: 30, minions: { melee: { label: '수도사', hp: 550, def: 10, atk: 25, gold: 21, xp: 60 }, ranged: { label: '구도자', hp: 350, def: 0, atk: 45, gold: 14, xp: 30 }, siege: { label: '성전사', hp: 950, def: 40, atk: 70, gold: 60, xp: 90 } } },
    economy: { minionGold: 18, minionXp: 30, killGold: 200, goldPerLevel: 20, bountyIncrement: 100, assistPool: 50, killXpBase: 40, killXpPerLevel: 20 },
    siege: { minionDmg: 1.0, cannonDmg: 1.0, superDmg: 1.0, dmgToHero: 1.0, dmgToT1: 0.3, dmgToT2: 0.25, dmgToT3: 0.2, dmgToNexus: 0.1, colossusToHero: 0.3, colossusToT1: 0.4, colossusToT2: 0.2, colossusToT3: 0.1, colossusToNexus: 0.05 }
  },
  fieldSettings: {
    towers: { t1: { hp: 5000, armor: 40, rewardGold: 300, atk: 350 }, t2: { hp: 7500, armor: 60, rewardGold: 450, atk: 450 }, t3: { hp: 10000, armor: 75, rewardGold: 600, atk: 550 }, nexus: { hp: 30000, armor: 60, rewardGold: 0, atk: 1000 } },
    colossus: { hp: 15000, armor: 100, rewardGold: 100, attack: 50, initialSpawnTime: 300, respawnTime: 300, dmgFromHero: 100, dmgFromMinion: 5, dmgFromTower: 30 },
    watcher: { hp: 20000, armor: 120, rewardGold: 150, buffType: 'COMBAT', buffAmount: 20, buffDuration: 180, initialSpawnTime: 420, respawnTime: 420 },
    jungle: { density: 50, yield: 50, attack: 30, defense: 20, threat: 0, xp: 160, gold: 80, initialSpawnTime: 90, respawnTime: 90 },
    positions: initialPositions
  },
  roleSettings: { executor: { damage: 10, defense: 10 }, tracker: { gold: 20, smiteChance: 1.5 }, prophet: { cdrPerLevel: 2 }, slayer: { structureDamage: 30 }, guardian: { survivalRate: 20 } },
  
  // [수정 완료] 요청하신 4%, 9%, 14% 설정 반영
  growthSettings: { 
    hp: { early: 4, mid: 9, late: 14 },     // HP 상향
    ad: { early: 5, mid: 10, late: 15 },    // (참고: 공격력은 5, 10, 15)
    ap: { early: 5, mid: 10, late: 15 }, 
    armor: { early: 4, mid: 9, late: 14 },  // Armor 상향
    baseAtk: { early: 2, mid: 3, late: 4 }, 
    regen: { early: 1, mid: 2, late: 3 }, 
    respawnPerLevel: 3.0, 
    recallTime: 10.0 
  },
  
  aiConfig: savedAI || { provider: 'GEMINI', apiKey: '', model: 'gemini-2.5-flash', enabled: false },
  customImages: INITIAL_CUSTOM_IMAGES,
  announcement: null
};

let timeBuffer = 0;
let lastRenderTime = 0;
const FIXED_STEP = 0.1;

export const createGameSlice: StateCreator<GameStore, [], [], GameSlice> = (set, get) => ({
  gameState: initialGameState,
  setSpeed: (s) => set((state) => ({ gameState: { ...state.gameState, gameSpeed: s } })),
  togglePlay: () => set((state) => ({ gameState: { ...state.gameState, isPlaying: !state.gameState.isPlaying } })),
  setGameState: (updates) => set((state) => ({ gameState: { ...state.gameState, ...updates } })),
  tick: (deltaSeconds: number) => {
    const state = get();
    if (!state.gameState || !state.gameState.isPlaying) return;
    const speed = state.gameState.gameSpeed;
    timeBuffer += deltaSeconds * speed;
    if (timeBuffer > 100.0) timeBuffer = 100.0;
    if (timeBuffer >= FIXED_STEP) {
        CoreEngine.processTick(state.gameState, state.heroes, state.communityPosts, timeBuffer, FIXED_STEP, (updates, newHeroes, newPosts, remainingTime) => {
            timeBuffer = remainingTime;
            const now = Date.now();
            let renderInterval = 33; 
            if (speed >= 3600) renderInterval = 2000; else if (speed >= 600) renderInterval = 1000; else if (speed >= 60) renderInterval = 500; else if (speed >= 10) renderInterval = 200;
            if (now - lastRenderTime > renderInterval) {
              lastRenderTime = now;
              set((current) => ({ gameState: { ...current.gameState, ...updates }, heroes: newHeroes || current.heroes, communityPosts: newPosts || current.communityPosts }));
            } else {
              set((current) => ({ gameState: { ...current.gameState, ...updates }, heroes: newHeroes || current.heroes, communityPosts: newPosts || current.communityPosts }));
            }
        });
    }
  },
  hardReset: () => {
    const currentAI = get().gameState.aiConfig;
    userPool.length = 0; timeBuffer = 0;
    set({ gameState: { ...initialGameState, aiConfig: currentAI }, heroes: INITIAL_HEROES, shopItems: INITIAL_ITEMS, communityPosts: [], selectedPost: null });
  }
});
