// ==========================================
// FILE PATH: /src/data/items.ts
// ==========================================

import { Item } from '../types';

export const INITIAL_ITEMS: Item[] = [
  // [초반 - Starter]
  { id: 'i_sword', name: '집행관의 단검', cost: 350, ad: 10, ap: 0, hp: 0, armor: 0, crit: 0, speed: 0, type: 'WEAPON' },
  { id: 'i_ring', name: '선지자의 반지', cost: 400, ad: 0, ap: 15, hp: 60, armor: 0, crit: 0, speed: 0, type: 'ACCESSORY' },
  { id: 'i_shield', name: '수호자의 방패', cost: 450, ad: 0, ap: 0, hp: 80, armor: 5, crit: 0, speed: 0, type: 'ARMOR' },

  // [중반 - Intermediate]
  { id: 'i_bf', name: '투신의 대검', cost: 1300, ad: 40, ap: 0, hp: 0, armor: 0, crit: 0, speed: 0, type: 'WEAPON' },
  { id: 'i_rod', name: '공허의 수정', cost: 1250, ad: 0, ap: 60, hp: 0, armor: 0, crit: 0, speed: 0, type: 'WEAPON' },
  { id: 'i_vest', name: '흑요석 판금', cost: 800, ad: 0, ap: 0, hp: 0, armor: 35, crit: 0, speed: 0, type: 'ARMOR' },

  // [코어 - Legendary]
  { id: 'i_ie', name: '심판의 검: 라그나로크', cost: 3400, ad: 70, ap: 0, hp: 0, armor: 0, crit: 20, speed: 0, type: 'WEAPON' },
  { id: 'i_rabadon', name: '초월자의 왕관', cost: 3600, ad: 0, ap: 120, hp: 0, armor: 0, crit: 0, speed: 0, type: 'WEAPON' },
  { id: 'i_warmog', name: '거신병의 심장', cost: 3000, ad: 0, ap: 0, hp: 800, armor: 0, crit: 0, speed: 0, type: 'ARMOR' },
  { id: 'i_boots', name: '차원 도약 장화', cost: 1100, ad: 0, ap: 0, hp: 0, armor: 25, crit: 0, speed: 45, type: 'ACCESSORY' },

  // [권능 (Gods' Authority) - Special]
  { 
    id: 'p_izman', 
    name: '이즈마한의 권능: 멸망의 불꽃', 
    cost: 5000, 
    ad: 150, ap: 0, hp: 400, armor: 0, crit: 40, speed: 30, 
    type: 'POWER', 
    description: '붉은 신 이즈마한의 축복. 물리 공격력과 치명타를 극한으로 강화합니다.' 
  },
  { 
    id: 'p_dante', 
    name: '단테의 권능: 절대 영도', 
    cost: 5000, 
    ad: 0, ap: 180, hp: 800, armor: 80, crit: 0, speed: 10, 
    type: 'POWER', 
    description: '푸른 신 단테의 축복. 주문력과 생존력을 극한으로 강화합니다.' 
  }
];