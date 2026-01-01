import { StateCreator } from 'zustand';
import { GameStore, CommunitySlice } from '../types';

export const createCommunitySlice: StateCreator<GameStore, [], [], CommunitySlice> = (set) => ({
  communityPosts: [],
  selectedPost: null,

  openPost: (post) => set({ selectedPost: post }),
  closePost: () => set({ selectedPost: null }),
  setCommunityPosts: (posts) => set({ communityPosts: posts }),
});