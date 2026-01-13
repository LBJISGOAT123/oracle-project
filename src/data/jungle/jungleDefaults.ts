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
    // 1. [Blue Top] 수정 동굴: 중앙 길가가 아니라 '좌측 둥지'로 이동
    TOP_BLUE: {
      id: 'TOP_BLUE',
      name: '수정 동굴 (Blue Top)',
      monsters: [
        // 메인: 좌측 벽쪽 깊숙이
        { spotId: 'main', x: 28, y: 45, stats: { ...BASE, name: '수정 파수꾼', hp: 2000, isBuffMob: true, buffs: [{type: 'REGEN', value: 50}] } }, 
        // 쫄몹: 둥지 안에서 메인을 감싸도록
        { spotId: 'sub1', x: 18, y: 35, stats: { ...BASE, name: '수정 도마뱀', hp: 600, gold: 30, xp: 40 } },
        { spotId: 'sub2', x: 18, y: 55, stats: { ...BASE, name: '수정 도마뱀', hp: 600, gold: 30, xp: 40 } },
        { spotId: 'sub3', x: 40, y: 45, stats: { ...BASE, name: '수정 도마뱀', hp: 600, gold: 30, xp: 40 } }
      ]
    },

    // 2. [Blue Bot] 붉은 숲: 중앙 삼거리가 아니라 '우측 하단 둥지'로 이동
    BOT_BLUE: {
      id: 'BOT_BLUE',
      name: '붉은 숲 (Blue Bot)',
      monsters: [
        // 메인: 우측 둥지 안쪽
        { spotId: 'main', x: 72, y: 60, stats: { ...BASE, name: '용암 거북', hp: 2200, isBuffMob: true, buffs: [{type: 'ATK', value: 15}] } }, 
        // 쫄몹: 둥지 테두리
        { spotId: 'sub1', x: 62, y: 50, stats: { ...BASE, name: '불꽃 임프', hp: 800, gold: 40, xp: 50 } }, 
        { spotId: 'sub2', x: 82, y: 50, stats: { ...BASE, name: '불꽃 임프', hp: 800, gold: 40, xp: 50 } }, 
        { spotId: 'sub3', x: 72, y: 75, stats: { ...BASE, name: '불꽃 임프', hp: 800, gold: 40, xp: 50 } }
      ]
    },
    
    // 3. [Red Top] 메마른 협곡: 좌측 상단 둥지 (이전 수정 유지)
    TOP_RED: {
      id: 'TOP_RED',
      name: '메마른 협곡 (Red Top)',
      monsters: [
        { spotId: 'main', x: 30, y: 30, stats: { ...BASE, name: '황야의 포식자', hp: 2200, isBuffMob: true, buffs: [{type: 'ATK', value: 15}] } }, 
        { spotId: 'sub1', x: 20, y: 40, stats: { ...BASE, name: '사막 전갈', hp: 800, gold: 40, xp: 50 } }, 
        { spotId: 'sub2', x: 40, y: 40, stats: { ...BASE, name: '사막 전갈', hp: 800, gold: 40, xp: 50 } }, 
        { spotId: 'sub3', x: 30, y: 50, stats: { ...BASE, name: '사막 전갈', hp: 800, gold: 40, xp: 50 } }  
      ]
    },

    // 4. [Red Bot] 심연의 늪: 우측 상단 둥지 (이전 수정 유지)
    BOT_RED: {
      id: 'BOT_RED',
      name: '심연의 늪 (Red Bot)',
      monsters: [
        { spotId: 'main', x: 65, y: 35, stats: { ...BASE, name: '심연의 주시자', hp: 2000, isBuffMob: true, buffs: [{type: 'HASSTE', value: 20}] } }, 
        { spotId: 'sub1', x: 55, y: 25, stats: { ...BASE, name: '진흙 괴물', hp: 700, gold: 30, xp: 40 } },
        { spotId: 'sub2', x: 75, y: 25, stats: { ...BASE, name: '진흙 괴물', hp: 700, gold: 30, xp: 40 } },
        { spotId: 'sub3', x: 65, y: 50, stats: { ...BASE, name: '진흙 괴물', hp: 700, gold: 30, xp: 40 } }
      ]
    }
  }
};
