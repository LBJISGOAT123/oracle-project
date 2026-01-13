import { userPool, replaceUserPool, initUserPool, getTopRankers } from './system/UserManager';
import { analyzeHeroMeta, calculateUserEcosystem } from './system/RankingSystem';
import { useGameStore } from '../store/useGameStore';
import { Hero, GameState, SaveMeta, LiveMatch, TowerStatus, TeamStats } from '../types';
import { IDBStorage } from '../utils/IDBStorage';
import { INITIAL_HEROES } from '../data/heroes';

const META_KEY = 'GW_SAVE_META';

// [데이터 정제] 유령 매치 제거
const validateAndCleanMatches = (matches: LiveMatch[], validHeroIds: Set<string>): LiveMatch[] => {
    const validUserNames = new Set(userPool.map(u => u.name));
    return matches.filter(match => {
        // 끝난 게임 제외
        if (match.stats.blue.nexusHp <= 0 || match.stats.red.nexusHp <= 0) return false;
        
        const allPlayers = [...match.blueTeam, ...match.redTeam];
        for (const p of allPlayers) {
            // 영웅 ID가 없거나 유저 명단에 없으면 삭제
            if (p.heroId && !validHeroIds.has(p.heroId)) return false;
            if (!validUserNames.has(p.name)) return false;
        }
        return true;
    });
};

// [데이터 병합] 구버전 호환성 확보
const safeMergeMatches = (savedMatches: any[], validHeroIds: Set<string>): LiveMatch[] => {
    if (!Array.isArray(savedMatches)) return [];

    const defaultBuffs = { siegeUnit: false, voidPower: false, voidBuffEndTime: 0 };
    const defaultTowers: TowerStatus = { top: 0, mid: 0, bot: 0 };
    const defaultObjs = { 
        colossus: { hp: 0, maxHp: 10000, status: 'DEAD', nextSpawnTime: 300 },
        watcher: { hp: 0, maxHp: 10000, status: 'DEAD', nextSpawnTime: 900 }
    };

    const restoredMatches = savedMatches.map(m => {
        // 타워 데이터가 숫자면 객체로 변환
        const blueTowers = (typeof m.stats?.blue?.towers === 'object') ? m.stats.blue.towers : defaultTowers;
        const redTowers = (typeof m.stats?.red?.towers === 'object') ? m.stats.red.towers : defaultTowers;
        
        // 버프 데이터 없으면 기본값
        const blueBuffs = m.stats?.blue?.activeBuffs || defaultBuffs;
        const redBuffs = m.stats?.red?.activeBuffs || defaultBuffs;

        return {
            ...m,
            // 무거운 객체 초기화
            minions: [], projectiles: [], jungleMobs: [],
            logs: (m.logs || []).slice(-20),
            stats: {
                blue: { ...m.stats?.blue, towers: blueTowers, activeBuffs: blueBuffs },
                red: { ...m.stats?.red, towers: redTowers, activeBuffs: redBuffs }
            },
            objectives: m.objectives || defaultObjs
        };
    });

    return validateAndCleanMatches(restoredMatches, validHeroIds);
};

// [핵심] 새로고침 없이 상태 즉시 적용 (Soft Load)
const applyStateDirectly = (data: any, defaultHeroes: Hero[]) => {
    const store = useGameStore.getState();
    
    // 1. 게임 일시정지 (안전 확보)
    if (store.gameState.isPlaying) {
        store.togglePlay();
    }

    console.log("🔄 Applying Save Data Directly...");

    // 2. 글로벌 유저 풀 복구
    if (data.users && Array.isArray(data.users)) {
        const cleanUsers = data.users.map((u: any) => ({
            ...u,
            heroStats: u.heroStats || {},
            history: u.history || [],
            brain: typeof u.brain === 'number' ? u.brain : 50,
            mechanics: typeof u.mechanics === 'number' ? u.mechanics : 50,
            status: 'OFFLINE' // 로드 직후 오프라인으로 시작 (매칭 충돌 방지)
        }));
        replaceUserPool(cleanUsers);
    } else {
        initUserPool(defaultHeroes, 3000);
    }

    // 3. 영웅 데이터 복구 (최신 스탯 + 저장된 전적)
    const mergedHeroes = INITIAL_HEROES.map(defaultHero => {
        const savedHero = (data.heroes || []).find((h: any) => h.id === defaultHero.id);
        if (savedHero) {
            return {
                ...defaultHero,
                record: savedHero.record || defaultHero.record,
                name: savedHero.name || defaultHero.name,
                concept: savedHero.concept || defaultHero.concept
            };
        }
        return defaultHero;
    });

    // 4. 매치 데이터 복구
    const validHeroIds = new Set(mergedHeroes.map(h => h.id));
    const validatedMatches = safeMergeMatches(data.liveMatches, validHeroIds);

    // 5. GameState 병합 (최신 기본값 + 저장된 값)
    const currentFreshState = store.gameState;
    const mergedState: GameState = {
        ...currentFreshState,
        ...data.time,
        tierConfig: { ...currentFreshState.tierConfig, ...data.config?.tier },
        battleSettings: { ...currentFreshState.battleSettings, ...data.config?.battle },
        fieldSettings: { ...currentFreshState.fieldSettings, ...data.config?.field },
        roleSettings: { ...currentFreshState.roleSettings, ...data.config?.role },
        aiConfig: { ...currentFreshState.aiConfig, ...data.config?.ai },
        itemStats: data.itemStats || {},
        godStats: data.godStats || currentFreshState.godStats,
        customImages: { ...currentFreshState.customImages, ...(data.customImages || {}) },
        liveMatches: validatedMatches,
        userSentiment: data.userSentiment || 50,
        isPlaying: false // 로드 후엔 멈춤 상태
    };

    // 6. 파생 데이터 재계산
    const recalculatedHeroes = analyzeHeroMeta(mergedHeroes);
    const recalculatedRankers = getTopRankers(recalculatedHeroes, mergedState.tierConfig);
    const recalculatedUserStatus = calculateUserEcosystem(0, userPool.length, mergedState.tierConfig);

    // 7. Store 업데이트 (화면 갱신)
    useGameStore.setState({ 
        gameState: {
            ...mergedState,
            topRankers: recalculatedRankers,
            userStatus: recalculatedUserStatus
        },
        heroes: recalculatedHeroes,
        shopItems: data.shopItems || store.shopItems
    });

    alert("로드 완료! (Soft Load)");
};

// [로드 함수 수정됨]
export const loadFromSlot = async (slotId: string, defaultHeroes: Hero[]): Promise<boolean> => {
  try {
    let data = await IDBStorage.getItem(slotId);
    
    // IDB 실패 시 로컬스토리지 백업 확인
    if (!data) {
        const legacyJson = localStorage.getItem(`GW_SAVE_DATA_${slotId}`);
        if(legacyJson) data = JSON.parse(legacyJson);
        else {
            alert("저장된 데이터가 없습니다.");
            return false;
        }
    }

    if (!data || !data.config) {
        alert("세이브 데이터가 손상되어 불러올 수 없습니다.");
        return false;
    }

    // [중요] window.location.reload()를 제거하고 직접 적용 함수 호출
    applyStateDirectly(data, defaultHeroes);
    return true;

  } catch (e) {
    console.error("Load Error:", e);
    alert("로드 중 오류가 발생했습니다.");
    return false;
  }
};

// [저장]
export const saveToSlot = async (slotId: string): Promise<boolean> => {
  const store = useGameStore.getState();
  const state = store.gameState;

  const optimizedMatches = state.liveMatches.map(m => ({
    ...m, logs: [], timeline: [], minions: [], projectiles: [], jungleMobs: []    
  }));

  const saveData = {
    version: 18, 
    time: { season: state.season, day: state.day, hour: state.hour, minute: state.minute, second: state.second },
    config: {
      battle: state.battleSettings,
      field: state.fieldSettings,
      role: state.roleSettings,
      tier: state.tierConfig,
      ai: state.aiConfig
    },
    customImages: state.customImages,
    heroes: store.heroes.map(h => ({
      id: h.id, name: h.name, stats: h.stats, skills: h.skills, record: h.record, concept: h.concept 
    })),
    users: userPool,
    itemStats: state.itemStats,
    shopItems: store.shopItems,
    godStats: state.godStats, 
    liveMatches: optimizedMatches,
    userSentiment: state.userSentiment,
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
    console.error("Save Failed:", e);
    return false;
  }
};

// [초기화]
export const initializeGame = async (heroes: Hero[]) => {
    // 이제 로드는 loadFromSlot에서 직접 하므로, 여기서는 무조건 새 게임만 시작
    if (userPool.length === 0) initUserPool(heroes, 3000);
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
export const importSaveFile = (file: File, heroes: Hero[]) => { return new Promise(()=>false); };
