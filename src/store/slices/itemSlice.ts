import { StateCreator } from 'zustand';
import { GameStore, ItemSlice } from '../types';
import { INITIAL_ITEMS } from '../../data/items';
import { Item } from '../../types';

export interface ItemSlice {
  shopItems: Item[];
  addItem: (item: Item) => void;
  deleteItem: (id: string) => void;
  updateItem: (id: string, updates: Partial<Item>) => void;
}

export const createItemSlice: StateCreator<GameStore, [], [], ItemSlice> = (set) => ({
  shopItems: INITIAL_ITEMS,

  addItem: (item) => set((state) => ({ shopItems: [...state.shopItems, item] })),
  deleteItem: (id) => set((state) => ({ shopItems: state.shopItems.filter(i => i.id !== id) })),
  updateItem: (id, updates) => set((state) => ({
    shopItems: state.shopItems.map(i => i.id === id ? { ...i, ...updates } : i)
  })),
});