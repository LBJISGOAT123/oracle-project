// ==========================================
// FILE PATH: /src/engine/SaveLoadSystem.ts
// ==========================================

// [경로 수정됨] system 폴더 추가
import { userPool, UserAgent, initUserPool } from './system/UserManager';
import { useGameStore } from '../store/useGameStore';
import { Hero } from '../types';

const STORAGE_PREFIX = 'GW_SAVE_DATA_';
const META_KEY = 'GW_SAVE_META';

export interface SaveMeta {
  slotId: string;
  timestamp: number;
  dateStr: string;
  season: number;
  day: number;
  totalUsers: number;
}

// 깊은 병합 함수
function deepMerge(target: any, source: any): any {
  if (typeof target !== 'object' || target === null) {
    return source !== undefined ? source : target;
  }
  if (Array.isArray(target)) {
    return Array.isArray(source) ? source : target;
  }
  const output = { ...target };
  if (typeof source === 'object' && source !== null) {
    Object.keys(source).forEach(key => {
      if (key in target) {
        output[key] = deepMerge(target[key], source[key]);
      }
    });
  }
  return output;
}

const serializeUsers = () => {
  return userPool.map(u => ({
    i: u.id, n: u.name, s: u.score, m: u.mainHeroId,
    w: u.wins, l: u.losses, h: u.history.slice(0, 10), st: 'OFFLINE',
    promo: u.promoStatus, isC: u.isChallenger
  }));
};

const deserializeUsers = (data: any[], heroes: Hero[]) => {
  userPool.length = 0;
  data.forEach((d: any) => {
    const u = new UserAgent(d.i, heroes);
    Object.assign(u, {
      name: d.n, score: d.s, mainHeroId: d.m,
      wins: d.w || 0, losses: d.l || 0, history: d.h || [], status: 'OFFLINE',
      promoStatus: d.promo || null, isChallenger: d.isC || false
    });
    userPool.push(u);
  });
};

export const saveToSlot = (slotId: string) => {
  const store = useGameStore.getState();

  const optimizedMatches = store.gameState.liveMatches.map(m => ({
    ...m, logs: [], timeline: []
  }));

  const saveData = {
    time: {
      season: store.gameState.season, day: store.gameState.day,
      hour: store.gameState.hour, minute: store.gameState.minute
    },
    config: {
      battle: store.gameState.battleSettings,
      field: store.gameState.fieldSettings,
      role: store.gameState.roleSettings,
      tier: store.gameState.tierConfig,
      ai: store.gameState.aiConfig
    },
    customImages: store.gameState.customImages,
    heroes: store.heroes.map(h => ({
      id: h.id, name: h.name, stats: h.stats, skills: h.skills, record: h.record
    })),
    users: serializeUsers(),
    itemStats: store.gameState.itemStats,
    shopItems: store.shopItems,
    godStats: store.gameState.godStats, 
    liveMatches: optimizedMatches,
    timestamp: Date.now()
  };

  try {
    const json = JSON.stringify(saveData);
    localStorage.setItem(`${STORAGE_PREFIX}${slotId}`, json);

    const meta: SaveMeta = {
      slotId, timestamp: Date.now(), dateStr: new Date().toLocaleString(),
      season: saveData.time.season, day: saveData.time.day, totalUsers: userPool.length
    };
    updateMeta(slotId, meta);
    return true;
  } catch (e) {
    console.error('❌ 저장 실패 (용량 초과 가능성):', e);
    if(slotId === 'auto') localStorage.removeItem(`${STORAGE_PREFIX}${slotId}`);
    return false;
  }
};

export const loadFromSlot = (slotId: string, defaultHeroes: Hero[]) => {
  const json = localStorage.getItem(`${STORAGE_PREFIX}${slotId}`);
  if (!json) return false;

  try {
    const data = JSON.parse(json);
    const store = useGameStore.getState();
    const loadedTime = data.time || {};

    const newGameState = {
      ...store.gameState,
      season: loadedTime.season || 1, day: loadedTime.day || 1,
      hour: loadedTime.hour || 12, minute: loadedTime.minute || 0,
      battleSettings: deepMerge(store.gameState.battleSettings, data.config?.battle),
      fieldSettings: deepMerge(store.gameState.fieldSettings, data.config?.field),
      roleSettings: deepMerge(store.gameState.roleSettings, data.config?.role),
      tierConfig: deepMerge(store.gameState.tierConfig, data.config?.tier),
      aiConfig: deepMerge(store.gameState.aiConfig, data.config?.ai),
      itemStats: data.itemStats || {},
      godStats: data.godStats || store.gameState.godStats,
      customImages: { ...store.gameState.customImages, ...(data.customImages || {}) },
      liveMatches: data.liveMatches || [],
      isPlaying: false
    };

    let loadedHeroes = defaultHeroes;
    if (data.heroes && Array.isArray(data.heroes)) {
      const savedHeroMap = new Map(data.heroes.map((h: any) => [h.id, h]));
      loadedHeroes = defaultHeroes.map(codeHero => {
        const savedHero = savedHeroMap.get(codeHero.id);
        if (savedHero) {
          return {
            ...codeHero,
            name: savedHero.name || codeHero.name,
            stats: { ...codeHero.stats, ...savedHero.stats },
            skills: deepMerge(codeHero.skills, savedHero.skills),
            record: savedHero.record || codeHero.record,
            tier: savedHero.tier || '3', rank: savedHero.rank || 999,
          };
        }
        return codeHero;
      });
    }

    useGameStore.setState({ 
        gameState: newGameState, 
        heroes: loadedHeroes,
        shopItems: data.shopItems || store.shopItems 
    });

    deserializeUsers(data.users || [], loadedHeroes);
    return true;
  } catch (e) {
    console.error('❌ 불러오기 실패:', e);
    return false;
  }
};

const updateMeta = (slotId: string, info: SaveMeta) => {
  try {
    const json = localStorage.getItem(META_KEY);
    const allMeta = json ? JSON.parse(json) : {};
    allMeta[slotId] = info;
    localStorage.setItem(META_KEY, JSON.stringify(allMeta));
  } catch {}
};

export const getSlotsMeta = (): Record<string, SaveMeta> => {
  try {
    const json = localStorage.getItem(META_KEY);
    return json ? JSON.parse(json) : {};
  } catch { return {}; }
};

export const deleteSlot = (slotId: string) => {
  localStorage.removeItem(`${STORAGE_PREFIX}${slotId}`);
  const meta = getSlotsMeta();
  delete meta[slotId];
  localStorage.setItem(META_KEY, JSON.stringify(meta));
};

export const exportSaveFile = () => {
  saveToSlot('temp_export'); 
  const json = localStorage.getItem(`${STORAGE_PREFIX}temp_export`);
  if (!json) return;
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `GW_Save_${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  localStorage.removeItem(`${STORAGE_PREFIX}temp_export`);
};

export const importSaveFile = (file: File, heroes: Hero[]) => {
  return new Promise<boolean>((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        localStorage.setItem(`${STORAGE_PREFIX}temp_import`, e.target?.result as string);
        const success = loadFromSlot('temp_import', heroes);
        localStorage.removeItem(`${STORAGE_PREFIX}temp_import`);
        if(success) { saveToSlot('auto'); resolve(true); } else { resolve(false); }
      } catch (err) { console.error(err); resolve(false); }
    };
    reader.readAsText(file);
  });
};

export const initializeGame = (heroes: Hero[]) => {
  console.log('🆕 게임 엔진 초기화');
  if (userPool.length === 0) {
    initUserPool(heroes, 3000);
  }
};