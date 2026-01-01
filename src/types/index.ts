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
  avgKda: string; kdaRatio: string;
  avgDpm: string; avgDpg: string; avgCs: string; avgGold: string;
}

// ------------------------------------------------------------------
// 2. 아이템(Item) 및 상점 관련
// ------------------------------------------------------------------
export interface Item {
  id: string; name: string; cost: number;
  ad: number; ap: number; hp: number; armor: number; crit: number; speed: number;
  type: 'WEAPON' | 'ARMOR' | 'ACCESSORY' | 'POWER'; description?: string;
}

export interface ItemStatData {
  itemId: string; totalPicks: number; totalWins: number;
  totalKills: number; totalDeaths: number; totalAssists: number;
}

// ------------------------------------------------------------------
// 3. 게임 설정
// ------------------------------------------------------------------
export interface ObjectStats { hp: number; armor: number; rewardGold: number; }
export interface ColossusSettings extends ObjectStats { attack: number; }
export interface WatcherSettings extends ObjectStats { buffType: 'COMBAT' | 'GOLD'; buffAmount: number; buffDuration: number; }

export interface JungleSettings {
  density: number; yield: number; attack: number; defense: number; threat: number;
}

export interface BattlefieldSettings {
  tower: ObjectStats; colossus: ColossusSettings; watcher: WatcherSettings; jungle: JungleSettings;
}

export interface MinionStats {
  label: string; hp: number; def: number; atk: number; gold: number; xp: number;
}

export interface GodSettings {
  name: string; atkRatio: number; defRatio: number; hpRatio: number;
  guardianHp: number; towerAtk: number; trait: string;
  minions: { melee: MinionStats; ranged: MinionStats; siege: MinionStats; };
  servantGold: number; servantXp: number; 
}

export interface EconomySettings { minionGold: number; minionXp: number; }

export interface BattleSettings {
  izman: GodSettings; dante: GodSettings; economy: EconomySettings;
}

export interface RoleSettings {
  executor: { damage: number; defense: number }; 
  tracker: { gold: number; smiteChance: number }; 
  prophet: { cdrPerLevel: number }; 
  slayer: { structureDamage: number }; 
  guardian: { survivalRate: number }; 
}

// [수정] 티어 설정: 챌린저 등수 제한 및 티어별 승급전 판수 설정
export interface TierConfig { 
  challengerRank: number; // 챌린저 등수 제한
  master: number; ace: number; joker: number; gold: number; silver: number; bronze: number; 

  // 각 티어로 승급할 때 치르는 판수 (3, 5, 7, 9)
  promos: {
    master: number;
    ace: number;
    joker: number;
    gold: number;
    silver: number;
    bronze: number;
  };
}

export interface AIConfig { provider: 'GEMINI' | 'OPENAI'; apiKey: string; model: string; enabled: boolean; }

// ------------------------------------------------------------------
// 4. 유저 및 통계
// ------------------------------------------------------------------
export interface MatchHistory { 
  season: number; result: 'WIN' | 'LOSE' | 'PROMO WIN' | 'PROMO LOSS'; heroName: string; kda: string; lpChange: number; date: string; 
}
export interface UserHeroStat { matches: number; wins: number; kills: number; deaths: number; assists: number; }

export interface UserProfile { 
  id: number; name: string; mainHeroId: string; score: number; 
  tier: string; winRate: number; totalGames: number; 
  history: MatchHistory[]; heroStats: Record<string, UserHeroStat>; preferredLane: string;
  mostChamps: any[]; laneStats: any[];

  // 승급전 정보
  promoStatus?: {
    targetTier: string; 
    wins: number;
    losses: number;
    targetWins: number; 
  } | null;

  // 랭킹 (챌린저 판별용)
  rank?: number;
  isChallenger?: boolean;
}

export interface TierStat { name: string; minScore: number; count: number; percent: number; color: string; }
export interface UserStatus { totalGames: number; playingUsers: number; queuingUsers: number; avgWaitTime: number; tierDistribution: TierStat[]; }
export interface GodStats { 
  totalMatches: number; izmanWins: number; izmanAvgKills: string; izmanAvgTime: string; 
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
  gold: number; cs: number; totalDamageDealt: number;
  currentHp: number; maxHp: number; level: number; 
  items: Item[]; x: number; y: number; lane: 'TOP' | 'MID' | 'BOT' | 'JUNGLE'; buffs: string[]; mmr: number; 
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

  // 오브젝트 스폰 타이머
  nextColossusSpawnTime: number; 
  nextWatcherSpawnTime: number;
}

// ------------------------------------------------------------------
// 6. 커뮤니티 & 전체 상태
// ------------------------------------------------------------------
export interface Comment { id: number; author: string; authorTier: string; content: string; timestamp: string; }
export interface Post { 
  id: number; author: string; authorTier: string; title: string; content: string; 
  category: '공략'|'유머'|'징징'|'분석'|'잡담'|'질문'|'자랑'|'공지'; 
  views: number; upvotes: number; downvotes: number; 
  comments: number; commentList: Comment[]; createdAt: number; potential: number; isBest: boolean; displayTime: string; 
}

export interface GameState {
  season: number; day: number; hour: number; minute: number; second: number;
  isPlaying: boolean; gameSpeed: number; userSentiment: number; ccu: number; totalUsers: number;
  userStatus: UserStatus; topRankers: UserProfile[]; godStats: GodStats; liveMatches: LiveMatch[];
  tierConfig: TierConfig; battleSettings: BattleSettings; fieldSettings: BattlefieldSettings; 
  roleSettings: RoleSettings; aiConfig: AIConfig; itemStats: Record<string, ItemStatData>;
  customImages: Record<string, string>; 
}