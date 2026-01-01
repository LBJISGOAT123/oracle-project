// src/store/types.ts
import { Hero, Item, Post, GameState, RoleSettings, AIConfig, TierConfig, BattleSettings, BattlefieldSettings } from '../types';

export interface HeroSlice {
  heroes: Hero[];
  addHero: (hero: Hero) => void;
  deleteHero: (heroId: string) => void;
  updateHero: (id: string, updates: Partial<Hero>) => void;
  resetHeroStats: () => void;
}

export interface CommunitySlice {
  communityPosts: Post[];
  selectedPost: Post | null;
  openPost: (post: Post) => void;
  closePost: () => void;
  setCommunityPosts: (posts: Post[]) => void;
}

export interface ItemSlice {
  shopItems: Item[];
  addItem: (item: Item) => void;
  deleteItem: (id: string) => void;
  updateItem: (id: string, updates: Partial<Item>) => void;
}

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

// [핵심] 이 줄이 반드시 있어야 에러가 안 납니다!
export interface GameStore extends HeroSlice, CommunitySlice, ItemSlice, GameSlice {}
