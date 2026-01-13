// ==========================================
// FILE PATH: /src/store/slices/gameSlice.ts
// ==========================================
import { StateCreator } from 'zustand';
import { GameStore, GameSlice } from '../types';
import { INITIAL_CUSTOM_IMAGES } from '../../data/initialImages';
import { GameState } from '../../types';
import { CoreEngine } from '../../engine/CoreEngine';
import { userPool } from '../../engine/system/UserManager'; 
import { INITIAL_HEROES } from '../../data/heroes';
import { INITIAL_ITEMS } from '../../data/items';

const loadSavedAIConfig = () => {
  try {
    const saved = localStorage.getItem('GW_AI_CONFIG');
    return saved ? JSON.parse(saved) : null;
  } catch (e) { return null; }
};

const savedAI = loadSavedAIConfig();

const initialPositions = {
  colossus: { x: 25, y: 28 }, 
  watcher: { x: 78, y: 72 },  
  jungle: [
    { x: 15, y: 42 }, 
    { x: 50, y: 82 }, 
    { x: 58, y: 22 }, 
    { x: 82, y: 55 }  
  ],
  towers: {
    blue: {
        top: [{x: 8, y: 35}, {x: 8, y: 55}, {x: 10, y: 75}], 
        mid: [{x: 40, y: 60}, {x: 30, y: 70}, {x: 22, y: 78}],
        bot: [{x: 75, y: 92}, {x: 50, y: 90}, {x: 25, y: 88}],
        nexus: { x: 12, y: 88 }
    },
    red: {
        top: [{x: 45, y: 10}, {x: 65, y: 12}, {x: 80, y: 15}],
        mid: [{x: 60, y: 40}, {x: 70, y: 30}, {x: 78, y: 22}],
        bot: [{x: 92, y: 65}, {x: 92, y: 45}, {x: 88, y: 25}],
        nexus: { x: 88, y: 12 }
    }
  }
};

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
    economy: { minionGold: 14, minionXp: 30 },
    // [수정 완료] 요청하신 데미지 비율 적용
    siege: { 
        minionDmg: 1.0, cannonDmg: 1.0, superDmg: 1.0,
        
        dmgToHero: 1.0,   // 영웅에겐 100%
        dmgToT1: 0.01,    // 1% (거의 안 박힘)
        dmgToT2: 0.01,    // 1%
        dmgToT3: 0.01,    // 1%
        dmgToNexus: 0.03, // 3%

        colossusToHero: 0.3,   // 30%
        colossusToT1: 0.4,     // 40%
        colossusToT2: 0.2,     // 20%
        colossusToT3: 0.1,     // 10%
        colossusToNexus: 0.05  // 5%
    }
  },
  fieldSettings: {
    towers: {
        t1: { hp: 10000, armor: 80, rewardGold: 300, atk: 350 },
        t2: { hp: 15000, armor: 120, rewardGold: 450, atk: 450 },
        t3: { hp: 20000, armor: 150, rewardGold: 600, atk: 550 },
        nexus: { hp: 30000, armor: 200, rewardGold: 0, atk: 1000 }
    },
    colossus: { hp: 15000, armor: 80, rewardGold: 100, attack: 50, initialSpawnTime: 300, respawnTime: 300 },
    watcher: { hp: 20000, armor: 120, rewardGold: 150, buffType: 'COMBAT', buffAmount: 20, buffDuration: 180, initialSpawnTime: 420, respawnTime: 420 },
    jungle: { density: 50, yield: 50, attack: 30, defense: 20, threat: 0, xp: 160, gold: 80, initialSpawnTime: 90, respawnTime: 90 },
    positions: initialPositions
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
  
  setGameState: (updates) => set((state) => {
    const newImages = updates.customImages || state.gameState.customImages;
    let newField = updates.fieldSettings || state.gameState.fieldSettings;
    let newBattle = updates.battleSettings || state.gameState.battleSettings;

    if (newField && !newField.positions) {
        newField = { ...newField, positions: initialPositions };
    }
    
    // [중요] 기존 세이브에 값이 없으면, 위에서 정의한 최신 siege 설정값으로 덮어씁니다.
    if (newBattle) {
        const defaultSiege = initialGameState.battleSettings.siege;
        const currentSiege = (newBattle as any).siege || {};
        newBattle.siege = { ...defaultSiege, ...currentSiege };
        
        // 특정 키가 없는 경우 강제 업데이트 (기존 세이브 호환)
        if (newBattle.siege.dmgToT1 === undefined) {
             newBattle.siege = defaultSiege;
        }
    }

    if ((newField as any).tower) {
        const oldTower = (newField as any).tower;
        newField = {
            ...newField,
            towers: {
                t1: { ...oldTower, hp: 10000, atk: 350 },
                t2: { ...oldTower, hp: 15000, atk: 450 },
                t3: { ...oldTower, hp: 20000, atk: 550 },
                nexus: { ...oldTower, hp: 30000, atk: 1000 }
            }
        };
        if(!(newField.colossus as any).initialSpawnTime) (newField.colossus as any).initialSpawnTime = 300;
        if(!(newField.watcher as any).initialSpawnTime) (newField.watcher as any).initialSpawnTime = 420;
    }

    return { 
        gameState: { ...state.gameState, ...updates, fieldSettings: newField, battleSettings: newBattle, customImages: newImages } 
    };
  }),

  tick: (deltaSeconds: number) => {
    const state = get();
    if (!state.gameState || !state.gameState.isPlaying) return;

    CoreEngine.processTick(
      state.gameState,
      state.heroes,
      state.communityPosts,
      deltaSeconds,
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
