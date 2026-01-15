// ==========================================
// FILE PATH: /src/data/jungle/jungleDefaults.ts
// ==========================================
import { JungleSettings, JungleMonsterStats } from '../../types/jungle';

const BASE: JungleMonsterStats = {
  name: '', hp: 1200, atk: 60, def: 20, 
  gold: 80, xp: 120, respawnTime: 90, 
  isBuffMob: false, 
  buffs: [] 
};

export const DEFAULT_JUNGLE_CONFIG: JungleSettings = {
  density: 100,
  camps: {
    // 1. [Blue Top] 
    TOP_BLUE: {
      id: 'TOP_BLUE',
      name: '수정 동굴 (Blue Top)',
      monsters: [
        { spotId: 'main', x: 22, y: 40, stats: { ...BASE, name: '수정 파수꾼', hp: 2000, isBuffMob: true, buffs: [{type: 'REGEN', value: 50}] } }, 
        { spotId: 'sub1', x: 20, y: 35, stats: { ...BASE, name: '수정 도마뱀', hp: 600, gold: 30, xp: 40 } },
        { spotId: 'sub2', x: 20, y: 45, stats: { ...BASE, name: '수정 도마뱀', hp: 600, gold: 30, xp: 40 } }
      ]
    },

    // 2. [Blue Bot] 
    BOT_BLUE: {
      id: 'BOT_BLUE',
      name: '붉은 숲 (Blue Bot)',
      monsters: [
        { spotId: 'main', x: 60, y: 80, stats: { ...BASE, name: '용암 거북', hp: 2200, isBuffMob: true, buffs: [{type: 'ATK', value: 15}] } }, 
        { spotId: 'sub1', x: 55, y: 78, stats: { ...BASE, name: '불꽃 임프', hp: 800, gold: 40, xp: 50 } }, 
        { spotId: 'sub2', x: 65, y: 82, stats: { ...BASE, name: '불꽃 임프', hp: 800, gold: 40, xp: 50 } }
      ]
    },
    
    // 3. [Red Top]
    TOP_RED: {
      id: 'TOP_RED',
      name: '메마른 협곡 (Red Top)',
      monsters: [
        { spotId: 'main', x: 40, y: 20, stats: { ...BASE, name: '황야의 포식자', hp: 2200, isBuffMob: true, buffs: [{type: 'ATK', value: 15}] } }, 
        { spotId: 'sub1', x: 35, y: 18, stats: { ...BASE, name: '사막 전갈', hp: 800, gold: 40, xp: 50 } }, 
        { spotId: 'sub2', x: 45, y: 22, stats: { ...BASE, name: '사막 전갈', hp: 800, gold: 40, xp: 50 } } 
      ]
    },

    // 4. [Red Bot]
    BOT_RED: {
      id: 'BOT_RED',
      name: '심연의 늪 (Red Bot)',
      monsters: [
        { spotId: 'main', x: 80, y: 55, stats: { ...BASE, name: '심연의 주시자', hp: 2000, isBuffMob: true, buffs: [{type: 'HASSTE', value: 20}] } }, 
        { spotId: 'sub1', x: 78, y: 50, stats: { ...BASE, name: '진흙 괴물', hp: 700, gold: 30, xp: 40 } },
        { spotId: 'sub2', x: 82, y: 60, stats: { ...BASE, name: '진흙 괴물', hp: 700, gold: 30, xp: 40 } }
      ]
    }
  }
};
