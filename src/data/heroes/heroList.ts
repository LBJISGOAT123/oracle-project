// src/data/heroes/heroList.ts
import { Role } from '../../types';

export const RAW_HERO_LIST = [
  // 1. 집행관 (Executor) - 최전선의 전사들
  { id: 'h_ragna', name: "라그나", role: "집행관" as Role, stats: { ad: 75, hp: 2200, armor: 45, crit: 20, range: 175, speed: 345, regen: 15, pen: 10 } },
  { id: 'h_kensei', name: "켄세이", role: "집행관" as Role, stats: { ad: 80, hp: 1950, armor: 35, crit: 25, range: 175, speed: 350, regen: 10, pen: 15 } },
  { id: 'h_baldur', name: "발두르", role: "집행관" as Role, stats: { ad: 70, hp: 2400, armor: 55, crit: 10, range: 150, speed: 335, regen: 20, pen: 5 } },
  { id: 'h_freya', name: "프레이야", role: "집행관" as Role, stats: { ad: 72, hp: 2100, armor: 40, crit: 15, range: 175, speed: 340, regen: 12, pen: 12 } },
  { id: 'h_gorgon', name: "고르곤", role: "집행관" as Role, stats: { ad: 85, hp: 2000, armor: 40, crit: 15, range: 150, speed: 330, regen: 18, pen: 20 } },
  { id: 'h_arthur', name: "아서", role: "집행관" as Role, stats: { ad: 68, hp: 2300, armor: 50, crit: 10, range: 150, speed: 340, regen: 14, pen: 8 } },

  // 2. 선지자 (Prophet) - 광역 마법사
  { id: 'h_merlin', name: "멀린", role: "선지자" as Role, stats: { ad: 40, ap: 85, hp: 1600, armor: 25, crit: 0, range: 550, speed: 330, regen: 7, pen: 30 } },
  { id: 'h_crowley', name: "크로울리", role: "선지자" as Role, stats: { ad: 45, ap: 90, hp: 1550, armor: 20, crit: 0, range: 525, speed: 335, regen: 6, pen: 35 } },
  { id: 'h_elara', name: "엘라라", role: "선지자" as Role, stats: { ad: 38, ap: 80, hp: 1650, armor: 30, crit: 0, range: 575, speed: 325, regen: 8, pen: 25 } },
  { id: 'h_nix', name: "닉스", role: "선지자" as Role, stats: { ad: 42, ap: 95, hp: 1500, armor: 22, crit: 0, range: 600, speed: 340, regen: 5, pen: 40 } },
  { id: 'h_sol', name: "솔", role: "선지자" as Role, stats: { ad: 35, ap: 88, hp: 1700, armor: 28, crit: 0, range: 550, speed: 330, regen: 9, pen: 28 } },
  { id: 'h_gaia', name: "가이아", role: "선지자" as Role, stats: { ad: 40, ap: 82, hp: 1800, armor: 35, crit: 0, range: 500, speed: 320, regen: 10, pen: 20 } },

  // 3. 추적자 (Tracker) - 암살자 및 정글러
  { id: 'h_kage', name: "카게", role: "추적자" as Role, stats: { ad: 88, hp: 1650, armor: 30, crit: 35, range: 125, speed: 360, regen: 8, pen: 40 } },
  { id: 'h_fenrir', name: "펜리르", role: "추적자" as Role, stats: { ad: 82, hp: 1800, armor: 35, crit: 25, range: 125, speed: 355, regen: 12, pen: 30 } },
  { id: 'h_viper', name: "바이퍼", role: "추적자" as Role, stats: { ad: 78, hp: 1700, armor: 28, crit: 20, range: 150, speed: 350, regen: 9, pen: 35 } },
  { id: 'h_specter', name: "스펙터", role: "추적자" as Role, stats: { ad: 90, hp: 1550, armor: 25, crit: 40, range: 125, speed: 355, regen: 7, pen: 45 } },
  { id: 'h_locust', name: "로커스트", role: "추적자" as Role, stats: { ad: 75, hp: 1750, armor: 32, crit: 30, range: 150, speed: 365, regen: 10, pen: 25 } },
  { id: 'h_scarlet', name: "스칼렛", role: "추적자" as Role, stats: { ad: 85, hp: 1600, armor: 20, crit: 45, range: 125, speed: 350, regen: 6, pen: 50 } },

  // 4. 수호기사 (Guardian) - 탱커
  { id: 'h_aigis', name: "아이기스", role: "수호기사" as Role, stats: { ad: 50, hp: 3500, armor: 95, crit: 0, range: 150, speed: 315, regen: 30, pen: 0 } },
  { id: 'h_golem', name: "골렘", role: "수호기사" as Role, stats: { ad: 60, hp: 3300, armor: 90, crit: 5, range: 150, speed: 310, regen: 25, pen: 5 } },
  { id: 'h_paladin', name: "팔라딘", role: "수호기사" as Role, stats: { ad: 55, hp: 3000, armor: 85, crit: 0, range: 150, speed: 325, regen: 20, pen: 0 } },
  { id: 'h_treant', name: "트리언트", role: "수호기사" as Role, stats: { ad: 65, hp: 3200, armor: 80, crit: 5, range: 175, speed: 320, regen: 40, pen: 5 } },
  { id: 'h_magnus', name: "매그너스", role: "수호기사" as Role, stats: { ad: 58, hp: 2900, armor: 88, crit: 10, range: 150, speed: 330, regen: 22, pen: 10 } },
  { id: 'h_yeti', name: "예티", role: "수호기사" as Role, stats: { ad: 62, hp: 3400, armor: 75, crit: 5, range: 150, speed: 315, regen: 28, pen: 5 } },

  // 5. 신살자 (God Slayer) - 원거리 딜러
  { id: 'h_hawk', name: "호크", role: "신살자" as Role, stats: { ad: 80, hp: 1500, armor: 25, crit: 40, range: 600, speed: 330, regen: 5, pen: 25 } },
  { id: 'h_trigger', name: "트리거", role: "신살자" as Role, stats: { ad: 85, hp: 1450, armor: 22, crit: 35, range: 550, speed: 335, regen: 6, pen: 30 } },
  { id: 'h_nova', name: "노바", role: "신살자" as Role, stats: { ad: 78, hp: 1550, armor: 28, crit: 30, range: 625, speed: 325, regen: 5, pen: 20 } },
  { id: 'h_flint', name: "플린트", role: "신살자" as Role, stats: { ad: 90, hp: 1600, armor: 30, crit: 25, range: 525, speed: 340, regen: 7, pen: 35 } },
  { id: 'h_sylvia', name: "실비아", role: "신살자" as Role, stats: { ad: 75, hp: 1400, armor: 20, crit: 45, range: 650, speed: 320, regen: 4, pen: 22 } },
  { id: 'h_gambit', name: "갬빗", role: "신살자" as Role, stats: { ad: 82, hp: 1580, armor: 26, crit: 50, range: 550, speed: 330, regen: 6, pen: 28 } }
];