// ==========================================
// FILE PATH: /src/store/useGameStore.ts
// ==========================================

import { create } from 'zustand';
import { GameStore } from './types';

// 슬라이스들 불러오기
import { createHeroSlice } from './slices/heroSlice';
import { createCommunitySlice } from './slices/communitySlice';
import { createGameSlice } from './slices/gameSlice';
import { createItemSlice } from './slices/itemSlice';
import { createSettingSlice } from './slices/settingSlice'; // [추가됨]

export const useGameStore = create<GameStore>()((...a) => ({
  ...createHeroSlice(...a),
  ...createCommunitySlice(...a),
  ...createGameSlice(...a),
  ...createItemSlice(...a),
  ...createSettingSlice(...a), // [추가됨]
}));