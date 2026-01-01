// ==========================================
// FILE PATH: /src/engine/SaveLoadSystem.ts
// ==========================================

import { userPool, UserAgent, initUserPool } from './UserManager';
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

const serializeUsers = () => {
  return userPool.map(u => ({
    i: u.id, n: u.name, s: u.score, m: u.mainHeroId,
    w: u.wins, l: u.losses, h: u.history.slice(0, 10), st: 'OFFLINE'
  }));
};

const deserializeUsers = (data: any[], heroes: Hero[]) => {
  userPool.length = 0;
  data.forEach((d: any) => {
    const u = new UserAgent(d.i, heroes);
    Object.assign(u, {
      name: d.n, score: d.s, mainHeroId: d.m,
      wins: d.w || 0, losses: d.l || 0, history: d.h || [], status: 'OFFLINE'
    });
    userPool.push(u);
  });
};

// [Core] 슬롯에 저장하기
export const saveToSlot = (slotId: string) => {
  const store = useGameStore.getState();
  
  const saveData = {
    time: {
      season: store.gameState.season,
      day: store.gameState.day,
      hour: store.gameState.hour,
      minute: store.gameState.minute
    },
    // [수정됨] 설정 저장 부분에 AI 설정(aiConfig) 추가!
    config: {
      tier: store.gameState.tierConfig,
      battle: store.gameState.battleSettings,
      field: store.gameState.fieldSettings,
      ai: store.gameState.aiConfig // <--- 여기 추가됨
    },
    heroes: store.heroes,
    users: serializeUsers(),
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
    console.log(`✅ [Slot ${slotId}] 데이터 저장 완료 (AI설정 포함)`);
    return true;
  } catch (e) {
    console.error('❌ 저장 실패:', e);
    return false;
  }
};

// [Core] 슬롯에서 불러오기
export const loadFromSlot = (slotId: string, currentHeroes: Hero[]) => {
  const json = localStorage.getItem(`${STORAGE_PREFIX}${slotId}`);
  if (!json) return false;

  try {
    const data = JSON.parse(json);
    const store = useGameStore.getState();

    // [수정됨] AI 설정 복구 로직 추가
    const newGameState = {
      ...store.gameState,
      season: data.time.season,
      day: data.time.day,
      hour: data.time.hour,
      minute: data.time.minute,
      
      tierConfig: data.config?.tier || store.gameState.tierConfig,
      battleSettings: { ...store.gameState.battleSettings, ...(data.config?.battle || {}) },
      fieldSettings: { ...store.gameState.fieldSettings, ...(data.config?.field || {}) },
      // AI 설정 병합 (없으면 기본값)
      aiConfig: { ...store.gameState.aiConfig, ...(data.config?.ai || {}) },

      liveMatches: [],
      isPlaying: false
    };

    let loadedHeroes = currentHeroes;
    if (data.heroes && Array.isArray(data.heroes)) {
      loadedHeroes = currentHeroes.map(defaultHero => {
        const savedHero = data.heroes.find((h: Hero) => h.id === defaultHero.id);
        if (savedHero) {
          return {
            ...defaultHero,
            name: savedHero.name,
            stats: { ...defaultHero.stats, ...savedHero.stats },
            record: savedHero.record || defaultHero.record,
          };
        }
        return defaultHero;
      });
    }

    useGameStore.setState({ gameState: newGameState, heroes: loadedHeroes });
    deserializeUsers(data.users, loadedHeroes);

    console.log(`📂 [Slot ${slotId}] 로드 완료 (AI설정 포함)`);
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
  if (localStorage.getItem(`${STORAGE_PREFIX}auto`)) {
    console.log("🔄 자동 저장 로드");
    loadFromSlot('auto', heroes);
  } else {
    console.log('🆕 새 게임 시작');
    initUserPool(heroes, 3000);
    saveToSlot('auto');
  }
};