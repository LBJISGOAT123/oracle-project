// ==========================================
// FILE PATH: /src/store/slices/uiSlice.ts
// ==========================================
import { StateCreator } from 'zustand';
import { GameStore, UISlice } from '../types';

export const createUISlice: StateCreator<GameStore, [], [], UISlice> = (set) => ({
  announcement: null,
  setAnnouncement: (ann) => set({ announcement: ann }),
});
