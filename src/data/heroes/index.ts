// src/data/heroes/index.ts
import { Hero } from '../../types';
import { RAW_HERO_LIST } from './heroList';
import { HERO_SKILL_DATA } from './skillData';
import { getEmptyRecord, getEmptyUI, fallbackSkills } from './helpers';

export const INITIAL_HEROES: Hero[] = RAW_HERO_LIST.map(h => {
  // 스탯 보정 및 기본값 설정
  const baseStats = {
    ad: h.stats.ad || 0,
    ap: (h.stats as any).ap || 0,
    hp: h.stats.hp || 1000,
    armor: h.stats.armor || 0,
    crit: h.stats.crit || 0,
    range: h.stats.range || 150,
    speed: h.stats.speed || 340,
    regen: h.stats.regen || 10,
    pen: h.stats.pen || 0,
    baseAtk: h.stats.ad || 50
  };

  return {
    ...h,
    stats: baseStats,
    // ID에 맞는 스킬 데이터 할당 (없으면 fallback용 기본 스킬 주입)
    skills: HERO_SKILL_DATA[h.id] || fallbackSkills,
    record: getEmptyRecord(),
    ...getEmptyUI()
  } as Hero;
});
