// ==========================================
// FILE PATH: /src/data/items.ts
// ==========================================
import { Item } from '../types';

export const INITIAL_ITEMS: Item[] = [
  // =================================================================
  // 1. BOOTS (신발) - 이동속도 필수템 (5개)
  // =================================================================
  { id: 'i_boots_1', name: '낡은 여행화', cost: 300, ad: 0, ap: 0, hp: 0, mp: 0, armor: 0, crit: 0, speed: 25, regen: 0, mpRegen: 0, pen: 0, type: 'BOOTS', description: '가볍고 질긴 가죽으로 만든 신발입니다.' },
  { id: 'i_boots_2', name: '돌풍의 부츠', cost: 1100, ad: 10, ap: 0, hp: 0, mp: 0, armor: 0, crit: 0, speed: 45, regen: 0, mpRegen: 0, pen: 0, type: 'BOOTS', description: '바람을 가르는 듯한 가벼움을 선사합니다.' },
  { id: 'i_boots_3', name: '비전의 구두', cost: 1100, ad: 0, ap: 0, hp: 0, mp: 0, armor: 0, crit: 0, speed: 45, regen: 0, mpRegen: 0, pen: 15, type: 'BOOTS', description: '마법의 흐름을 원활하게 해줍니다.' },
  { id: 'i_boots_4', name: '강철 덧신', cost: 1200, ad: 0, ap: 0, hp: 0, mp: 0, armor: 25, crit: 0, speed: 45, regen: 0, mpRegen: 0, pen: 0, type: 'BOOTS', description: '단단한 강철로 보강된 전투화입니다.' },
  { id: 'i_boots_5', name: '그림자 발걸음', cost: 900, ad: 0, ap: 0, hp: 0, mp: 0, armor: 0, crit: 0, speed: 65, regen: 0, mpRegen: 0, pen: 0, type: 'BOOTS', description: '발소리를 죽이고 빠르게 이동합니다.' },

  // =================================================================
  // 2. WEAPON (무기) - 물리 공격력, 치명타, 관통 (10개)
  // =================================================================
  { id: 'i_wep_1', name: '용병의 검', cost: 350, ad: 10, ap: 0, hp: 0, mp: 0, armor: 0, crit: 0, speed: 0, regen: 0, mpRegen: 0, pen: 0, type: 'WEAPON', description: '전장에서 흔히 볼 수 있는 철검입니다.' },
  { id: 'i_wep_2', name: '중장보병의 대검', cost: 1300, ad: 45, ap: 0, hp: 0, mp: 0, armor: 0, crit: 0, speed: 0, regen: 0, mpRegen: 0, pen: 0, type: 'WEAPON', description: '무게감이 느껴지는 파괴적인 대검입니다.' },
  { id: 'i_wep_3', name: '심판의 대검', cost: 3400, ad: 75, ap: 0, hp: 0, mp: 0, armor: 0, crit: 25, speed: 0, regen: 0, mpRegen: 0, pen: 0, type: 'WEAPON', description: '죄인을 단죄하는 치명적인 일격입니다.' },
  { id: 'i_wep_4', name: '진홍빛 약탈자', cost: 3200, ad: 55, ap: 0, hp: 300, mp: 0, armor: 0, crit: 0, speed: 0, regen: 20, mpRegen: 0, pen: 0, type: 'WEAPON', description: '적의 생명력을 흡수하는 저주받은 검입니다.' },
  { id: 'i_wep_5', name: '뼈 분쇄기', cost: 2800, ad: 40, ap: 0, hp: 0, mp: 0, armor: 0, crit: 0, speed: 0, regen: 0, mpRegen: 0, pen: 35, type: 'WEAPON', description: '두꺼운 갑옷도 종이처럼 뚫어버립니다.' },
  { id: 'i_wep_6', name: '칠흑의 도끼', cost: 3100, ad: 50, ap: 0, hp: 450, mp: 0, armor: 0, crit: 0, speed: 10, regen: 0, mpRegen: 0, pen: 15, type: 'WEAPON', description: '검은 무쇠로 주조된 묵직한 도끼입니다.' },
  { id: 'i_wep_7', name: '환영의 쌍검', cost: 2600, ad: 30, ap: 0, hp: 0, mp: 0, armor: 0, crit: 35, speed: 15, regen: 0, mpRegen: 0, pen: 0, type: 'WEAPON', description: '눈에 보이지 않을 만큼 빠른 연격을 가능하게 합니다.' },
  { id: 'i_wep_8', name: '밤의 추적자', cost: 3000, ad: 65, ap: 0, hp: 0, mp: 0, armor: 0, crit: 0, speed: 0, regen: 0, mpRegen: 0, pen: 20, type: 'WEAPON', description: '어둠 속에서 빛을 발하는 암살자의 비수입니다.' },
  { id: 'i_wep_9', name: '뇌전창', cost: 2900, ad: 55, ap: 0, hp: 0, mp: 0, armor: 0, crit: 15, speed: 10, regen: 0, mpRegen: 0, pen: 0, type: 'WEAPON', description: '찌를 때마다 전류가 흐르는 창입니다.' },
  { id: 'i_wep_10', name: '부식된 칼날', cost: 900, ad: 25, ap: 0, hp: 0, mp: 0, armor: 0, crit: 0, speed: 0, regen: 0, mpRegen: 0, pen: 10, type: 'WEAPON', description: '상처가 쉽게 아물지 않게 만듭니다.' },

  // =================================================================
  // 3. ARTIFACT (마도구) - 주문력, 마나, 마나재생 (10개)
  // =================================================================
  { id: 'i_art_1', name: '마법 입문서', cost: 435, ad: 0, ap: 25, hp: 0, mp: 0, armor: 0, crit: 0, speed: 0, regen: 0, mpRegen: 0, pen: 0, type: 'ARTIFACT', description: '마법사의 기초 소양을 담은 책입니다.' },
  { id: 'i_art_2', name: '고대 룬석', cost: 1100, ad: 0, ap: 40, hp: 0, mp: 350, armor: 0, crit: 0, speed: 0, regen: 0, mpRegen: 8, type: 'ARTIFACT', description: '오래된 마력이 깃든 돌입니다.' },
  { id: 'i_art_3', name: '대마법사의 왕관', cost: 3600, ad: 0, ap: 130, hp: 0, mp: 0, armor: 0, crit: 0, speed: 0, regen: 0, mpRegen: 0, pen: 0, type: 'ARTIFACT', description: '전설적인 대마법사가 착용했던 왕관입니다.' },
  { id: 'i_art_4', name: '심연의 수정구', cost: 2800, ad: 0, ap: 75, hp: 0, mp: 0, armor: 0, crit: 0, speed: 0, regen: 0, mpRegen: 0, pen: 45, type: 'ARTIFACT', description: '마법 저항을 무력화하는 공허의 힘이 담겨있습니다.' },
  { id: 'i_art_5', name: '천둥의 지팡이', cost: 3200, ad: 0, ap: 95, hp: 0, mp: 500, armor: 0, crit: 0, speed: 5, regen: 0, mpRegen: 0, pen: 10, type: 'ARTIFACT', description: '폭발적인 에너지를 방출합니다.' },
  { id: 'i_art_6', name: '석화의 부적', cost: 2900, ad: 0, ap: 80, hp: 0, mp: 0, armor: 50, crit: 0, speed: 0, regen: 0, mpRegen: 0, pen: 0, type: 'ARTIFACT', description: '위기 상황에서 몸을 돌처럼 단단하게 만듭니다.' },
  { id: 'i_art_7', name: '지혜의 성배', cost: 3000, ad: 0, ap: 85, hp: 250, mp: 800, armor: 0, crit: 0, speed: 0, regen: 0, mpRegen: 15, type: 'ARTIFACT', description: '마르지 않는 마나의 샘입니다.' },
  { id: 'i_art_8', name: '역병의 서', cost: 2500, ad: 0, ap: 85, hp: 300, mp: 0, armor: 0, crit: 0, speed: 0, regen: 0, mpRegen: 0, pen: 15, type: 'ARTIFACT', description: '치유할 수 없는 맹독의 기록입니다.' },
  { id: 'i_art_9', name: '에테르 칼날', cost: 3000, ad: 0, ap: 110, hp: 0, mp: 0, armor: 0, crit: 0, speed: 15, regen: 0, mpRegen: 0, pen: 0, type: 'ARTIFACT', description: '마력을 칼날 형태로 구현했습니다.' },
  { id: 'i_art_10', name: '응축된 마력석', cost: 400, ad: 0, ap: 0, hp: 0, mp: 300, armor: 0, crit: 0, speed: 0, regen: 0, mpRegen: 5, type: 'ARTIFACT', description: '순수한 마나 결정체입니다.' },

  // =================================================================
  // 4. ARMOR (방어구) - 체력, 방어력, 체력재생 (10개)
  // =================================================================
  { id: 'i_armor_1', name: '수습 기사의 갑옷', cost: 300, ad: 0, ap: 0, hp: 0, mp: 0, armor: 18, crit: 0, speed: 0, regen: 0, mpRegen: 0, pen: 0, type: 'ARMOR', description: '가장 기초적인 철제 방어구입니다.' },
  { id: 'i_armor_2', name: '생명의 보석', cost: 400, ad: 0, ap: 0, hp: 180, mp: 0, armor: 0, crit: 0, speed: 0, regen: 2, mpRegen: 0, pen: 0, type: 'ARMOR', description: '은은한 생명력을 내뿜는 보석입니다.' },
  { id: 'i_armor_3', name: '화염의 판금', cost: 2800, ad: 0, ap: 0, hp: 550, mp: 0, armor: 55, crit: 0, speed: 0, regen: 10, mpRegen: 0, pen: 0, type: 'ARMOR', description: '주변의 적을 태우는 열기를 발산합니다.' },
  { id: 'i_armor_4', name: '칼날 껍질', cost: 2700, ad: 0, ap: 0, hp: 400, mp: 0, armor: 75, crit: 0, speed: 0, regen: 0, mpRegen: 0, pen: 0, type: 'ARMOR', description: '공격하는 적에게 상처를 입히는 갑옷입니다.' },
  { id: 'i_armor_5', name: '불사의 심장', cost: 3000, ad: 0, ap: 0, hp: 900, mp: 0, armor: 0, crit: 0, speed: 0, regen: 40, mpRegen: 0, pen: 0, type: 'ARMOR', description: '경이로운 회복력을 부여합니다.' },
  { id: 'i_armor_6', name: '생명의 나무 껍질', cost: 2900, ad: 0, ap: 0, hp: 500, mp: 0, armor: 45, crit: 0, speed: 0, regen: 20, mpRegen: 0, pen: 0, type: 'ARMOR', description: '모든 치유 효과를 증폭시킵니다.' },
  { id: 'i_armor_7', name: '요새의 방벽', cost: 2900, ad: 0, ap: 0, hp: 450, mp: 0, armor: 70, crit: 0, speed: -5, regen: 0, mpRegen: 0, pen: 0, type: 'ARMOR', description: '치명타 피해를 막아내는 견고한 방패입니다.' },
  { id: 'i_armor_8', name: '돌격대장의 갑옷', cost: 2800, ad: 0, ap: 0, hp: 350, mp: 0, armor: 50, crit: 0, speed: 25, regen: 0, mpRegen: 0, pen: 0, type: 'ARMOR', description: '전장으로 빠르게 돌진할 수 있습니다.' },
  { id: 'i_armor_9', name: '석상의 심장', cost: 3200, ad: 0, ap: 0, hp: 0, mp: 0, armor: 90, crit: 0, speed: 0, regen: 10, mpRegen: 0, pen: 0, type: 'ARMOR', description: '적진 한가운데서도 버틸 수 있는 단단함입니다.' },
  { id: 'i_armor_10', name: '수호자의 펜던트', cost: 1500, ad: 0, ap: 0, hp: 0, mp: 0, armor: 35, crit: 0, speed: 0, regen: 10, mpRegen: 0, pen: 0, type: 'ARMOR', description: '아군에게 보호의 기운을 나눕니다.' },

  // =================================================================
  // 5. ACCESSORY (장신구) - 하이브리드, 보조 스탯 (5개)
  // =================================================================
  { id: 'i_acc_1', name: '학자의 반지', cost: 400, ad: 0, ap: 18, hp: 70, mp: 50, armor: 0, crit: 0, speed: 0, regen: 0, mpRegen: 4, pen: 0, type: 'ACCESSORY', description: '마법 입문자에게 적합한 반지입니다.' },
  { id: 'i_acc_2', name: '전사의 목걸이', cost: 450, ad: 10, ap: 0, hp: 90, mp: 0, armor: 0, crit: 0, speed: 0, regen: 3, mpRegen: 0, pen: 0, type: 'ACCESSORY', description: '전투의 기본이 되는 검입니다.' },
  { id: 'i_acc_3', name: '나무 방패', cost: 450, ad: 0, ap: 0, hp: 100, mp: 0, armor: 0, crit: 0, speed: 0, regen: 8, mpRegen: 0, pen: 0, type: 'ACCESSORY', description: '초반 생존력을 높여줍니다.' },
  { id: 'i_acc_4', name: '부서진 모래시계', cost: 750, ad: 0, ap: 0, hp: 0, mp: 0, armor: 0, crit: 0, speed: 0, regen: 0, mpRegen: 0, pen: 0, type: 'ACCESSORY', description: '시간을 멈추는 마법이 깃들어 있습니다.' },
  { id: 'i_acc_5', name: '빛나는 파편', cost: 700, ad: 0, ap: 0, hp: 0, mp: 300, armor: 0, crit: 0, speed: 0, regen: 0, mpRegen: 0, pen: 0, type: 'ACCESSORY', description: '스킬 사용 후 평타를 강화합니다.' },

  // =================================================================
  // 6. POWER (권능) - 신의 축복이 깃든 궁극 아이템 (총 6개)
  // =================================================================

  // [이즈마한의 권능 - 파괴/피/속도]
  { 
    id: 'p_izman_low', name: '이즈마한의 불씨', cost: 1500, 
    ad: 40, ap: 0, hp: 0, mp: 0, armor: 0, crit: 10, speed: 5, regen: 0, mpRegen: 0, pen: 5, 
    type: 'POWER', description: '[이즈마한] 파괴신의 힘이 미약하게 깃든 불씨입니다.' 
  },
  { 
    id: 'p_izman_mid', name: '이즈마한의 핏빛 낫', cost: 3200, 
    ad: 80, ap: 0, hp: 300, mp: 0, armor: 0, crit: 20, speed: 10, regen: 20, mpRegen: 0, pen: 15, 
    type: 'POWER', description: '[이즈마한] 적의 피를 갈구하는 저주받은 낫입니다.' 
  },
  { 
    id: 'p_izman_high', name: '이즈마한의 멸망', cost: 5500, 
    ad: 150, ap: 0, hp: 500, mp: 0, armor: 0, crit: 50, speed: 20, regen: 40, mpRegen: 0, pen: 40, 
    type: 'POWER', description: '[이즈마한] 세상의 종말을 불러오는 파괴신의 진정한 힘입니다.' 
  },

  // [단테의 권능 - 냉기/지혜/불멸]
  { 
    id: 'p_dante_low', name: '단테의 냉기 파편', cost: 1500, 
    ad: 0, ap: 50, hp: 100, mp: 200, armor: 0, crit: 0, speed: 0, regen: 0, mpRegen: 5, pen: 0, 
    type: 'POWER', description: '[단테] 수호신의 냉기가 서려있는 파편입니다.' 
  },
  { 
    id: 'p_dante_mid', name: '단테의 서리 갑주', cost: 3200, 
    ad: 0, ap: 80, hp: 600, mp: 400, armor: 60, crit: 0, speed: 0, regen: 10, mpRegen: 10, pen: 0, 
    type: 'POWER', description: '[단테] 어떤 공격도 막아내는 절대적인 방어구입니다.' 
  },
  { 
    id: 'p_dante_high', name: '단테의 절대 영도', cost: 5500, 
    ad: 0, ap: 200, hp: 1000, mp: 1000, armor: 100, crit: 0, speed: 0, regen: 30, mpRegen: 30, pen: 20, 
    type: 'POWER', description: '[단테] 모든 것을 얼어붙게 만드는 수호신의 진정한 권능입니다.' 
  }
];