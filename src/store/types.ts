import { Hero, Item, Post, GameState, RoleSettings, AIConfig, TierConfig, BattleSettings, BattlefieldSettings } from '../types';

// Hero Slice 인터페이스
export interface HeroSlice {
  heroes: Hero[];
  addHero: (hero: Hero) => void;
  deleteHero: (heroId: string) => void;
  updateHero: (id: string, updates: Partial<Hero>) => void;
  resetHeroStats: () => void;
}

// Community Slice 인터페이스
export interface CommunitySlice {
  communityPosts: Post[];
  selectedPost: Post | null;
  openPost: (post: Post) => void;
  closePost: () => void;
  setCommunityPosts: (posts: Post[]) => void;
}

// Item Slice 인터페이스
export interface ItemSlice {
  shopItems: Item[];
  addItem: (item: Item) => void;
  deleteItem: (id: string) => void;
  updateItem: (id: string, updates: Partial<Item>) => void;
}

// Game Slice 인터페이스
export interface GameSlice {
  gameState: GameState;
  setSpeed: (speed: number) => void;
  togglePlay: () => void;
  setGameState: (updates: Partial<GameState>) => void;
  updateBattleSettings: (settings: Partial<BattleSettings>) => void;
  updateFieldSettings: (settings: Partial<BattlefieldSettings>) => void;
  updateTierConfig: (config: TierConfig) => void;
  updateAIConfig: (config: Partial<AIConfig>) => void;
  updateRoleSettings: (settings: Partial<RoleSettings>) => void;
  setCustomImage: (id: string, data: string) => void;
  removeCustomImage: (id: string) => void;
  loadModData: (data: any) => void;
  tick: (delta: number) => void;
  hardReset: () => void;
}

// [중요] 모든 Slice를 합친 전체 스토어 타입
export interface GameStore extends HeroSlice, CommunitySlice, ItemSlice, GameSlice {}
