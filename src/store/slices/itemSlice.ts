// ==========================================
// FILE PATH: /src/store/slices/itemSlice.ts
// ==========================================
import { StateCreator } from 'zustand';
import { GameStore, ItemSlice } from '../types';
import { INITIAL_ITEMS } from '../../data/items';
import { Item } from '../../types';
import { updateLivePlayerStats } from '../../engine/match/systems/ItemManager';

export const createItemSlice: StateCreator<GameStore, [], [], ItemSlice> = (set, get) => ({
  shopItems: INITIAL_ITEMS,

  addItem: (item: Item) => set((state) => ({ shopItems: [...state.shopItems, item] })),
  
  deleteItem: (id: string) => set((state) => ({ shopItems: state.shopItems.filter((i) => i.id !== id) })),
  
  // [핵심 수정] 아이템 업데이트 시 보유 중인 플레이어 스탯 즉시 갱신
  updateItem: (id: string, updates: Partial<Item>) => set((state) => {
    // 1. 상점 데이터 업데이트
    const newShopItems = state.shopItems.map((i) => i.id === id ? { ...i, ...updates } : i);
    
    // 2. 실시간 매치 반영
    state.gameState.liveMatches.forEach(match => {
        const allPlayers = [...match.blueTeam, ...match.redTeam];

        allPlayers.forEach(player => {
            let hasItem = false;

            // 플레이어 인벤토리에서 해당 아이템 찾아서 스탯 갱신
            player.items.forEach((item, idx) => {
                if (item.id === id) {
                    // 기존 아이템 객체에 업데이트 내용 덮어쓰기
                    player.items[idx] = { ...item, ...updates };
                    hasItem = true;
                }
            });

            // 아이템을 가지고 있었다면, 플레이어 총합 스탯 재계산
            if (hasItem) {
                const hero = state.heroes.find(h => h.id === player.heroId);
                if (hero) {
                    updateLivePlayerStats(player, hero);
                }
            }
        });
    });

    return { 
        shopItems: newShopItems,
        gameState: { ...state.gameState }
    };
  }),
});
