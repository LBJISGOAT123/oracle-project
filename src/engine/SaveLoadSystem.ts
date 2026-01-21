import { userPool, replaceUserPool, initUserPool, getTopRankers } from './system/UserManager';
import { analyzeHeroMeta, calculateUserEcosystem } from './system/RankingSystem';
import { useGameStore } from '../store/useGameStore';
import { Hero, GameState, SaveMeta, UserProfile, LiveMatch, LivePlayer, Item } from '../types';
import { IDBStorage } from '../utils/IDBStorage';

const META_KEY = 'GW_SAVE_META';
const PENDING_LOAD_KEY = 'GW_PENDING_LOAD';

export const saveToSlot = async (slotId: string): Promise<boolean> => {
  const store = useGameStore.getState();
  const state = store.gameState;

  const optimizedMatches = state.liveMatches.map(m => ({
    ...m, 
    logs: [], timeline: [], minions: [], projectiles: [], jungleMobs: []    
  }));

  const saveData = {
    version: 24, 
    time: { season: state.season, day: state.day, hour: state.hour, minute: state.minute },
    config: {
      battle: state.battleSettings,
      field: state.fieldSettings,
      role: state.roleSettings,
      tier: state.tierConfig,
      ai: state.aiConfig,
      growth: state.growthSettings 
    },
    customImages: state.customImages,
    heroes: store.heroes.map(h => ({ id: h.id, record: h.record, concept: h.concept, name: h.name })),
    users: userPool, 
    itemStats: state.itemStats,
    shopItems: store.shopItems,
    godStats: state.godStats, 
    liveMatches: optimizedMatches,
    timestamp: Date.now()
  };

  try {
    await IDBStorage.setItem(slotId, saveData);
    const now = new Date();
    const meta: SaveMeta = {
      slotId, timestamp: Date.now(), realDateStr: now.toLocaleString(), 
      gameTimeDisplay: `S${state.season} D${state.day}`, totalUsers: userPool.length
    };
    const json = localStorage.getItem(META_KEY);
    const allMeta = json ? JSON.parse(json) : {};
    allMeta[slotId] = meta;
    localStorage.setItem(META_KEY, JSON.stringify(allMeta));
    return true;
  } catch (e: any) {
    alert(`저장 실패: ${e.message}`);
    return false;
  }
};

export const loadFromSlot = async (slotId: string, defaultHeroes: Hero[]): Promise<boolean> => {
  try {
    let data = await IDBStorage.getItem(slotId);
    if (!data) {
        const legacyJson = localStorage.getItem(`GW_SAVE_DATA_${slotId}`);
        if(legacyJson) data = JSON.parse(legacyJson);
        else return false;
    }
    localStorage.setItem(PENDING_LOAD_KEY, slotId);
    window.location.reload();
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
};

export const initializeGame = async (heroes: Hero[]) => {
  const pendingSlot = localStorage.getItem(PENDING_LOAD_KEY);
  if (pendingSlot) {
    console.log("🔄 [System] 데이터 로드 및 무결성 검사 시작:", pendingSlot);
    localStorage.removeItem(PENDING_LOAD_KEY); 
    try {
        let data = await IDBStorage.getItem(pendingSlot);
        if (data) {
            applyLoadedData(data, heroes);
            return;
        }
    } catch (e) {
        console.error("Critical Load Error:", e);
    }
  }
  // [수정] 초기 시작 유저 수 250명
  if (userPool.length === 0) initUserPool(heroes, 250);
};

const applyLoadedData = (data: any, defaultHeroes: Hero[]) => {
    const store = useGameStore.getState();
    
    const loadedHeroMap = new Map(data.heroes?.map((h: any) => [h.id, h]) || []);
    const restoredHeroes = defaultHeroes.map(def => {
        const saved = loadedHeroMap.get(def.id);
        return saved ? { ...def, ...saved } : def;
    });

    let restoredUsers: UserProfile[] = [];
    if (data.users && Array.isArray(data.users)) {
        restoredUsers = data.users.map((u: any) => ({
            ...u,
            heroStats: u.heroStats || {},
            history: u.history || [],
            status: 'OFFLINE' 
        }));
    } else {
        // [수정] 불러오기 실패 시 fallback도 250명
        initUserPool(restoredHeroes, 250);
        restoredUsers = [...userPool];
    }

    const validUserNames = new Set(restoredUsers.map(u => u.name));
    const validMatches: LiveMatch[] = [];
    const rawMatches = (data.liveMatches || []);
    
    rawMatches.forEach((m: any) => {
        const participants = [...(m.blueTeam || []), ...(m.redTeam || [])];
        const isValidMatch = participants.length === 10 && participants.every((p: any) => validUserNames.has(p.name));

        if (isValidMatch) {
            validMatches.push({
                ...m,
                minions: [], projectiles: [], jungleMobs: [], logs: [], timeline: [],
                blueTeam: m.blueTeam.map((p:any)=>({...p, items: p.items||[], cooldowns: {q:0,w:0,e:0,r:0}})),
                redTeam: m.redTeam.map((p:any)=>({...p, items: p.items||[], cooldowns: {q:0,w:0,e:0,r:0}})),
                stats: {
                    blue: { ...m.stats?.blue, nexusHp: Number(m.stats?.blue?.nexusHp||5000), towers: m.stats?.blue?.towers||{top:0,mid:0,bot:0}, activeBuffs: m.stats?.blue?.activeBuffs||{siegeUnit:false,voidPower:false} },
                    red: { ...m.stats?.red, nexusHp: Number(m.stats?.red?.nexusHp||5000), towers: m.stats?.red?.towers||{top:0,mid:0,bot:0}, activeBuffs: m.stats?.red?.activeBuffs||{siegeUnit:false,voidPower:false} }
                },
                objectives: {
                    colossus: { hp: 0, maxHp: 10000, status: 'DEAD', nextSpawnTime: m.currentDuration+60 },
                    watcher: { hp: 0, maxHp: 10000, status: 'DEAD', nextSpawnTime: m.currentDuration+120 }
                }
            });
            participants.forEach((p: any) => {
                const u = restoredUsers.find(user => user.name === p.name);
                if (u) u.status = 'INGAME';
            });
        }
    });

    replaceUserPool(restoredUsers);

    let loadedGrowth = data.config?.growth;
    if (loadedGrowth && typeof loadedGrowth.hp === 'number') {
        const convert = (val: number) => ({ early: Math.floor(val*0.6), mid: val, late: Math.floor(val*1.4) });
        loadedGrowth = {
            hp: convert(loadedGrowth.hp),
            ad: convert(loadedGrowth.ad),
            ap: convert(loadedGrowth.ap),
            armor: convert(loadedGrowth.armor),
            baseAtk: convert(loadedGrowth.baseAtk),
            regen: convert(loadedGrowth.regen),
            respawnPerLevel: 3.0,
            recallTime: 10.0
        };
    }
    if (!loadedGrowth) {
        loadedGrowth = { 
            hp: {early:3,mid:5,late:7}, ad: {early:5,mid:10,late:15}, ap: {early:5,mid:10,late:15},
            armor: {early:2,mid:3,late:4}, baseAtk: {early:2,mid:3,late:4}, regen: {early:1,mid:2,late:3},
            respawnPerLevel: 3.0, recallTime: 10.0
        };
    }
    if (loadedGrowth.recallTime === undefined || loadedGrowth.recallTime < 4) loadedGrowth.recallTime = 10.0;
    if (loadedGrowth.respawnPerLevel === undefined) loadedGrowth.respawnPerLevel = 3.0;

    useGameStore.setState({ 
        gameState: {
            ...store.gameState,
            ...data.time,
            tierConfig: { ...store.gameState.tierConfig, ...data.config?.tier },
            battleSettings: { ...store.gameState.battleSettings, ...data.config?.battle },
            fieldSettings: { ...store.gameState.fieldSettings, ...data.config?.field },
            roleSettings: { ...store.gameState.roleSettings, ...data.config?.role },
            aiConfig: { ...store.gameState.aiConfig, ...data.config?.ai },
            growthSettings: loadedGrowth,
            
            itemStats: data.itemStats || {},
            godStats: data.godStats || store.gameState.godStats,
            customImages: { ...store.gameState.customImages, ...(data.customImages || {}) },
            liveMatches: validMatches,
            totalUsers: restoredUsers.length,
            topRankers: getTopRankers(restoredHeroes, data.config?.tier),
            userStatus: calculateUserEcosystem(validMatches.length * 10, restoredUsers.length, data.config?.tier),
            isPlaying: false 
        },
        heroes: analyzeHeroMeta(restoredHeroes),
        shopItems: data.shopItems || store.shopItems
    });
};

export const getSlotsMeta = (): Record<string, SaveMeta> => {
  try {
    const json = localStorage.getItem(META_KEY);
    return json ? JSON.parse(json) : {};
  } catch { return {}; }
};

export const deleteSlot = async (slotId: string) => {
  await IDBStorage.removeItem(slotId); 
  const meta = getSlotsMeta();
  delete meta[slotId];
  localStorage.setItem(META_KEY, JSON.stringify(meta));
};

export const exportSaveFile = async () => {};
export const importSaveFile = (file: File, heroes: Hero[]) => { return new Promise<boolean>((r)=>r(false)); };
