// ==========================================
// FILE PATH: /src/types/index.ts
// ==========================================

// ------------------------------------------------------------------
// 1. 기본 상수 및 영웅/스킬 관련
// ------------------------------------------------------------------
export type Role = '집행관' | '선지자' | '수호기사' | '추적자' | '신살자';
export type Tier = 'OP' | '1' | '2' | '3' | '4' | '5';
export type SkillMechanic = 
  | 'DAMAGE' | 'HEAL' | 'SHIELD' | 'HOOK' | 'DASH' 
  | 'STUN' | 'STEALTH' | 'EXECUTE' | 'GLOBAL' | 'NONE';

export interface HeroStats {
  ad: number; ap: number; hp: number; armor: number; crit: number;
  range: number; speed: number; regen: number; pen: number; baseAtk: number;
}

export interface SkillDetail {
  name: string; 
  mechanic: SkillMechanic; 
  val: number;
  adRatio: number; 
  apRatio: number; 
  cd: number; 
  range: number; // [필수] 사거리
  duration?: number; 
  isPassive?: boolean;
}

export interface HeroSkillSet {
  passive: SkillDetail; q: SkillDetail; w: SkillDetail; e: SkillDetail; r: SkillDetail;
}

export interface HeroRecord {
  totalMatches: number; totalWins: number; totalPicks: number; totalBans: number;
  totalKills: number; totalDeaths: number; totalAssists: number;
  totalDamage: number; totalDamageTaken: number; totalCs: number; totalGold: number;
  recentResults: boolean[]; 
}

export interface Hero {
  id: string; name: string; role: Role; stats: HeroStats; skills: HeroSkillSet;
  record: HeroRecord; tier: Tier; rank: number; rankChange: number;
  recentWinRate: number; pickRate: number; banRate: number;
  avgKda: string; kdaRatio: string;
  avgDpm: string; avgDpg: string; avgCs: string; avgGold: string;
}

// ------------------------------------------------------------------
// 2. 아이템(Item) 및 상점 관련
// ------------------------------------------------------------------
export interface Item {
  id: string;
  name: string;
  cost: number;
  ad: number; ap: number; hp: number; armor: number; crit: number; speed: number;
  type: 'WEAPON' | 'ARMOR' | 'ACCESSORY' | 'POWER'; 
  description?: string;
}

export interface ItemStatData {
  itemId: string;
  totalPicks: number;
  totalWins: number;
  totalKills: number;
  totalDeaths: number;
  totalAssists: number;
}

// ------------------------------------------------------------------
// 3. 게임 설정 (Gods, Battle, Tier, Role)
// ------------------------------------------------------------------
export interface ObjectStats { hp: number; armor: number; rewardGold: number; }
export interface ColossusSettings extends ObjectStats { attack: number; respawnTime: number; }
export interface WatcherSettings extends ObjectStats { buffType: 'COMBAT' | 'GOLD'; buffAmount: number; buffDuration: number; respawnTime: number; }

export interface JungleSettings {
  density: number; 
  threat: number;  
  yield: number;   
  attack: number; 
  defense: number; 
}

export interface BattlefieldSettings {
  tower: ObjectStats; 
  colossus: ColossusSettings; 
  watcher: WatcherSettings;
  jungle: JungleSettings; 
}

export interface RoleSettings {
  executor: { damage: number; defense: number }; 
  tracker: { gold: number; smiteChance: number }; 
  prophet: { cdrPerLevel: number }; 
  slayer: { structureDamage: number }; 
  guardian: { survivalRate: number }; 
}

export interface MinionStats { label: string; hp: number; def: number; atk: number; gold: number; xp: number; }
export interface GodSettings {
  name: string; atkRatio: number; defRatio: number; hpRatio: number;
  guardianHp: number; towerAtk: number; trait: string;
  minions: { melee: MinionStats; ranged: MinionStats; siege: MinionStats; };
  servantGold: number; servantXp: number; 
}
export interface EconomySettings { minionGold: number; minionXp: number; }
export interface BattleSettings { izman: GodSettings; dante: GodSettings; economy: EconomySettings; }

export interface TierConfig { 
  challengerRank: number; 
  master: number; ace: number; joker: number; gold: number; silver: number; bronze: number; 
  promos: { master: number; ace: number; joker: number; gold: number; silver: number; bronze: number; };
}
export interface AIConfig { provider: 'GEMINI' | 'OPENAI'; apiKey: string; model: string; enabled: boolean; }

// ------------------------------------------------------------------
// 4. 유저 및 통계
// ------------------------------------------------------------------
export interface MatchHistory { 
  season: number; result: 'WIN' | 'LOSE' | 'PROMO WIN' | 'PROMO LOSS'; heroName: string; kda: string; lpChange: number; date: string; 
}

export interface UserHeroStat {
  matches: number; wins: number; kills: number; deaths: number; assists: number;
}

export interface UserProfile { 
  id: number; name: string; mainHeroId: string; score: number; 
  tier: string; winRate: number; totalGames: number; 
  history: MatchHistory[]; heroStats: Record<string, UserHeroStat>; preferredLane: string;
  mostChamps: any[]; laneStats: any[];
  promoStatus?: { targetTier: string; wins: number; losses: number; targetWins: number; } | null;
  rank?: number; isChallenger?: boolean;

  // [NEW] 뇌지컬(운영/전략) & 피지컬(반응/교전)
  brain: number;     // 0 ~ 100
  mechanics: number; // 0 ~ 100
}


export interface TierStat { name: string; minScore: number; count: number; percent: number; color: string; }
export interface UserStatus { totalGames: number; playingUsers: number; queuingUsers: number; avgWaitTime: number; tierDistribution: TierStat[]; }

export interface GodStats { 
  totalMatches: number; 
  izmanWins: number; izmanAvgKills: string; izmanAvgTime: string; 
  danteWins: number; danteAvgKills: string; danteAvgTime: string; 
  avgGameDuration: number; guardianDeathRate: number; godAwakenRate: number; 
}

// ------------------------------------------------------------------
// 5. 인게임 및 로그
// ------------------------------------------------------------------
// [수정] 문법 오류 수정 (; 제거) 및 DEBUG 타입 추가
export type EventType = 'KILL' | 'TOWER' | 'COLOSSUS' | 'WATCHER' | 'START' | 'SKILL' | 'DODGE' | 'LEVELUP' | 'DEBUG';

export interface GameLog { time: number; message: string; type: EventType; team?: 'BLUE' | 'RED'; }
export interface TimelineEvent { time: number; type: EventType; killerId: string; victimId: string; message: string; }

export interface LivePlayer { 
  name: string; heroId: string; kills: number; deaths: number; assists: number; 
  gold: number; cs: number; totalDamageDealt: number;
  currentHp: number; maxHp: number; level: number;  exp: number;
  items: Item[]; 
  x: number; y: number; lane: 'TOP' | 'MID' | 'BOT' | 'JUNGLE'; buffs: string[]; 
  mmr: number; 

  // [NEW] 인게임 연산을 위해 유저 스탯을 가져옴
  stats: {
    brain: number;
    mechanics: number;
  };
}


export interface TowerStatus { top: number; mid: number; bot: number; }

export interface TeamStats { 
  towers: TowerStatus; colossus: number; watcher: number; fury: number; 
  nexusHp: number; maxNexusHp: number;
  activeBuffs: { siegeUnit: boolean; voidPower: boolean; voidBuffEndTime?: number; };
}

// [핵심 추가] 중립 오브젝트 실시간 상태
export interface NeutralObjState {
  hp: number;
  maxHp: number;
  status: 'ALIVE' | 'DEAD';
  nextSpawnTime: number;
}
  
// [NEW] 밴픽 진행 상태 (decisionTime 추가됨)
export interface DraftState {
  isBlueTurn: boolean;
  turnIndex: number;
  timer: number;       // UI에 보여줄 남은 시간 (예: 30초)
  decisionTime: number; // [신규] 실제로 픽을 할 시간 (예: 12초에 픽)
  phase: 'BAN' | 'PICK' | 'COMPLETED';
}

// [수정] LiveMatch 중복 필드 제거 및 정리
export interface LiveMatch { 
  id: string; 
  // [NEW] 매치 상태 (드래프트 중인지, 게임 중인지)
  status: 'DRAFTING' | 'PLAYING' | 'FINISHED';

  // [NEW] 드래프트 정보 (선택적)
  draft?: DraftState; 

  blueTeam: LivePlayer[]; 
  redTeam: LivePlayer[]; 
  bans: { blue: string[]; red: string[]; }; 

  startTime: number; 
  duration: number; 
  currentDuration: number; 
  avgTier: string; 

  score: { blue: number, red: number }; 
  stats: { blue: TeamStats; red: TeamStats; };

  timeline: TimelineEvent[]; 
  logs: GameLog[]; 

  nextColossusSpawnTime: number; 
  nextWatcherSpawnTime: number;

  // [필수] 관전 모달에서 체력바를 그리기 위해 필요한 필드
  objectives: {
    colossus: NeutralObjState;
    watcher: NeutralObjState;
  };
}

// ------------------------------------------------------------------
// 6. 커뮤니티
// ------------------------------------------------------------------
export interface Comment { id: number; author: string; authorTier: string; content: string; timestamp: string; }

export interface Post { 
  id: number; author: string; authorTier: string; title: string; content: string; 
  category: '공략' | '유머' | '징징' | '분석' | '잡담' | '질문' | '자랑' | '공지'; 
  views: number; upvotes: number; downvotes: number; 
  comments: number; commentList: Comment[]; createdAt: number; potential: number; isBest: boolean; displayTime: string; 
}

// ------------------------------------------------------------------
// 7. 전체 상태
// ------------------------------------------------------------------
export interface GameState {
  season: number; day: number; hour: number; minute: number; second: number;
  isPlaying: boolean; gameSpeed: number;
  userSentiment: number; ccu: number; totalUsers: number;
  userStatus: UserStatus; 
  topRankers: UserProfile[];
  godStats: GodStats; 
  liveMatches: LiveMatch[];
  tierConfig: TierConfig;
  battleSettings: any; // 유연성을 위해 any 허용 (GodSettings 호환)
  fieldSettings: BattlefieldSettings; 
  roleSettings: RoleSettings;
  aiConfig: AIConfig;
  itemStats: Record<string, ItemStatData>;
  customImages: Record<string, string>;
}

// ------------------------------------------------------------------
// 8. Store Slice Types
// ------------------------------------------------------------------
export interface HeroSlice {
  heroes: Hero[];
  addHero: (hero: Hero) => void;
  deleteHero: (heroId: string) => void;
  updateHero: (id: string, updates: Partial<Hero>) => void;
  resetHeroStats: () => void;
}

export interface ItemSlice {
  shopItems: Item[];
  addItem: (item: Item) => void;
  deleteItem: (id: string) => void;
  updateItem: (id: string, updates: Partial<Item>) => void;
}

export interface CommunitySlice {
  communityPosts: Post[];
  selectedPost: Post | null;
  openPost: (post: Post) => void;
  closePost: () => void;
  setCommunityPosts: (posts: Post[]) => void;
}

export interface GameSlice {
  gameState: GameState;

  setSpeed: (speed: number) => void;
  togglePlay: () => void;
  setGameState: (updates: Partial<GameState>) => void;

  updateBattleSettings: (settings: Partial<BattleSettings['izman'] | BattleSettings['dante']>) => void;
  updateFieldSettings: (settings: Partial<BattlefieldSettings>) => void;
  updateTierConfig: (config: TierConfig) => void;
  updateAIConfig: (config: Partial<AIConfig>) => void;
  updateRoleSettings: (settings: Partial<RoleSettings>) => void;

  setCustomImage: (id: string, imageData: string) => void;
  removeCustomImage: (id: string) => void;
  loadModData: (modData: any) => void;

  tick: (deltaSeconds: number) => void;
  hardReset: () => void;
}

// Combined Store Type
export type GameStore = HeroSlice & ItemSlice & CommunitySlice & GameSlice;
