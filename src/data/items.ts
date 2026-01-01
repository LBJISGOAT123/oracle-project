// ==========================================
// FILE PATH: /src/data/items.ts
// ==========================================
import { Item } from '../types';

export const INITIAL_ITEMS: Item[] = [
  // 1. WEAPON (공격력) - 15개
  { id: 'i_excalibur', name: '엑스칼리버', cost: 3400, ad: 75, ap: 0, hp: 0, armor: 0, crit: 20, speed: 0, type: 'WEAPON' },
  { id: 'i_gungnir', name: '궁니르', cost: 3200, ad: 65, ap: 0, hp: 200, armor: 0, crit: 0, speed: 0, type: 'WEAPON' },
  { id: 'i_mjolnir', name: '묠니르', cost: 3300, ad: 70, ap: 0, hp: 0, armor: 0, crit: 0, speed: 10, type: 'WEAPON' },
  { id: 'i_durandal', name: '뒤랑달', cost: 3000, ad: 60, ap: 0, hp: 0, armor: 0, crit: 15, speed: 5, type: 'WEAPON' },
  { id: 'i_masamune', name: '마사무네', cost: 2800, ad: 55, ap: 0, hp: 0, armor: 0, crit: 25, speed: 0, type: 'WEAPON' },
  { id: 'i_muramasa', name: '무라마사', cost: 2900, ad: 80, ap: 0, hp: -100, armor: 0, crit: 0, speed: 0, type: 'WEAPON' },
  { id: 'i_laevateinn', name: '레바테인', cost: 3500, ad: 70, ap: 40, hp: 0, armor: 0, crit: 0, speed: 0, type: 'WEAPON' },
  { id: 'i_gram', name: '그람', cost: 3100, ad: 65, ap: 0, hp: 150, armor: 0, crit: 10, speed: 0, type: 'WEAPON' },
  { id: 'i_harpe', name: '하르페', cost: 2700, ad: 50, ap: 0, hp: 0, armor: 0, crit: 30, speed: 0, type: 'WEAPON' },
  { id: 'i_gae_bolg', name: '게이볼그', cost: 3000, ad: 60, ap: 0, hp: 0, armor: 0, crit: 0, speed: 0, type: 'WEAPON' }, // 관통 특화
  { id: 'i_trident', name: '트라이던트', cost: 3150, ad: 55, ap: 0, hp: 0, armor: 0, crit: 0, speed: 15, type: 'WEAPON' },
  { id: 'i_longinus', name: '롱기누스의 창', cost: 3600, ad: 80, ap: 0, hp: 300, armor: 0, crit: 0, speed: 0, type: 'WEAPON' },
  { id: 'i_fragarach', name: '프라가라흐', cost: 2950, ad: 62, ap: 0, hp: 0, armor: 0, crit: 20, speed: 0, type: 'WEAPON' },
  { id: 'i_joyeuse', name: '주와이외즈', cost: 2850, ad: 58, ap: 0, hp: 0, armor: 0, crit: 0, speed: 10, type: 'WEAPON' },
  { id: 'i_clarent', name: '클라렌트', cost: 2600, ad: 50, ap: 0, hp: 250, armor: 0, crit: 0, speed: 0, type: 'WEAPON' },

  // 2. ARMOR (방어구) - 12개
  { id: 'i_aegis', name: '이지스', cost: 2800, ad: 0, ap: 0, hp: 400, armor: 60, crit: 0, speed: 0, type: 'ARMOR' },
  { id: 'i_ancile', name: '안킬레', cost: 2600, ad: 0, ap: 0, hp: 350, armor: 50, crit: 0, speed: 0, type: 'ARMOR' },
  { id: 'i_golden_fleece', name: '황금 양털', cost: 3000, ad: 0, ap: 0, hp: 600, armor: 30, crit: 0, speed: 0, type: 'ARMOR' },
  { id: 'i_mithril_vest', name: '미스릴 조끼', cost: 2400, ad: 0, ap: 0, hp: 200, armor: 70, crit: 0, speed: 0, type: 'ARMOR' },
  { id: 'i_dragon_scale', name: '용비늘 갑옷', cost: 3200, ad: 20, ap: 0, hp: 500, armor: 55, crit: 0, speed: 0, type: 'ARMOR' },
  { id: 'i_adamant', name: '아다만트 갑옷', cost: 3500, ad: 0, ap: 0, hp: 800, armor: 80, crit: 0, speed: -5, type: 'ARMOR' },
  { id: 'i_shroud', name: '투린의 수의', cost: 2700, ad: 0, ap: 30, hp: 300, armor: 40, crit: 0, speed: 0, type: 'ARMOR' },
  { id: 'i_gladiator_plate', name: '검투사의 판금', cost: 2500, ad: 15, ap: 0, hp: 250, armor: 45, crit: 0, speed: 0, type: 'ARMOR' },
  { id: 'i_sun_armor', name: '태양의 갑옷', cost: 2900, ad: 0, ap: 0, hp: 450, armor: 50, crit: 0, speed: 0, type: 'ARMOR' }, // 주변 데미지
  { id: 'i_thorn_mail', name: '가시 갑옷', cost: 2700, ad: 0, ap: 0, hp: 350, armor: 65, crit: 0, speed: 0, type: 'ARMOR' },
  { id: 'i_spirit_visage', name: '정령의 형상', cost: 2800, ad: 0, ap: 0, hp: 450, armor: 40, crit: 0, speed: 0, type: 'ARMOR' }, // 마방 컨셉
  { id: 'i_warmog', name: '거인의 심장', cost: 3000, ad: 0, ap: 0, hp: 800, armor: 0, crit: 0, speed: 0, type: 'ARMOR' },

  // 3. ACCESSORY (장신구/마법/유틸) - 15개
  { id: 'i_talaria', name: '탈라리아', cost: 1100, ad: 0, ap: 0, hp: 0, armor: 0, crit: 0, speed: 60, type: 'ACCESSORY' }, // 신발
  { id: 'i_necronomicon', name: '네크로노미콘', cost: 3200, ad: 0, ap: 90, hp: 200, armor: 0, crit: 0, speed: 0, type: 'ACCESSORY' },
  { id: 'i_philosopher_stone', name: '현자의 돌', cost: 2500, ad: 0, ap: 60, hp: 300, armor: 0, crit: 0, speed: 0, type: 'ACCESSORY' },
  { id: 'i_caduceus', name: '카두케우스', cost: 2800, ad: 0, ap: 70, hp: 0, armor: 0, crit: 0, speed: 10, type: 'ACCESSORY' },
  { id: 'i_orb_discord', name: '불화의 구슬', cost: 2600, ad: 0, ap: 80, hp: 0, armor: 0, crit: 0, speed: 0, type: 'ACCESSORY' },
  { id: 'i_book_thoth', name: '토트의 서', cost: 3600, ad: 0, ap: 140, hp: 0, armor: 0, crit: 0, speed: 0, type: 'ACCESSORY' }, // 라바돈 느낌
  { id: 'i_rod_asclepius', name: '아스클레피오스의 지팡이', cost: 2700, ad: 0, ap: 60, hp: 400, armor: 0, crit: 0, speed: 0, type: 'ACCESSORY' }, // 힐러용
  { id: 'i_draupnir', name: '드라우프니르', cost: 2900, ad: 0, ap: 75, hp: 0, armor: 0, crit: 0, speed: 0, type: 'ACCESSORY' },
  { id: 'i_brisingamen', name: '브리싱가멘', cost: 2400, ad: 0, ap: 50, hp: 200, armor: 20, crit: 0, speed: 0, type: 'ACCESSORY' },
  { id: 'i_ring_gyges', name: '기게스의 반지', cost: 3000, ad: 30, ap: 30, hp: 0, armor: 0, crit: 10, speed: 10, type: 'ACCESSORY' }, // 하이브리드
  { id: 'i_gjallarhorn', name: '걀라르호른', cost: 2500, ad: 0, ap: 0, hp: 500, armor: 0, crit: 0, speed: 5, type: 'ACCESSORY' },
  { id: 'i_gleipnir', name: '글레이프니르', cost: 2800, ad: 0, ap: 65, hp: 0, armor: 0, crit: 0, speed: 0, type: 'ACCESSORY' }, // CC 강화 느낌
  { id: 'i_pandora_box', name: '판도라의 상자', cost: 3300, ad: 0, ap: 100, hp: -100, armor: 0, crit: 0, speed: 0, type: 'ACCESSORY' },
  { id: 'i_holy_grail', name: '성배', cost: 2600, ad: 0, ap: 50, hp: 0, armor: 30, crit: 0, speed: 0, type: 'ACCESSORY' },
  { id: 'i_hermes_boots', name: '헤르메스의 신발', cost: 1200, ad: 0, ap: 0, hp: 0, armor: 20, crit: 0, speed: 50, type: 'ACCESSORY' },

  // [초반 기본템] - 6개
  { id: 'i_iron_sword', name: '철검', cost: 350, ad: 10, ap: 0, hp: 0, armor: 0, crit: 0, speed: 0, type: 'WEAPON' },
  { id: 'i_magic_wand', name: '마법봉', cost: 400, ad: 0, ap: 15, hp: 0, armor: 0, crit: 0, speed: 0, type: 'ACCESSORY' },
  { id: 'i_leather_armor', name: '가죽 갑옷', cost: 300, ad: 0, ap: 0, hp: 50, armor: 10, crit: 0, speed: 0, type: 'ARMOR' },
  { id: 'i_boots_speed', name: '속도의 장화', cost: 300, ad: 0, ap: 0, hp: 0, armor: 0, crit: 0, speed: 25, type: 'ACCESSORY' },
  { id: 'i_dagger', name: '단검', cost: 300, ad: 0, ap: 0, hp: 0, armor: 0, crit: 8, speed: 5, type: 'WEAPON' },
  { id: 'i_ruby_crystal', name: '루비 수정', cost: 400, ad: 0, ap: 0, hp: 150, armor: 0, crit: 0, speed: 0, type: 'ARMOR' },

  // === [기존 권능 유지] === 2개
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