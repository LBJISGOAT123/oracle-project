// ==========================================
// FILE PATH: /src/store/useGameStore.ts
// ==========================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { GameStore } from './types';

// 슬라이스들 불러오기
import { createHeroSlice } from './slices/heroSlice';
import { createCommunitySlice } from './slices/communitySlice';
import { createGameSlice } from './slices/gameSlice';
import { createItemSlice } from './slices/itemSlice'; // [신규]

export const useGameStore = create<GameStore>()(
  persist(
    (...a) => ({
      ...createHeroSlice(...a),
      ...createCommunitySlice(...a),
      ...createGameSlice(...a),
      ...createItemSlice(...a), // [신규]
    }),
    { 
      name: 'gods-war-storage-v17' 
    } 
  )
);