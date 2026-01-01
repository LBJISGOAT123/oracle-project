import { StateCreator } from 'zustand';
import { GameStore, ItemSlice } from '../types';
import { INITIAL_ITEMS } from '../../data/items';
import { Item } from '../../types';

export const createItemSlice: StateCreator<GameStore, [], [], ItemSlice> = (set) => ({
  shopItems: INITIAL_ITEMS,

  addItem: (item: Item) => set((state) => ({ shopItems: [...state.shopItems, item] })),
  
  deleteItem: (id: string) => set((state) => ({ shopItems: state.shopItems.filter((i) => i.id !== id) })),
  
  updateItem: (id: string, updates: Partial<Item>) => set((state) => ({
    shopItems: state.shopItems.map((i) => i.id === id ? { ...i, ...updates } : i)
  })),
});
