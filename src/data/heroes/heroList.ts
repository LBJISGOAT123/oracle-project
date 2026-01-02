// ==========================================
// FILE PATH: /src/data/heroes/heroList.ts
// ==========================================
import { Role } from '../../types';

export const RAW_HERO_LIST = [
  // =================================================================
  // 1. 집행관 (EXECUTOR) - 근접 전사 (마나 적당, 밸런스형)
  // =================================================================
  { id: 'h_ragna', name: "라그나", role: "집행관" as Role, concept: "불꽃이여, 나의 분노가 되어라!", stats: { ad: 75, hp: 2200, mp: 300, mpRegen: 5, armor: 45, crit: 20, range: 175, speed: 345, regen: 15, pen: 10 } },
  { id: 'h_kensei', name: "켄세이", role: "집행관" as Role, concept: "검은 주저하지 않는다. 오직 벨 뿐.", stats: { ad: 80, hp: 1950, mp: 250, mpRegen: 6, armor: 35, crit: 25, range: 175, speed: 350, regen: 10, pen: 15 } },
  { id: 'h_baldur', name: "발두르", role: "집행관" as Role, concept: "빛이 있는 한, 나는 쓰러지지 않는다.", stats: { ad: 70, hp: 2400, mp: 350, mpRegen: 5, armor: 55, crit: 10, range: 150, speed: 335, regen: 20, pen: 5 } },
  { id: 'h_freya', name: "프레이야", role: "집행관" as Role, concept: "발키리의 날개가 전장을 덮으리라.", stats: { ad: 72, hp: 2100, mp: 320, mpRegen: 7, armor: 40, crit: 15, range: 175, speed: 340, regen: 12, pen: 12 } },
  { id: 'h_gorgon', name: "고르곤", role: "집행관" as Role, concept: "내 눈을 바라봐... 영원히.", stats: { ad: 85, hp: 2000, mp: 300, mpRegen: 5, armor: 40, crit: 15, range: 150, speed: 330, regen: 18, pen: 20 } },
  { id: 'h_arthur', name: "아서", role: "집행관" as Role, concept: "왕의 이름으로, 승리를 쟁취하겠다.", stats: { ad: 68, hp: 2300, mp: 340, mpRegen: 6, armor: 50, crit: 10, range: 150, speed: 340, regen: 14, pen: 8 } },
  { id: 'h_leonidas', name: "레오니다스", role: "집행관" as Role, concept: "우리는 물러서지 않는다! 이것이 스파르타다!", stats: { ad: 78, hp: 2350, mp: 280, mpRegen: 5, armor: 50, crit: 15, range: 175, speed: 340, regen: 16, pen: 10 } },
  { id: 'h_musashi', name: "무사시", role: "집행관" as Role, concept: "이도류의 끝을 보여주지.", stats: { ad: 82, hp: 2050, mp: 200, mpRegen: 8, armor: 38, crit: 30, range: 150, speed: 355, regen: 12, pen: 20 } },
  { id: 'h_lancelot', name: "란슬롯", role: "집행관" as Role, concept: "나의 검은 명예를 위해 존재한다.", stats: { ad: 74, hp: 2250, mp: 310, mpRegen: 6, armor: 48, crit: 20, range: 175, speed: 345, regen: 14, pen: 15 } },
  { id: 'h_siegfried', name: "지크프리트", role: "집행관" as Role, concept: "용의 피가 나를 불사로 만든다.", stats: { ad: 88, hp: 2500, mp: 300, mpRegen: 5, armor: 60, crit: 10, range: 150, speed: 330, regen: 25, pen: 5 } },

  // =================================================================
  // 2. 선지자 (PROPHET) - 원거리 마법사 (마나통 큼, 마나소모 심함)
  // =================================================================
  { id: 'h_merlin', name: "멀린", role: "선지자" as Role, concept: "마법의 근원은 지혜, 그리고 약간의 광기지.", stats: { ad: 40, ap: 85, hp: 1600, mp: 600, mpRegen: 12, armor: 25, crit: 0, range: 550, speed: 330, regen: 7, pen: 30 } },
  { id: 'h_crowley', name: "크로울리", role: "선지자" as Role, concept: "금지된 지식에는 대가가 따르는 법.", stats: { ad: 45, ap: 90, hp: 1550, mp: 550, mpRegen: 10, armor: 20, crit: 0, range: 525, speed: 335, regen: 6, pen: 35 } },
  { id: 'h_elara', name: "엘라라", role: "선지자" as Role, concept: "별들이 당신의 운명을 속삭이네요.", stats: { ad: 38, ap: 80, hp: 1650, mp: 650, mpRegen: 15, armor: 30, crit: 0, range: 575, speed: 325, regen: 8, pen: 25 } },
  { id: 'h_nix', name: "닉스", role: "선지자" as Role, concept: "어둠이 내리면, 아무도 숨을 수 없어.", stats: { ad: 42, ap: 95, hp: 1500, mp: 580, mpRegen: 11, armor: 22, crit: 0, range: 600, speed: 340, regen: 5, pen: 40 } },
  { id: 'h_sol', name: "솔", role: "선지자" as Role, concept: "태양 만세! 모든 것을 태워 정화하리라!", stats: { ad: 35, ap: 88, hp: 1700, mp: 620, mpRegen: 13, armor: 28, crit: 0, range: 550, speed: 330, regen: 9, pen: 28 } },
  { id: 'h_gaia', name: "가이아", role: "선지자" as Role, concept: "대지는 기억한다. 너의 죄를.", stats: { ad: 40, ap: 82, hp: 1800, mp: 700, mpRegen: 14, armor: 35, crit: 0, range: 500, speed: 320, regen: 10, pen: 20 } },
  { id: 'h_nostra', name: "노스트라", role: "선지자" as Role, concept: "이미 너의 패배는 예견되어 있다.", stats: { ad: 35, ap: 92, hp: 1550, mp: 500, mpRegen: 10, armor: 20, crit: 0, range: 580, speed: 325, regen: 6, pen: 35 } },
  { id: 'h_rasputin', name: "라스푸틴", role: "선지자" as Role, concept: "죽음? 나는 수없이 겪어보았다.", stats: { ad: 45, ap: 88, hp: 1750, mp: 560, mpRegen: 12, armor: 30, crit: 0, range: 525, speed: 330, regen: 15, pen: 25 } },
  { id: 'h_circe', name: "키르케", role: "선지자" as Role, concept: "귀여운 돼지로 만들어줄까?", stats: { ad: 40, ap: 96, hp: 1480, mp: 540, mpRegen: 11, armor: 18, crit: 0, range: 600, speed: 335, regen: 5, pen: 40 } },
  { id: 'h_morgana', name: "모르가나", role: "선지자" as Role, concept: "고통을 즐겨라, 피할 수 없다면.", stats: { ad: 42, ap: 85, hp: 1620, mp: 600, mpRegen: 12, armor: 25, crit: 0, range: 550, speed: 340, regen: 8, pen: 30 } },

  // =================================================================
  // 3. 추적자 (TRACKER) - 근접 암살자 (마나 적음, 기력 느낌)
  // =================================================================
  { id: 'h_kage', name: "카게", role: "추적자" as Role, concept: "그림자가 짙어지면, 내가 거기 있다.", stats: { ad: 88, hp: 1650, mp: 200, mpRegen: 10, armor: 30, crit: 35, range: 125, speed: 360, regen: 8, pen: 40 } },
  { id: 'h_fenrir', name: "펜리르", role: "추적자" as Role, concept: "사냥감이... 겁에 질렸군.", stats: { ad: 82, hp: 1800, mp: 250, mpRegen: 8, armor: 35, crit: 25, range: 125, speed: 355, regen: 12, pen: 30 } },
  { id: 'h_viper', name: "바이퍼", role: "추적자" as Role, concept: "독이 퍼지는 건 순식간이지.", stats: { ad: 78, hp: 1700, mp: 280, mpRegen: 7, armor: 28, crit: 20, range: 150, speed: 350, regen: 9, pen: 35 } },
  { id: 'h_specter', name: "스펙터", role: "추적자" as Role, concept: "벽을 넘는 자, 목숨을 걷는 자.", stats: { ad: 90, hp: 1550, mp: 220, mpRegen: 9, armor: 25, crit: 40, range: 125, speed: 355, regen: 7, pen: 45 } },
  { id: 'h_locust', name: "로커스트", role: "추적자" as Role, concept: "우리는 군단이다. 남김없이 먹어치워라.", stats: { ad: 75, hp: 1750, mp: 300, mpRegen: 6, armor: 32, crit: 30, range: 150, speed: 365, regen: 10, pen: 25 } },
  { id: 'h_scarlet', name: "스칼렛", role: "추적자" as Role, concept: "피 냄새가... 향긋해.", stats: { ad: 85, hp: 1600, mp: 0, mpRegen: 0, armor: 20, crit: 45, range: 125, speed: 350, regen: 6, pen: 50 } }, // 노코스트 컨셉
  { id: 'h_hattori', name: "핫토리", role: "추적자" as Role, concept: "임무 완료. 흔적은 남기지 않는다.", stats: { ad: 86, hp: 1600, mp: 240, mpRegen: 10, armor: 28, crit: 40, range: 125, speed: 365, regen: 7, pen: 45 } },
  { id: 'h_jack', name: "잭", role: "추적자" as Role, concept: "안개 속의 살인귀가 당신을 찾아갑니다.", stats: { ad: 92, hp: 1580, mp: 260, mpRegen: 8, armor: 25, crit: 50, range: 125, speed: 360, regen: 6, pen: 55 } },
  { id: 'h_arachne', name: "아라크네", role: "추적자" as Role, concept: "내 거미줄에 걸린 이상, 도망칠 곳은 없어.", stats: { ad: 76, hp: 1720, mp: 350, mpRegen: 6, armor: 35, crit: 25, range: 150, speed: 355, regen: 10, pen: 30 } },
  { id: 'h_goemon', name: "고에몬", role: "추적자" as Role, concept: "네 목숨과 지갑, 둘 다 가져가마!", stats: { ad: 84, hp: 1680, mp: 300, mpRegen: 8, armor: 32, crit: 30, range: 150, speed: 350, regen: 9, pen: 35 } },

  // =================================================================
  // 4. 수호기사 (GUARDIAN) - 근접 탱커 (마나 적당, 방어력 높음)
  // =================================================================
  { id: 'h_aigis', name: "아이기스", role: "수호기사" as Role, concept: "나는 뚫리지 않는 방패다.", stats: { ad: 50, hp: 3500, mp: 400, mpRegen: 5, armor: 95, crit: 0, range: 150, speed: 315, regen: 30, pen: 0 } },
  { id: 'h_golem', name: "골렘", role: "수호기사" as Role, concept: "바위... 단단하다... 부순다...", stats: { ad: 60, hp: 3300, mp: 200, mpRegen: 4, armor: 90, crit: 5, range: 150, speed: 310, regen: 25, pen: 5 } },
  { id: 'h_paladin', name: "팔라딘", role: "수호기사" as Role, concept: "신성한 빛이 우리를 보호하리라.", stats: { ad: 55, hp: 3000, mp: 500, mpRegen: 7, armor: 85, crit: 0, range: 150, speed: 325, regen: 20, pen: 0 } },
  { id: 'h_treant', name: "트리언트", role: "수호기사" as Role, concept: "숲을 해치는 자, 용서하지 않겠다.", stats: { ad: 65, hp: 3200, mp: 450, mpRegen: 6, armor: 80, crit: 5, range: 175, speed: 320, regen: 40, pen: 5 } },
  { id: 'h_magnus', name: "매그너스", role: "수호기사" as Role, concept: "진정한 힘이 무엇인지 보여주마!", stats: { ad: 58, hp: 2900, mp: 350, mpRegen: 5, armor: 88, crit: 10, range: 150, speed: 330, regen: 22, pen: 10 } },
  { id: 'h_yeti', name: "예티", role: "수호기사" as Role, concept: "추위는 뼈속까지 파고들지.", stats: { ad: 62, hp: 3400, mp: 300, mpRegen: 5, armor: 75, crit: 5, range: 150, speed: 315, regen: 28, pen: 5 } },
  { id: 'h_spartacus', name: "스파르타쿠스", role: "수호기사" as Role, concept: "자유를 위해! 결코 굴복하지 마라!", stats: { ad: 65, hp: 3100, mp: 250, mpRegen: 6, armor: 85, crit: 10, range: 150, speed: 325, regen: 25, pen: 10 } },
  { id: 'h_titan', name: "타이탄", role: "수호기사" as Role, concept: "고대의 거인이 깨어났다.", stats: { ad: 70, hp: 3600, mp: 300, mpRegen: 4, armor: 100, crit: 0, range: 150, speed: 305, regen: 40, pen: 0 } },
  { id: 'h_behemoth', name: "베헤모스", role: "수호기사" as Role, concept: "크아앙! 다 밟아버리겠다!", stats: { ad: 68, hp: 3450, mp: 200, mpRegen: 5, armor: 92, crit: 5, range: 150, speed: 310, regen: 35, pen: 5 } },
  { id: 'h_tortuga', name: "토르투가", role: "수호기사" as Role, concept: "느리지만, 확실하게 지켜주지.", stats: { ad: 55, hp: 3300, mp: 400, mpRegen: 6, armor: 110, crit: 0, range: 150, speed: 300, regen: 30, pen: 0 } },

  // =================================================================
  // 5. 신살자 (GOD SLAYER) - 원거리 딜러 (마나 적당, 평타 위주)
  // =================================================================
  { id: 'h_hawk', name: "호크", role: "신살자" as Role, concept: "내 화살은 빗나가지 않아.", stats: { ad: 80, hp: 1500, mp: 300, mpRegen: 6, armor: 25, crit: 40, range: 600, speed: 330, regen: 5, pen: 25 } },
  { id: 'h_trigger', name: "트리거", role: "신살자" as Role, concept: "총알은 충분해. 네 목숨이 부족할 뿐.", stats: { ad: 85, hp: 1450, mp: 250, mpRegen: 7, armor: 22, crit: 35, range: 550, speed: 335, regen: 6, pen: 30 } },
  { id: 'h_nova', name: "노바", role: "신살자" as Role, concept: "미래의 기술력을 맛봐라.", stats: { ad: 78, hp: 1550, mp: 400, mpRegen: 8, armor: 28, crit: 30, range: 625, speed: 325, regen: 5, pen: 20 } },
  { id: 'h_flint', name: "플린트", role: "신살자" as Role, concept: "현상금이 꽤 짭짤하겠어.", stats: { ad: 90, hp: 1600, mp: 320, mpRegen: 6, armor: 30, crit: 25, range: 525, speed: 340, regen: 7, pen: 35 } },
  { id: 'h_sylvia', name: "실비아", role: "신살자" as Role, concept: "바람이 나를 인도해요.", stats: { ad: 75, hp: 1400, mp: 350, mpRegen: 7, armor: 20, crit: 45, range: 650, speed: 320, regen: 4, pen: 22 } },
  { id: 'h_gambit', name: "갬빗", role: "신살자" as Role, concept: "인생은 도박이지. 올인할 텐가?", stats: { ad: 82, hp: 1580, mp: 300, mpRegen: 9, armor: 26, crit: 50, range: 550, speed: 330, regen: 6, pen: 28 } },
  { id: 'h_robin', name: "로빈", role: "신살자" as Role, concept: "가난한 자들을 위해, 네 목숨을 거두마.", stats: { ad: 84, hp: 1520, mp: 280, mpRegen: 6, armor: 24, crit: 35, range: 625, speed: 335, regen: 6, pen: 30 } },
  { id: 'h_artemis', name: "아르테미스", role: "신살자" as Role, concept: "달빛 아래서, 사냥을 시작하지.", stats: { ad: 88, hp: 1480, mp: 340, mpRegen: 7, armor: 22, crit: 40, range: 650, speed: 330, regen: 5, pen: 35 } },
  { id: 'h_apollo', name: "아폴로", role: "신살자" as Role, concept: "태양보다 뜨겁게, 음악보다 아름답게.", stats: { ad: 80, hp: 1600, mp: 380, mpRegen: 8, armor: 28, crit: 30, range: 575, speed: 340, regen: 7, pen: 25 } },
  { id: 'h_kaiser', name: "카이저", role: "신살자" as Role, concept: "황제의 탄환에 자비란 없다.", stats: { ad: 95, hp: 1450, mp: 200, mpRegen: 5, armor: 20, crit: 25, range: 700, speed: 320, regen: 4, pen: 40 } }
];