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

// [수정됨] persist 미들웨어 제거
// 실시간 시뮬레이션 게임에서는 persist가 성능 저하 및 저장 용량 초과의 주원인이 됩니다.
export const useGameStore = create<GameStore>()((...a) => ({
  ...createHeroSlice(...a),
  ...createCommunitySlice(...a),
  ...createGameSlice(...a),
  ...createItemSlice(...a),
}));