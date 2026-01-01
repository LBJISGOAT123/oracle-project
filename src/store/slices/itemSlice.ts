// ==========================================
// FILE PATH: /src/store/slices/itemSlice.ts
// ==========================================

import { StateCreator } from 'zustand';
import { GameStore, ItemSlice, Item } from '../types';
import { INITIAL_ITEMS } from '../../data/items';

export const createItemSlice: StateCreator<GameStore, [], [], ItemSlice> = (set) => ({
  shopItems: INITIAL_ITEMS,

  addItem: (item: Item) => set((state) => ({ shopItems: [...state.shopItems, item] })),
  
  deleteItem: (id: string) => set((state) => ({ shopItems: state.shopItems.filter(i => i.id !== id) })),
  
  updateItem: (id: string, updates: Partial<Item>) => set((state) => ({
    shopItems: state.shopItems.map(i => i.id === id ? { ...i, ...updates } : i)
  })),
});
