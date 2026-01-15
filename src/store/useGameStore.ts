// ==========================================
// FILE PATH: /src/store/useGameStore.ts
// ==========================================
import { create } from 'zustand';
import { GameStore } from './types';

import { createHeroSlice } from './slices/heroSlice';
import { createCommunitySlice } from './slices/communitySlice';
import { createGameSlice } from './slices/gameSlice';
import { createItemSlice } from './slices/itemSlice';
import { createSettingSlice } from './slices/settingSlice';
import { createUISlice } from './slices/uiSlice'; // [추가]

export const useGameStore = create<GameStore>()((...a) => ({
  ...createHeroSlice(...a),
  ...createCommunitySlice(...a),
  ...createGameSlice(...a),
  ...createItemSlice(...a),
  ...createSettingSlice(...a),
  ...createUISlice(...a), // [추가]
}));
