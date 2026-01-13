import { userPool, replaceUserPool, initUserPool, getTopRankers } from './system/UserManager';
import { analyzeHeroMeta, calculateUserEcosystem } from './system/RankingSystem';
import { useGameStore } from '../store/useGameStore';
import { Hero, GameState, SaveMeta, UserProfile, LiveMatch, LivePlayer, Item } from '../types';
import { IDBStorage } from '../utils/IDBStorage';

const META_KEY = 'GW_SAVE_META';
const PENDING_LOAD_KEY = 'GW_PENDING_LOAD';

// [저장 로직]
export const saveToSlot = async (slotId: string): Promise<boolean> => {
  const store = useGameStore.getState();
  const state = store.gameState;

  // 저장 용량 최적화: 로그, 미니언, 투사체 등 일시적인 데이터는 제거하고 저장
  const optimizedMatches = state.liveMatches.map(m => ({
    ...m, 
    logs: [], 
    timeline: [], 
    minions: [], 
    projectiles: [], 
    jungleMobs: []    
  }));

  const saveData = {
    version: 17,
    time: { season: state.season, day: state.day, hour: state.hour, minute: state.minute },
    config: {
      battle: state.battleSettings,
      field: state.fieldSettings,
      role: state.roleSettings,
      tier: state.tierConfig,
      ai: state.aiConfig
    },
    customImages: state.customImages,
    // 영웅 데이터는 ID와 기록만 저장 (밸런스 패치 반영을 위해)
    heroes: store.heroes.map(h => ({
      id: h.id, 
      record: h.record, 
      concept: h.concept,
      name: h.name
    })),
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

// [로드 트리거] - 페이지를 새로고침하여 메모리를 비우고 시작
export const loadFromSlot = async (slotId: string, defaultHeroes: Hero[]): Promise<boolean> => {
  try {
    let data = await IDBStorage.getItem(slotId);
    if (!data) {
        const legacyJson = localStorage.getItem(`GW_SAVE_DATA_${slotId}`);
        if(legacyJson) data = JSON.parse(legacyJson);
        else return false;
    }
    // 로드할 슬롯 ID를 로컬스토리지에 남기고 새로고침
    localStorage.setItem(PENDING_LOAD_KEY, slotId);
    window.location.reload();
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
};

// [초기화 및 로드 실행] - App.tsx 시작 시 호출됨
export const initializeGame = async (heroes: Hero[]) => {
  const pendingSlot = localStorage.getItem(PENDING_LOAD_KEY);
  
  if (pendingSlot) {
    console.log("🔄 보류된 데이터 로드 중:", pendingSlot);
    localStorage.removeItem(PENDING_LOAD_KEY); 

    try {
        let data = await IDBStorage.getItem(pendingSlot);
        if (!data) {
            const legacyJson = localStorage.getItem(`GW_SAVE_DATA_${pendingSlot}`);
            if(legacyJson) data = JSON.parse(legacyJson);
        }

        if (data) {
            applyLoadedData(data, heroes);
            return;
        }
    } catch (e) {
        console.error("Critical Load Error:", e);
    }
  }

  // 로드할 데이터가 없으면 새 게임 시작
  if (userPool.length === 0) initUserPool(heroes, 3000);
};

// [데이터 복구 로직] - 여기가 가장 중요함 (undefined 방지)
const applyLoadedData = (data: any, defaultHeroes: Hero[]) => {
    const store = useGameStore.getState();
    
    // 1. 영웅 데이터 복구
    const loadedHeroMap = new Map(data.heroes?.map((h: any) => [h.id, h]) || []);
    const restoredHeroes = defaultHeroes.map(def => {
        const saved = loadedHeroMap.get(def.id);
        if (saved) {
            return {
                ...def,
                name: saved.name || def.name,
                concept: saved.concept || def.concept,
                record: saved.record || def.record
            };
        }
        return def;
    });

    // 2. 유저 데이터 복구
    if (data.users && Array.isArray(data.users)) {
        const cleanUsers = data.users.map((u: any) => ({
            ...u,
            heroStats: u.heroStats || {},
            history: u.history || [],
            status: 'OFFLINE' // 로드 직후엔 모두 오프라인 처리 (오류 방지)
        }));
        replaceUserPool(cleanUsers);
    } else {
        initUserPool(restoredHeroes, 3000);
    }

    // 3. 매치 데이터 정밀 복구 (무한루프 원인 해결)
    const sanitizedMatches = (data.liveMatches || []).map((m: any) => ({
        ...m,
        // [중요] 배열들을 강제로 빈 배열로 초기화 (undefined 에러 방지)
        minions: [], 
        projectiles: [], 
        jungleMobs: [],
        logs: [], 
        timeline: [],
        
        // 팀원 데이터 안전장치
        blueTeam: (m.blueTeam||[]).map((p:any)=>({...p, items: p.items||[], cooldowns: {q:0,w:0,e:0,r:0}})),
        redTeam: (m.redTeam||[]).map((p:any)=>({...p, items: p.items||[], cooldowns: {q:0,w:0,e:0,r:0}})),
        
        // [중요] 넥서스 체력이 문자열이거나 NaN이면 숫자로 강제 변환
        stats: {
            blue: { 
                ...m.stats?.blue, 
                nexusHp: Number(m.stats?.blue?.nexusHp || 5000), 
                towers: m.stats?.blue?.towers || {top:0,mid:0,bot:0},
                activeBuffs: m.stats?.blue?.activeBuffs || { siegeUnit: false, voidPower: false }
            },
            red: { 
                ...m.stats?.red, 
                nexusHp: Number(m.stats?.red?.nexusHp || 5000),
                towers: m.stats?.red?.towers || {top:0,mid:0,bot:0},
                activeBuffs: m.stats?.red?.activeBuffs || { siegeUnit: false, voidPower: false }
            }
        },
        // 오브젝트 리젠 타이머 초기화
        objectives: {
            colossus: { hp: 0, maxHp: 10000, status: 'DEAD', nextSpawnTime: m.currentDuration + 60 },
            watcher: { hp: 0, maxHp: 10000, status: 'DEAD', nextSpawnTime: m.currentDuration + 120 }
        }
    }));

    // 4. 스토어 상태 업데이트
    useGameStore.setState({ 
        gameState: {
            ...store.gameState,
            ...data.time,
            tierConfig: { ...store.gameState.tierConfig, ...data.config?.tier },
            battleSettings: { ...store.gameState.battleSettings, ...data.config?.battle },
            fieldSettings: { ...store.gameState.fieldSettings, ...data.config?.field },
            roleSettings: { ...store.gameState.roleSettings, ...data.config?.role },
            aiConfig: { ...store.gameState.aiConfig, ...data.config?.ai },
            itemStats: data.itemStats || {},
            godStats: data.godStats || store.gameState.godStats,
            customImages: { ...store.gameState.customImages, ...(data.customImages || {}) },
            liveMatches: sanitizedMatches,
            topRankers: getTopRankers(restoredHeroes, data.config?.tier),
            userStatus: calculateUserEcosystem(0, userPool.length, data.config?.tier),
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

export const exportSaveFile = async () => { /* 구현 생략 */ };
export const importSaveFile = (file: File, heroes: Hero[]) => { return new Promise<boolean>((r)=>r(false)); };
