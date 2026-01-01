// ==========================================
// FILE PATH: /src/data/heroes/heroList.ts
// ==========================================
import { Role } from '../../types';

// [역할군별 평타 사거리 표준]
// 근접 (집행관, 수호기사, 근접 추적자): 125 ~ 175
// 원거리 (선지자, 신살자, 원거리 추적자): 500 ~ 650

export const RAW_HERO_LIST = [
  // =================================================================
  // 1. 집행관 (EXECUTOR) - 근접 전사 (사거리 150~175)
  // =================================================================
  { id: 'h_ragna', name: "라그나", role: "집행관" as Role, stats: { ad: 75, hp: 2200, armor: 45, crit: 20, range: 175, speed: 345, regen: 15, pen: 10 } },
  { id: 'h_kensei', name: "켄세이", role: "집행관" as Role, stats: { ad: 80, hp: 1950, armor: 35, crit: 25, range: 175, speed: 350, regen: 10, pen: 15 } },
  { id: 'h_baldur', name: "발두르", role: "집행관" as Role, stats: { ad: 70, hp: 2400, armor: 55, crit: 10, range: 150, speed: 335, regen: 20, pen: 5 } },
  { id: 'h_freya', name: "프레이야", role: "집행관" as Role, stats: { ad: 72, hp: 2100, armor: 40, crit: 15, range: 175, speed: 340, regen: 12, pen: 12 } },
  { id: 'h_gorgon', name: "고르곤", role: "집행관" as Role, stats: { ad: 85, hp: 2000, armor: 40, crit: 15, range: 150, speed: 330, regen: 18, pen: 20 } },
  { id: 'h_arthur', name: "아서", role: "집행관" as Role, stats: { ad: 68, hp: 2300, armor: 50, crit: 10, range: 150, speed: 340, regen: 14, pen: 8 } },
  // [신규]
  { id: 'h_leonidas', name: "레오니다스", role: "집행관" as Role, stats: { ad: 78, hp: 2350, armor: 50, crit: 15, range: 175, speed: 340, regen: 16, pen: 10 } },
  { id: 'h_musashi', name: "무사시", role: "집행관" as Role, stats: { ad: 82, hp: 2050, armor: 38, crit: 30, range: 150, speed: 355, regen: 12, pen: 20 } },
  { id: 'h_lancelot', name: "란슬롯", role: "집행관" as Role, stats: { ad: 74, hp: 2250, armor: 48, crit: 20, range: 175, speed: 345, regen: 14, pen: 15 } },
  { id: 'h_siegfried', name: "지크프리트", role: "집행관" as Role, stats: { ad: 88, hp: 2500, armor: 60, crit: 10, range: 150, speed: 330, regen: 25, pen: 5 } },

  // =================================================================
  // 2. 선지자 (PROPHET) - 원거리 마법사 (사거리 500~600)
  // =================================================================
  { id: 'h_merlin', name: "멀린", role: "선지자" as Role, stats: { ad: 40, ap: 85, hp: 1600, armor: 25, crit: 0, range: 550, speed: 330, regen: 7, pen: 30 } },
  { id: 'h_crowley', name: "크로울리", role: "선지자" as Role, stats: { ad: 45, ap: 90, hp: 1550, armor: 20, crit: 0, range: 525, speed: 335, regen: 6, pen: 35 } },
  { id: 'h_elara', name: "엘라라", role: "선지자" as Role, stats: { ad: 38, ap: 80, hp: 1650, armor: 30, crit: 0, range: 575, speed: 325, regen: 8, pen: 25 } },
  { id: 'h_nix', name: "닉스", role: "선지자" as Role, stats: { ad: 42, ap: 95, hp: 1500, armor: 22, crit: 0, range: 600, speed: 340, regen: 5, pen: 40 } },
  { id: 'h_sol', name: "솔", role: "선지자" as Role, stats: { ad: 35, ap: 88, hp: 1700, armor: 28, crit: 0, range: 550, speed: 330, regen: 9, pen: 28 } },
  { id: 'h_gaia', name: "가이아", role: "선지자" as Role, stats: { ad: 40, ap: 82, hp: 1800, armor: 35, crit: 0, range: 500, speed: 320, regen: 10, pen: 20 } },
  // [신규]
  { id: 'h_nostra', name: "노스트라", role: "선지자" as Role, stats: { ad: 35, ap: 92, hp: 1550, armor: 20, crit: 0, range: 580, speed: 325, regen: 6, pen: 35 } },
  { id: 'h_rasputin', name: "라스푸틴", role: "선지자" as Role, stats: { ad: 45, ap: 88, hp: 1750, armor: 30, crit: 0, range: 525, speed: 330, regen: 15, pen: 25 } },
  { id: 'h_circe', name: "키르케", role: "선지자" as Role, stats: { ad: 40, ap: 96, hp: 1480, armor: 18, crit: 0, range: 600, speed: 335, regen: 5, pen: 40 } },
  { id: 'h_morgana', name: "모르가나", role: "선지자" as Role, stats: { ad: 42, ap: 85, hp: 1620, armor: 25, crit: 0, range: 550, speed: 340, regen: 8, pen: 30 } },

  // =================================================================
  // 3. 추적자 (TRACKER) - 근접 암살자 (사거리 125~175)
  // =================================================================
  { id: 'h_kage', name: "카게", role: "추적자" as Role, stats: { ad: 88, hp: 1650, armor: 30, crit: 35, range: 125, speed: 360, regen: 8, pen: 40 } },
  { id: 'h_fenrir', name: "펜리르", role: "추적자" as Role, stats: { ad: 82, hp: 1800, armor: 35, crit: 25, range: 125, speed: 355, regen: 12, pen: 30 } },
  { id: 'h_viper', name: "바이퍼", role: "추적자" as Role, stats: { ad: 78, hp: 1700, armor: 28, crit: 20, range: 150, speed: 350, regen: 9, pen: 35 } },
  { id: 'h_specter', name: "스펙터", role: "추적자" as Role, stats: { ad: 90, hp: 1550, armor: 25, crit: 40, range: 125, speed: 355, regen: 7, pen: 45 } },
  { id: 'h_locust', name: "로커스트", role: "추적자" as Role, stats: { ad: 75, hp: 1750, armor: 32, crit: 30, range: 150, speed: 365, regen: 10, pen: 25 } },
  { id: 'h_scarlet', name: "스칼렛", role: "추적자" as Role, stats: { ad: 85, hp: 1600, armor: 20, crit: 45, range: 125, speed: 350, regen: 6, pen: 50 } },
  // [신규]
  { id: 'h_hattori', name: "핫토리", role: "추적자" as Role, stats: { ad: 86, hp: 1600, armor: 28, crit: 40, range: 125, speed: 365, regen: 7, pen: 45 } },
  { id: 'h_jack', name: "잭", role: "추적자" as Role, stats: { ad: 92, hp: 1580, armor: 25, crit: 50, range: 125, speed: 360, regen: 6, pen: 55 } },
  { id: 'h_arachne', name: "아라크네", role: "추적자" as Role, stats: { ad: 76, hp: 1720, armor: 35, crit: 25, range: 150, speed: 355, regen: 10, pen: 30 } },
  { id: 'h_goemon', name: "고에몬", role: "추적자" as Role, stats: { ad: 84, hp: 1680, armor: 32, crit: 30, range: 150, speed: 350, regen: 9, pen: 35 } },

  // =================================================================
  // 4. 수호기사 (GUARDIAN) - 근접 탱커 (사거리 150~175)
  // =================================================================
  { id: 'h_aigis', name: "아이기스", role: "수호기사" as Role, stats: { ad: 50, hp: 3500, armor: 95, crit: 0, range: 150, speed: 315, regen: 30, pen: 0 } },
  { id: 'h_golem', name: "골렘", role: "수호기사" as Role, stats: { ad: 60, hp: 3300, armor: 90, crit: 5, range: 150, speed: 310, regen: 25, pen: 5 } },
  { id: 'h_paladin', name: "팔라딘", role: "수호기사" as Role, stats: { ad: 55, hp: 3000, armor: 85, crit: 0, range: 150, speed: 325, regen: 20, pen: 0 } },
  { id: 'h_treant', name: "트리언트", role: "수호기사" as Role, stats: { ad: 65, hp: 3200, armor: 80, crit: 5, range: 175, speed: 320, regen: 40, pen: 5 } },
  { id: 'h_magnus', name: "매그너스", role: "수호기사" as Role, stats: { ad: 58, hp: 2900, armor: 88, crit: 10, range: 150, speed: 330, regen: 22, pen: 10 } },
  { id: 'h_yeti', name: "예티", role: "수호기사" as Role, stats: { ad: 62, hp: 3400, armor: 75, crit: 5, range: 150, speed: 315, regen: 28, pen: 5 } },
  // [신규]
  { id: 'h_spartacus', name: "스파르타쿠스", role: "수호기사" as Role, stats: { ad: 65, hp: 3100, armor: 85, crit: 10, range: 150, speed: 325, regen: 25, pen: 10 } },
  { id: 'h_titan', name: "타이탄", role: "수호기사" as Role, stats: { ad: 70, hp: 3600, armor: 100, crit: 0, range: 150, speed: 305, regen: 40, pen: 0 } },
  { id: 'h_behemoth', name: "베헤모스", role: "수호기사" as Role, stats: { ad: 68, hp: 3450, armor: 92, crit: 5, range: 150, speed: 310, regen: 35, pen: 5 } },
  { id: 'h_tortuga', name: "토르투가", role: "수호기사" as Role, stats: { ad: 55, hp: 3300, armor: 110, crit: 0, range: 150, speed: 300, regen: 30, pen: 0 } },

  // =================================================================
  // 5. 신살자 (GOD SLAYER) - 원거리 딜러 (사거리 525~700)
  // =================================================================
  { id: 'h_hawk', name: "호크", role: "신살자" as Role, stats: { ad: 80, hp: 1500, armor: 25, crit: 40, range: 600, speed: 330, regen: 5, pen: 25 } },
  { id: 'h_trigger', name: "트리거", role: "신살자" as Role, stats: { ad: 85, hp: 1450, armor: 22, crit: 35, range: 550, speed: 335, regen: 6, pen: 30 } },
  { id: 'h_nova', name: "노바", role: "신살자" as Role, stats: { ad: 78, hp: 1550, armor: 28, crit: 30, range: 625, speed: 325, regen: 5, pen: 20 } },
  { id: 'h_flint', name: "플린트", role: "신살자" as Role, stats: { ad: 90, hp: 1600, armor: 30, crit: 25, range: 525, speed: 340, regen: 7, pen: 35 } },
  { id: 'h_sylvia', name: "실비아", role: "신살자" as Role, stats: { ad: 75, hp: 1400, armor: 20, crit: 45, range: 650, speed: 320, regen: 4, pen: 22 } },
  { id: 'h_gambit', name: "갬빗", role: "신살자" as Role, stats: { ad: 82, hp: 1580, armor: 26, crit: 50, range: 550, speed: 330, regen: 6, pen: 28 } },
  // [신규]
  { id: 'h_robin', name: "로빈", role: "신살자" as Role, stats: { ad: 84, hp: 1520, armor: 24, crit: 35, range: 625, speed: 335, regen: 6, pen: 30 } },
  { id: 'h_artemis', name: "아르테미스", role: "신살자" as Role, stats: { ad: 88, hp: 1480, armor: 22, crit: 40, range: 650, speed: 330, regen: 5, pen: 35 } },
  { id: 'h_apollo', name: "아폴로", role: "신살자" as Role, stats: { ad: 80, hp: 1600, armor: 28, crit: 30, range: 575, speed: 340, regen: 7, pen: 25 } },
  { id: 'h_kaiser', name: "카이저", role: "신살자" as Role, stats: { ad: 95, hp: 1450, armor: 20, crit: 25, range: 700, speed: 320, regen: 4, pen: 40 } }
];
