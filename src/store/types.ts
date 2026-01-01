// ==========================================
// FILE PATH: /src/types/index.ts
// ==========================================

// 1. 기본 상수 및 스킬
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
  name: string; mechanic: SkillMechanic; val: number;
  adRatio: number; apRatio: number; cd: number; 
  range?: number; duration?: number; isPassive?: boolean;
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
  avgKda: string; kdaRatio: string; avgDpm: string; avgDpg: string; avgCs: string; avgGold: string;
}

// 2. 아이템
export interface Item {
  id: string; name: string; cost: number;
  ad: number; ap: number; hp: number; armor: number; crit: number; speed: number;
  type: 'WEAPON' | 'ARMOR' | 'ACCESSORY' | 'POWER'; description?: string;
}

export interface ItemStatData {
  itemId: string; totalPicks: number; totalWins: number;
  totalKills: number; totalDeaths: number; totalAssists: number;
}

// 3. 게임 설정 (Gods, Battle, Jungle)
export interface ObjectStats { hp: number; armor: number; rewardGold: number; }
export interface ColossusSettings extends ObjectStats { attack: number; }
export interface WatcherSettings extends ObjectStats { buffType: 'COMBAT' | 'GOLD'; buffAmount: number; buffDuration: number; }

// [신규] 정글(혼돈의 균열) 설정
export interface JungleSettings {
  density: number; // 밀도
  yield: number;   // 풍요도 (보상)
  attack: number;  // 크리처 공격력
  defense: number; // 크리처 방어력
  threat?: number; // (하위 호환용)
}

export interface BattlefieldSettings {
  tower: ObjectStats; 
  colossus: ColossusSettings; 
  watcher: WatcherSettings;
  jungle: JungleSettings; // [추가됨]
}

// 하수인 스탯 구조
export interface MinionStats {
  label: string; hp: number; def: number; atk: number; gold: number; xp: number;
}

export interface GodSettings {
  name: string; atkRatio: number; defRatio: number; hpRatio: number;
  guardianHp: number; towerAtk: number; trait: string;
  minions: {
    melee: MinionStats;
    ranged: MinionStats;
    siege: MinionStats;
  };
  servantGold: number; servantXp: number; // (하위 호환용)
}

export interface EconomySettings { minionGold: number; minionXp: number; }

export interface BattleSettings {
  izman: GodSettings; dante: GodSettings; economy: EconomySettings;
}

// 역할군 밸런스 설정
export interface RoleSettings {
  executor: { damage: number; defense: number }; 
  tracker: { gold: number; smiteChance: number }; 
  prophet: { cdrPerLevel: number }; 
  slayer: { structureDamage: number }; 
  guardian: { survivalRate: number }; 
}

export interface TierConfig { challenger: number; master: number; ace: number; joker: number; gold: number; silver: number; bronze: number; }
export interface AIConfig { provider: 'GEMINI' | 'OPENAI'; apiKey: string; model: string; enabled: boolean; }

// 4. 유저 및 통계
export interface MatchHistory { season: number; result: 'WIN' | 'LOSE'; heroName: string; kda: string; lpChange: number; date: string; }
export interface UserHeroStat { matches: number; wins: number; kills: number; deaths: number; assists: number; }

export interface UserProfile { 
  id: number; name: string; mainHeroId: string; score: number; tier: string; winRate: number; totalGames: number; 
  history: MatchHistory[]; heroStats: Record<string, UserHeroStat>; preferredLane: string;
  mostChamps: any[]; laneStats: any[];
}

export interface TierStat { name: string; minScore: number; count: number; percent: number; color: string; }
export interface UserStatus { totalGames: number; playingUsers: number; queuingUsers: number; avgWaitTime: number; tierDistribution: TierStat[]; }

export interface GodStats { 
  totalMatches: number; izmanWins: number; izmanAvgKills: string; izmanAvgTime: string; 
  danteWins: number; danteAvgKills: string; danteAvgTime: string; 
  avgGameDuration: number; guardianDeathRate: number; godAwakenRate: number; 
}

// 5. 인게임 및 로그
export type EventType = 'KILL' | 'TOWER' | 'COLOSSUS' | 'WATCHER' | 'START';
export interface GameLog { time: number; message: string; type: EventType; team?: 'BLUE' | 'RED'; }
export interface TimelineEvent { time: number; type: EventType; killerId: string; victimId: string; message: string; }

export interface LivePlayer { 
  name: string; heroId: string; kills: number; deaths: number; assists: number; 
  gold: number; cs: number; 
  totalDamageDealt: number; // 누적 피해량
  currentHp: number; maxHp: number; level: number; 
  items: Item[]; x: number; y: number; lane: 'TOP' | 'MID' | 'BOT' | 'JUNGLE'; buffs: string[]; 
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

// 6. 커뮤니티
export interface Comment { id: number; author: string; authorTier: string; content: string; timestamp: string; }
export interface Post { 
  id: number; author: string; authorTier: string; title: string; content: string; 
  category: '공략' | '유머' | '징징' | '분석' | '잡담' | '질문' | '자랑' | '공지'; 
  views: number; upvotes: number; downvotes: number; 
  comments: number; commentList: Comment[]; createdAt: number; potential: number; isBest: boolean; displayTime: string; 
}

// 7. 전체 상태
export interface GameState {
  season: number; 
  day: number; 
  hour: number; 
  minute: number; 
  second: number; // [신규] 초 단위 추가

  isPlaying: boolean; 
  gameSpeed: number;
  userSentiment: number; 
  ccu: number; 
  totalUsers: number;
  userStatus: UserStatus; 
  topRankers: UserProfile[];
  godStats: GodStats; 
  liveMatches: LiveMatch[];

  tierConfig: TierConfig; 
  battleSettings: BattleSettings; 
  fieldSettings: BattlefieldSettings; // JungleSettings 포함
  roleSettings: RoleSettings; 
  aiConfig: AIConfig;
  itemStats: Record<string, ItemStatData>;
}