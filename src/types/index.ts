// ==========================================
// FILE PATH: /src/types/index.ts
// ==========================================
export * from './user';
export * from './hero';
export * from './match';

import { TierConfig, AIConfig } from './user';
export { TierConfig, AIConfig };

export interface Item {
  id: string; name: string; cost: number;
  ad: number; ap: number; hp: number; armor: number; crit: number; speed: number;
  mp?: number; regen?: number; mpRegen?: number; pen?: number;
  type: 'WEAPON' | 'ARMOR' | 'ACCESSORY' | 'POWER' | 'BOOTS' | 'ARTIFACT'; 
  description?: string;
}

export interface ItemStatData { itemId: string; totalPicks: number; totalWins: number; totalKills: number; totalDeaths: number; totalAssists: number; }

export interface ObjectStats { hp: number; armor: number; rewardGold: number; atk?: number; }
export interface ColossusSettings extends ObjectStats { attack: number; initialSpawnTime: number; respawnTime: number; }
export interface WatcherSettings extends ObjectStats { buffType: 'COMBAT' | 'GOLD'; buffAmount: number; buffDuration: number; initialSpawnTime: number; respawnTime: number; }
export interface JungleSettings { density: number; threat: number; yield: number; attack: number; defense: number; xp: number; gold: number; initialSpawnTime: number; respawnTime: number; }

export interface Vector2 { x: number; y: number; }
export interface MapPositions {
  colossus: Vector2;
  watcher: Vector2;
  jungle: Vector2[];
  towers: {
    blue: { top: Vector2[]; mid: Vector2[]; bot: Vector2[]; nexus: Vector2; };
    red: { top: Vector2[]; mid: Vector2[]; bot: Vector2[]; nexus: Vector2; };
  };
}

export interface BattlefieldSettings { 
  towers: { t1: ObjectStats; t2: ObjectStats; t3: ObjectStats; nexus: ObjectStats; };
  colossus: ColossusSettings; 
  watcher: WatcherSettings; 
  jungle: JungleSettings; 
  positions: MapPositions;
}

export interface RoleSettings { executor: { damage: number; defense: number }; tracker: { gold: number; smiteChance: number }; prophet: { cdrPerLevel: number }; slayer: { structureDamage: number }; guardian: { survivalRate: number }; }
export interface MinionStats { label: string; hp: number; def: number; atk: number; gold: number; xp: number; }
export interface GodSettings {
  name: string; atkRatio: number; defRatio: number; hpRatio: number;
  guardianHp: number; towerAtk: number; trait: string;
  minions: { melee: MinionStats; ranged: MinionStats; siege: MinionStats; };
  servantGold: number; servantXp: number; 
}
export interface EconomySettings { minionGold: number; minionXp: number; }

export interface SiegeSettings {
  minionDmg: number; cannonDmg: number; superDmg: number;
  dmgToHero: number; dmgToT1: number; dmgToT2: number; dmgToT3: number; dmgToNexus: number;
  colossusToHero: number; colossusToT1: number; colossusToT2: number; colossusToT3: number; colossusToNexus: number;
}

export interface BattleSettings { 
  izman: GodSettings; 
  dante: GodSettings; 
  economy: EconomySettings; 
  siege: SiegeSettings; 
}

export interface AIConfig { provider: 'GEMINI' | 'OPENAI'; apiKey: string; model: string; enabled: boolean; }
export interface GodStats { totalMatches: number; izmanWins: number; izmanAvgKills: string; izmanAvgTime: string; danteWins: number; danteAvgKills: string; danteAvgTime: string; avgGameDuration: number; guardianDeathRate: number; godAwakenRate: number; }
export interface Comment { id: number; author: string; authorTier: string; content: string; timestamp: string; }
export interface Post { id: number; author: string; authorTier: string; title: string; content: string; category: '공략' | '유머' | '징징' | '분석' | '잡담' | '질문' | '자랑' | '공지'; views: number; upvotes: number; downvotes: number; comments: number; commentList: Comment[]; createdAt: number; potential: number; isBest: boolean; displayTime: string; }

import { UserProfile, UserStatus } from './user';
import { LiveMatch } from './match';

export interface TeamStats {
  towers: { top: number; mid: number; bot: number };
  laneHealth: { top: number; mid: number; bot: number };
  colossus: number;
  watcher: number;
  fury: number;
  nexusHp: number;
  maxNexusHp: number;
  activeBuffs: { siegeUnit: boolean; voidPower: boolean; voidBuffEndTime?: number; };
}

export interface GameState { 
  season: number; day: number; hour: number; minute: number; second: number; 
  isPlaying: boolean; gameSpeed: number; userSentiment: number; 
  ccu: number; totalUsers: number; 
  userStatus: UserStatus; topRankers: UserProfile[]; godStats: GodStats; 
  liveMatches: LiveMatch[]; 
  tierConfig: TierConfig; battleSettings: BattleSettings; fieldSettings: BattlefieldSettings; roleSettings: RoleSettings; aiConfig: AIConfig; 
  itemStats: Record<string, ItemStatData>; customImages: Record<string, string>; 
}

// [수정] Minion 인터페이스에 targetId 추가 (기억력)
export interface Minion {
  id: string;
  team: 'BLUE' | 'RED';
  lane: 'TOP' | 'MID' | 'BOT';
  type: 'MELEE' | 'RANGED' | 'SIEGE' | 'SUMMONED_COLOSSUS';
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  atk: number;
  pathIdx: number;
  targetId?: string; // 내가 때리고 있는 대상 ID
}

export interface HeroSlice { heroes: any[]; addHero: (hero: any) => void; deleteHero: (heroId: string) => void; updateHero: (id: string, updates: any) => void; resetHeroStats: () => void; }
export interface ItemSlice { shopItems: Item[]; addItem: (item: Item) => void; deleteItem: (id: string) => void; updateItem: (id: string, updates: Partial<Item>) => void; }
export interface CommunitySlice { communityPosts: Post[]; selectedPost: Post | null; openPost: (post: Post) => void; closePost: () => void; setCommunityPosts: (posts: Post[]) => void; }
export interface SettingSlice { 
  updateBattleSettings: (settings: any) => void; 
  updateFieldSettings: (settings: any) => void; 
  updateTierConfig: (config: TierConfig) => void; 
  updateAIConfig: (config: Partial<AIConfig>) => void; 
  updateRoleSettings: (settings: Partial<RoleSettings>) => void; 
  setCustomImage: (id: string, imageData: string) => void; 
  removeCustomImage: (id: string) => void; 
  loadModData: (modData: any) => void; 
  updateObjectPosition: (key: string, x: number, y: number) => void;
}
export interface GameSlice { gameState: GameState; setSpeed: (speed: number) => void; togglePlay: () => void; setGameState: (updates: Partial<GameState>) => void; tick: (deltaSeconds: number) => void; hardReset: () => void; }
export type GameStore = HeroSlice & ItemSlice & CommunitySlice & GameSlice & SettingSlice;
