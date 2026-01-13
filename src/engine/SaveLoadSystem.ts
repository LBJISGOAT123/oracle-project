import { userPool, replaceUserPool, initUserPool, getTopRankers } from './system/UserManager';
import { analyzeHeroMeta, calculateUserEcosystem } from './system/RankingSystem';
import { useGameStore } from '../store/useGameStore';
import { Hero, GameState, SaveMeta, UserProfile, LiveMatch, LivePlayer, Item } from '../types';
import { IDBStorage } from '../utils/IDBStorage';

const META_KEY = 'GW_SAVE_META';
const PENDING_LOAD_KEY = 'GW_PENDING_LOAD';

// [저장]
export const saveToSlot = async (slotId: string): Promise<boolean> => {
  const store = useGameStore.getState();
  const state = store.gameState;

  // 저장 용량 최적화 (불필요한 로그/오브젝트 제외)
  const optimizedMatches = state.liveMatches.map(m => ({
    ...m, 
    logs: [], timeline: [], minions: [], projectiles: [], jungleMobs: []    
  }));

  const saveData = {
    version: 20, // 버전 변경 (구버전 데이터와 구분)
    time: { season: state.season, day: state.day, hour: state.hour, minute: state.minute },
    config: {
      battle: state.battleSettings,
      field: state.fieldSettings,
      role: state.roleSettings,
      tier: state.tierConfig,
      ai: state.aiConfig
    },
    customImages: state.customImages,
    // 영웅 데이터는 변동사항만 저장
    heroes: store.heroes.map(h => ({
      id: h.id, record: h.record, concept: h.concept, name: h.name
    })),
    // [중요] 현재 유저 풀 전체를 원본 그대로 저장
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

// [로드 트리거]
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

// [초기화]
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
  // 데이터가 없으면 새 게임 시작
  if (userPool.length === 0) initUserPool(heroes, 3000);
};

// [핵심] 데이터 무결성 검증 및 적용 (Data Integrity Check)
const applyLoadedData = (data: any, defaultHeroes: Hero[]) => {
    const store = useGameStore.getState();
    
    // 1. 영웅 데이터 복구
    const loadedHeroMap = new Map(data.heroes?.map((h: any) => [h.id, h]) || []);
    const restoredHeroes = defaultHeroes.map(def => {
        const saved = loadedHeroMap.get(def.id);
        return saved ? { ...def, ...saved } : def;
    });

    // 2. 유저 풀(Master Data) 복구
    // - 저장된 유저가 있으면 그걸 쓰고, 없으면 새로 만듭니다.
    // - 일단 모든 유저 상태를 'OFFLINE'으로 초기화합니다. (매치 검증 후 INGAME으로 변경)
    let restoredUsers: UserProfile[] = [];
    if (data.users && Array.isArray(data.users)) {
        restoredUsers = data.users.map((u: any) => ({
            ...u,
            heroStats: u.heroStats || {},
            history: u.history || [],
            status: 'OFFLINE' // 초기화
        }));
    } else {
        // 유저 데이터 유실 시 새 유저 생성 (비상 조치)
        initUserPool(restoredHeroes, 3000);
        restoredUsers = [...userPool];
    }

    // [검증용] 실제 존재하는 유저 이름 Set
    const validUserNames = new Set(restoredUsers.map(u => u.name));

    // 3. 매치 데이터 검증 (가짜 매치 박멸)
    const validMatches: LiveMatch[] = [];
    let droppedMatches = 0;

    const rawMatches = (data.liveMatches || []);
    
    rawMatches.forEach((m: any) => {
        // 매치에 포함된 10명의 플레이어 이름
        const participants = [...(m.blueTeam || []), ...(m.redTeam || [])];
        
        // [엄격 검증] 10명 전원이 실제 유저 풀에 존재하는가?
        const isValidMatch = participants.length === 10 && participants.every((p: any) => validUserNames.has(p.name));

        if (isValidMatch) {
            // 유효한 매치만 복구 (필수 배열 초기화 포함)
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

            // 검증된 유저들의 상태를 'INGAME'으로 변경
            participants.forEach((p: any) => {
                const u = restoredUsers.find(user => user.name === p.name);
                if (u) u.status = 'INGAME';
            });
        } else {
            // 유령 매치(가짜 데이터)는 버림
            droppedMatches++;
        }
    });

    console.log(`🧹 [Integrity Check] 유효 매치: ${validMatches.length} / 삭제된 가짜 매치: ${droppedMatches}`);

    // 유저 풀 전역 교체
    replaceUserPool(restoredUsers);

    // 4. 스토어 상태 적용
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
            liveMatches: validMatches, // 검증된 매치만 투입
            totalUsers: restoredUsers.length, // [중요] 실제 유저 수로 덮어씀
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
