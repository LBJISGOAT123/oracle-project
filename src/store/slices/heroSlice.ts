// ==========================================
// FILE PATH: /src/store/slices/heroSlice.ts
// ==========================================
import { StateCreator } from 'zustand';
import { GameStore, HeroSlice } from '../types';
import { INITIAL_HEROES } from '../../data/heroes';
import { Hero } from '../../types';
import { updateLivePlayerStats } from '../../engine/match/systems/ItemManager';

export const createHeroSlice: StateCreator<GameStore, [], [], HeroSlice> = (set, get) => ({
  heroes: INITIAL_HEROES,

  addHero: (hero: Hero) => set((state) => ({ 
    heroes: [hero, ...state.heroes] 
  })),

  deleteHero: (heroId: string) => set((state) => ({
    heroes: state.heroes.filter((h) => h.id !== heroId)
  })),

  // [핵심 수정] 영웅 정보 업데이트 시 실시간 게임에도 반영
  updateHero: (id: string, updates: Partial<Hero>) => set((state) => {
    // 1. 글로벌 데이터 업데이트
    const newHeroes = state.heroes.map((h) => h.id === id ? { ...h, ...updates } : h);
    
    // 업데이트된 영웅 객체 확보
    const updatedHero = newHeroes.find(h => h.id === id);

    // 2. 진행 중인 매치(LiveMatches) 강제 동기화
    if (updatedHero) {
        state.gameState.liveMatches.forEach(match => {
            const allPlayers = [...match.blueTeam, ...match.redTeam];
            
            allPlayers.forEach(player => {
                // 해당 영웅을 사용하는 플레이어 찾기
                if (player.heroId === id) {
                    // 스탯 재계산 (레벨 비례 스탯 + 아이템 스탯 다시 합산)
                    updateLivePlayerStats(player, updatedHero);
                }
            });
        });
    }

    return { 
        heroes: newHeroes,
        // liveMatches는 내부 객체(player)를 직접 수정했으므로, 
        // 상태 갱신을 트리거하기 위해 gameState를 얕은 복사로 갱신
        gameState: { ...state.gameState }
    };
  }),

  resetHeroStats: () => set((state) => {
    const resetHeroes = state.heroes.map((hero) => ({
      ...hero,
      record: { 
        totalMatches: 0, totalWins: 0, totalPicks: 0, totalBans: 0, 
        totalKills: 0, totalDeaths: 0, totalAssists: 0, 
        totalDamage: 0, totalDamageTaken: 0, totalCs: 0, totalGold: 0, 
        recentResults: [] 
      },
      tier: '3' as const, rank: 0, rankChange: 0, 
      recentWinRate: 0, pickRate: 0, banRate: 0, 
      avgKda: '0.0/0.0/0.0', kdaRatio: '0.00', 
      avgDpm: '0', avgDpg: '0', avgCs: '0', avgGold: '0'
    }));
    return { heroes: resetHeroes };
  }),
});
