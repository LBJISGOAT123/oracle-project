// ==========================================
// FILE PATH: /src/store/types.ts
// ==========================================

import { 
  Hero, Post, GameState, Item, 
  BattleSettings, BattlefieldSettings, TierConfig, AIConfig, RoleSettings, 
  ItemStatData 
} from '../types';

// 1. Hero Slice (영웅 관리)
export interface HeroSlice {
  heroes: Hero[];
  addHero: (hero: Hero) => void;
  deleteHero: (heroId: string) => void;
  updateHero: (id: string, updates: Partial<Hero>) => void;
  resetHeroStats: () => void;
}

// 2. Community Slice (커뮤니티)
export interface CommunitySlice {
  communityPosts: Post[];
  selectedPost: Post | null;
  openPost: (post: Post) => void;
  closePost: () => void;
  setCommunityPosts: (posts: Post[]) => void;
}

// 3. Setting Slice (설정 관리) - [신규 분리됨]
export interface SettingSlice {
  updateBattleSettings: (settings: Partial<BattleSettings['izman'] | BattleSettings['dante']>) => void;
  updateFieldSettings: (settings: Partial<BattlefieldSettings>) => void;
  updateTierConfig: (config: TierConfig) => void;
  updateAIConfig: (config: Partial<AIConfig>) => void;
  updateRoleSettings: (settings: Partial<RoleSettings>) => void;
  setCustomImage: (id: string, imageData: string) => void;
  removeCustomImage: (id: string) => void;
  loadModData: (modData: any) => void;
}

// 4. Game Slice (게임 진행/메인 루프)
export interface GameSlice {
  gameState: GameState;
  setSpeed: (speed: number) => void;
  togglePlay: () => void;
  setGameState: (updates: Partial<GameState>) => void;
  tick: (deltaSeconds: number) => void; // 핵심 루프
  hardReset: () => void;
}

// 5. Item Slice (아이템 상점)
export interface ItemSlice {
  shopItems: Item[];
  addItem: (item: Item) => void;
  deleteItem: (id: string) => void;
  updateItem: (id: string, updates: Partial<Item>) => void;
}

// 통합 Store 타입
export type GameStore = HeroSlice & CommunitySlice & SettingSlice & GameSlice & ItemSlice;