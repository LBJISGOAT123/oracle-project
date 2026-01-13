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
    // (기존 로직 유지)
    return { ...state }; 
  }),

  // [신규] 좌표 업데이트 로직 (매우 중요: 중첩 객체 업데이트)
  updateObjectPosition: (key: string, x: number, y: number) => set((state) => {
    const positions = { ...state.gameState.fieldSettings.positions };
    
    // key 예시: "colossus", "jungle.0", "towers.blue.top.0"
    const parts = key.split('.');
    
    if (parts.length === 1) {
        (positions as any)[parts[0]] = { x, y };
    } else if (parts[0] === 'jungle') {
        const idx = parseInt(parts[1]);
        if (positions.jungle[idx]) positions.jungle[idx] = { x, y };
    } else if (parts[0] === 'towers') {
        // towers.blue.top.0
        const side = parts[1] as 'blue'|'red';
        const lane = parts[2]; // top, mid, bot, nexus
        
        if (lane === 'nexus') {
            positions.towers[side].nexus = { x, y };
        } else {
            const idx = parseInt(parts[3]);
            // @ts-ignore
            if (positions.towers[side][lane][idx]) {
                // @ts-ignore
                positions.towers[side][lane][idx] = { x, y };
            }
        }
    }

    return { 
        gameState: { 
            ...state.gameState, 
            fieldSettings: { 
                ...state.gameState.fieldSettings, 
                positions 
            } 
        } 
    };
  }),
});
