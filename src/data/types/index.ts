// ==========================================
// FILE PATH: /src/types/index.ts
// ==========================================

// ------------------------------------------------------------------
// 1. 기본 상수 및 스킬 관련
// ------------------------------------------------------------------
export type Role = '집행관' | '선지자' | '수호기사' | '추적자' | '신살자';
export type Tier = 'OP' | '1' | '2' | '3' | '4' | '5';
export type SkillMechanic = 
  | 'DAMAGE' | 'HEAL' | 'SHIELD' | 'HOOK' | 'DASH' 
  | 'STUN' | 'STEALTH' | 'EXECUTE' | 'GLOBAL' | 'NONE';

export interface HeroStats {
  ad: number;      // 공격력
  ap: number;      // 주문력
  hp: number;      // 체력
  armor: number;   // 방어력
  crit: number;    // 치명타율
  range: number;   // 사거리
  speed: number;   // 이동속도
  regen: number;   // 체력 재생
  pen: number;     // 관통력
  baseAtk: number; // 기본 공격력
}

export interface SkillDetail {
  name: string; 
  mechanic: SkillMechanic; 
  val: number;
  adRatio: number; 
  apRatio: number; 
  cd: number; 
  range?: number; 
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
export interface ColossusSettings extends ObjectStats { attack: number; }
export interface WatcherSettings extends ObjectStats { buffType: 'COMBAT' | 'GOLD'; buffAmount: number; buffDuration: number; }

// [신규] 정글(혼돈의 균열) 설정 타입 정의
export interface JungleSettings {
  density: number; // 밀도 (0~100)
  threat: number;  // 위협도 (0~100)
  yield: number;   // 풍요도 (0~100)
}

export interface BattlefieldSettings {
  tower: ObjectStats; 
  colossus: ColossusSettings; 
  watcher: WatcherSettings;
  jungle: JungleSettings; // [추가됨]
}

// [신규] 역할군 밸런스 설정값 구조체
export interface RoleSettings {
  executor: { damage: number; defense: number }; // 집행관 (피해량%, 방어력%)
  tracker: { gold: number; smiteChance: number }; // 추적자 (골드%, 강타배율)
  prophet: { cdrPerLevel: number }; // 선지자 (레벨당 쿨감%)
  slayer: { structureDamage: number }; // 신살자 (구조물 피해량%)
  guardian: { survivalRate: number }; // 수호기사 (생존율 보정%)
}

export interface TierConfig { challenger: number; master: number; ace: number; joker: number; gold: number; silver: number; bronze: number; }
export interface AIConfig { provider: 'GEMINI' | 'OPENAI'; apiKey: string; model: string; enabled: boolean; }

// ------------------------------------------------------------------
// 4. 유저(User) 및 통계
// ------------------------------------------------------------------
export interface MatchHistory { 
  season: number; result: 'WIN' | 'LOSE'; heroName: string; kda: string; lpChange: number; date: string; 
}

export interface UserHeroStat {
  matches: number; wins: number; kills: number; deaths: number; assists: number;
}

export interface UserProfile { 
  id: number; name: string; mainHeroId: string; score: number; 
  tier: string; winRate: number; totalGames: number; 
  history: MatchHistory[]; heroStats: Record<string, UserHeroStat>; preferredLane: string;
  mostChamps: any[]; laneStats: any[];
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
// 5. 인게임(LiveMatch) 및 시뮬레이션 로그
// ------------------------------------------------------------------
export type EventType = 'KILL' | 'TOWER' | 'COLOSSUS' | 'WATCHER' | 'START';
export interface GameLog { time: number; message: string; type: EventType; team?: 'BLUE' | 'RED'; }
export interface TimelineEvent { time: number; type: EventType; killerId: string; victimId: string; message: string; }

export interface LivePlayer { 
  name: string; heroId: string; kills: number; deaths: number; assists: number; 
  gold: number; cs: number; currentHp: number; maxHp: number; level: number; 
  items: Item[]; 
  totalDamageDealt: number; // 누적 피해량
  x: number; y: number; lane: 'TOP' | 'MID' | 'BOT' | 'JUNGLE'; buffs: string[]; 
  mmr: number; 
}

export interface TowerStatus { top: number; mid: number; bot: number; }

export interface TeamStats { 
  towers: TowerStatus; colossus: number; watcher: number; fury: number; 
  nexusHp: number; maxNexusHp: number;
  activeBuffs: { siegeUnit: boolean; voidPower: boolean; voidBuffEndTime?: number; };
}

export interface LiveMatch { 
  id: string; blueTeam: LivePlayer[]; redTeam: LivePlayer[]; bans: { blue: string[]; red: string[]; }; 
  startTime: number; duration: number; currentDuration: number; avgTier: string; 
  score: { blue: number, red: number }; stats: { blue: TeamStats; red: TeamStats; };
  timeline: TimelineEvent[]; logs: GameLog[]; 
}

// ------------------------------------------------------------------
// 6. 커뮤니티(Community)
// ------------------------------------------------------------------
export interface Comment { id: number; author: string; authorTier: string; content: string; timestamp: string; }

export interface Post { 
  id: number; author: string; authorTier: string; title: string; content: string; 
  category: '공략' | '유머' | '징징' | '분석' | '잡담' | '질문' | '자랑' | '공지'; 
  views: number; upvotes: number; downvotes: number; 
  comments: number; commentList: Comment[]; createdAt: number; potential: number; isBest: boolean; displayTime: string; 
}

// ------------------------------------------------------------------
// 7. 전체 게임 상태 (GameState)
// ------------------------------------------------------------------
export interface GameState {
  season: number; day: number; hour: number; minute: number;
  isPlaying: boolean; gameSpeed: number;
  userSentiment: number; ccu: number; totalUsers: number;

  userStatus: UserStatus; 
  topRankers: UserProfile[];
  godStats: GodStats; 

  liveMatches: LiveMatch[];

  // 설정 관련
  tierConfig: TierConfig;
  battleSettings: BattleSettings;
  fieldSettings: BattlefieldSettings; 

  // [신규] 역할군 설정
  roleSettings: RoleSettings;

  aiConfig: AIConfig;
  itemStats: Record<string, ItemStatData>;
}