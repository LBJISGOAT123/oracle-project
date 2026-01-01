import { StateCreator } from 'zustand';
import { GameStore, HeroSlice } from '../types';
import { INITIAL_HEROES } from '../../data/heroes';
import { Hero } from '../../types';

export const createHeroSlice: StateCreator<GameStore, [], [], HeroSlice> = (set) => ({
  heroes: INITIAL_HEROES,

  addHero: (hero: Hero) => set((state) => ({ 
    heroes: [hero, ...state.heroes] 
  })),

  deleteHero: (heroId: string) => set((state) => ({
    heroes: state.heroes.filter((h) => h.id !== heroId)
  })),

  updateHero: (id: string, updates: Partial<Hero>) => set((state) => ({ 
    heroes: state.heroes.map((h) => h.id === id ? { ...h, ...updates } : h) 
  })),

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
