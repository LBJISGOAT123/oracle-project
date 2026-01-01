// ==========================================
// FILE PATH: /src/store/types.ts
// ==========================================

import { 
  Hero, Post, GameState, Item, 
  BattleSettings, BattlefieldSettings, TierConfig, AIConfig, RoleSettings, 
  ItemStatData 
} from '../types';

// 1. Hero Slice Interface
export interface HeroSlice {
  heroes: Hero[];
  addHero: (hero: Hero) => void;
  deleteHero: (heroId: string) => void;
  updateHero: (id: string, updates: Partial<Hero>) => void;
  resetHeroStats: () => void;
}

// 2. Community Slice Interface
export interface CommunitySlice {
  communityPosts: Post[];
  selectedPost: Post | null;
  openPost: (post: Post) => void;
  closePost: () => void;
  setCommunityPosts: (posts: Post[]) => void;
}

// 3. Game Slice Interface
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

// 4. Item Slice Interface
export interface ItemSlice {
  shopItems: Item[];
  addItem: (item: Item) => void;
  deleteItem: (id: string) => void;
  updateItem: (id: string, updates: Partial<Item>) => void;
}

// 5. Combined Store Interface (이 부분이 없어서 에러가 발생했습니다)
export type GameStore = HeroSlice & CommunitySlice & GameSlice & ItemSlice;
