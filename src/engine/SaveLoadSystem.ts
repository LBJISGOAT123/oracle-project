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

// --- [헬퍼 함수] 깊은 병합 (Deep Merge) ---
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

// [Core] 슬롯에 저장하기 (최적화 적용)
export const saveToSlot = (slotId: string) => {
  const store = useGameStore.getState();

  // [핵심 최적화] 진행 중인 매치의 로그와 타임라인은 빈 배열로 저장 (용량 절약)
  // 이렇게 하면 용량 초과 오류(QuotaExceededError)가 발생하지 않습니다.
  const optimizedMatches = store.gameState.liveMatches.map(m => ({
    ...m,
    logs: [],      // 텍스트 로그 비우기
    timeline: []   // 타임라인 비우기
  }));

  const saveData = {
    time: {
      season: store.gameState.season,
      day: store.gameState.day,
      hour: store.gameState.hour,
      minute: store.gameState.minute
    },
    config: {
      battle: store.gameState.battleSettings,
      field: store.gameState.fieldSettings,
      role: store.gameState.roleSettings,
      tier: store.gameState.tierConfig,
      ai: store.gameState.aiConfig
    },
    customImages: store.gameState.customImages,

    // 영웅 데이터 저장 (여기에 누적된 통계 record가 포함됨)
    heroes: store.heroes.map(h => ({
      id: h.id,
      name: h.name, 
      stats: h.stats,
      skills: h.skills,
      record: h.record // [중요] 누적된 통계 데이터 저장
    })),

    users: serializeUsers(),
    itemStats: store.gameState.itemStats,
    shopItems: store.shopItems,
    godStats: store.gameState.godStats, 
    liveMatches: optimizedMatches, // [중요] 최적화된 매치 데이터 저장
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

    if (slotId !== 'auto') console.log(`✅ [Slot ${slotId}] 데이터 저장 완료 (로그 제외 최적화)`);
    return true;
  } catch (e) {
    console.error('❌ 저장 실패 (용량 초과 가능성):', e);
    // 비상 시 자동 저장 슬롯이라도 비워줌
    if(slotId === 'auto') localStorage.removeItem(`${STORAGE_PREFIX}${slotId}`);
    return false;
  }
};

// [Core] 슬롯에서 불러오기
export const loadFromSlot = (slotId: string, defaultHeroes: Hero[]) => {
  const json = localStorage.getItem(`${STORAGE_PREFIX}${slotId}`);
  if (!json) return false;

  try {
    const data = JSON.parse(json);
    const store = useGameStore.getState();

    const loadedTime = data.time || {};

    // 설정 데이터 병합
    const mergedBattle = deepMerge(store.gameState.battleSettings, data.config?.battle);
    const mergedField = deepMerge(store.gameState.fieldSettings, data.config?.field);
    const mergedRole = deepMerge(store.gameState.roleSettings, data.config?.role);
    const mergedTier = deepMerge(store.gameState.tierConfig, data.config?.tier);
    const mergedAI = deepMerge(store.gameState.aiConfig, data.config?.ai);

    const newGameState = {
      ...store.gameState,
      season: loadedTime.season || 1,
      day: loadedTime.day || 1,
      hour: loadedTime.hour || 12,
      minute: loadedTime.minute || 0,

      battleSettings: mergedBattle,
      fieldSettings: mergedField,
      roleSettings: mergedRole,
      tierConfig: mergedTier,
      aiConfig: mergedAI,

      itemStats: data.itemStats || {},
      godStats: data.godStats || store.gameState.godStats,
      customImages: data.customImages || store.gameState.customImages,

      // 저장된 매치 복구 (로그는 비어있는 상태로 로드됨 - 정상)
      liveMatches: data.liveMatches || [],
      isPlaying: false
    };

    // 영웅 데이터 및 통계 복구
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
            // [중요] 통계 기록(record)은 저장된 값을 그대로 가져와서 복원
            record: savedHero.record || codeHero.record,
            tier: savedHero.tier || '3',
            rank: savedHero.rank || 999,
          };
        }
        return codeHero;
      });
    }

    let loadedItems = store.shopItems;
    if (data.shopItems && Array.isArray(data.shopItems)) {
        loadedItems = data.shopItems;
    }

    useGameStore.setState({ 
        gameState: newGameState, 
        heroes: loadedHeroes,
        shopItems: loadedItems 
    });

    deserializeUsers(data.users || [], loadedHeroes);

    console.log(`📂 [Slot ${slotId}] 로드 완료`);
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
  console.log('🆕 게임 엔진 초기화 (새 게임)');
  if (userPool.length === 0) {
    initUserPool(heroes, 3000);
  }
};