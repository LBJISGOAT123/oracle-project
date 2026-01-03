// ==========================================
// FILE PATH: /src/store/slices/settingSlice.ts
// ==========================================
import { StateCreator } from 'zustand';
import { GameStore, SettingSlice } from '../types';
import { Hero } from '../../types';

export const createSettingSlice: StateCreator<GameStore, [], [], SettingSlice> = (set) => ({

  updateBattleSettings: (s) => set((state) => ({ 
    gameState: { ...state.gameState, battleSettings: { ...state.gameState.battleSettings, ...s } } 
  })),

  updateFieldSettings: (s) => set((state) => ({ 
    gameState: { ...state.gameState, fieldSettings: { ...state.gameState.fieldSettings, ...s } } 
  })),

  updateTierConfig: (c) => set((state) => ({ 
    gameState: { ...state.gameState, tierConfig: c } 
  })),

  updateAIConfig: (c) => set((state) => {
    const newConfig = { ...state.gameState.aiConfig, ...c };
    localStorage.setItem('GW_AI_CONFIG', JSON.stringify(newConfig));
    return { gameState: { ...state.gameState, aiConfig: newConfig } };
  }),

  updateRoleSettings: (s) => set((state) => ({ 
    gameState: { ...state.gameState, roleSettings: { ...state.gameState.roleSettings, ...s } } 
  })),

  setCustomImage: (id, imageData) => set((state) => ({
    gameState: { ...state.gameState, customImages: { ...state.gameState.customImages, [id]: imageData } }
  })),

  removeCustomImage: (id) => set((state) => {
    const newImages = { ...state.gameState.customImages };
    delete newImages[id];
    return { gameState: { ...state.gameState, customImages: newImages } };
  }),

  loadModData: (modData: any) => set((state) => {
    const currentHeroesMap = new Map(state.heroes.map(h => [h.id, h]));
    const newHeroes: Hero[] = modData.heroes.map((modHero: Hero) => {
      const existingHero = currentHeroesMap.get(modHero.id);
      if (existingHero) {
        return { 
          ...modHero, 
          record: existingHero.record, 
          tier: existingHero.tier, 
          rank: existingHero.rank, 
          recentWinRate: existingHero.recentWinRate, 
          avgKda: existingHero.avgKda 
        };
      } else {
        return modHero;
      }
    });
    const newGameState = {
      ...state.gameState,
      battleSettings: modData.settings?.battle || state.gameState.battleSettings,
      fieldSettings: modData.settings?.field || state.gameState.fieldSettings,
      roleSettings: modData.settings?.role || state.gameState.roleSettings,
      customImages: { ...state.gameState.customImages, ...(modData.images || {}) }
    };
    return { heroes: newHeroes, shopItems: modData.items || state.shopItems, gameState: newGameState };
  }),
});