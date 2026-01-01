// ==========================================
// FILE PATH: /src/engine/match/MatchCreator.ts
// ==========================================

import { Hero, LiveMatch, LivePlayer, TierConfig } from '../../types';
import { userPool, getTierNameHelper } from '../UserManager';
import { performBanPick } from './BanPickEngine';
import { useGameStore } from '../../store/useGameStore';

export function createLiveMatches(heroes: Hero[], ccu: number, currentTime: number, config: TierConfig): LiveMatch[] {
  const idleUsers = userPool.filter(u => u.status === 'IDLE');
  if (idleUsers.length < 10) return [];

  const matchesToMake = Math.min(Math.floor(idleUsers.length / 10), 20); 
  const newMatches: LiveMatch[] = [];
  const candidates = [...idleUsers].sort(() => Math.random() - 0.5);

  const settings = useGameStore.getState().gameState.battleSettings;
  const blueHp = settings?.dante?.guardianHp || 5000;
  const redHp = settings?.izman?.guardianHp || 5000;

  for (let i = 0; i < matchesToMake; i++) {
    const batch = candidates.slice(i * 10, (i + 1) * 10);
    const { bans, picks } = performBanPick(heroes, batch);

    [...bans.blue, ...bans.red].forEach(heroId => {
      const hero = heroes.find(h => h.id === heroId);
      if (hero) hero.record.totalBans++;
    });

    const createPlayer = (pData: any, index: number): LivePlayer => {
      const originalUser = batch.find(u => u.name === pData.name);
      const userMmr = originalUser ? originalUser.hiddenMmr : 1500; 

      return {
        name: pData.name, heroId: pData.heroId, 
        kills: 0, deaths: 0, assists: 0, gold: 500, cs: 0,
        totalDamageDealt: 0,
        currentHp: 1000, maxHp: 1000, level: 1, items: [], 
        x: 50, y: 50, 
        lane: (['TOP', 'JUNGLE', 'MID', 'BOT', 'BOT'][index] as any),
        buffs: [], mmr: userMmr
      };
    };

    batch.forEach(u => u.status = 'INGAME');
    const maxDuration = 60 * 60; 

    newMatches.push({
      id: `m_${currentTime}_${Math.random().toString(36).substr(2, 5)}`,
      blueTeam: picks.blue.map((p, idx) => createPlayer(p, idx)),
      redTeam: picks.red.map((p, idx) => createPlayer(p, idx)),
      bans, 
      startTime: currentTime,
      duration: maxDuration,
      currentDuration: 0, 
      score: { blue: 0, red: 0 }, 
      stats: {
        blue: { 
          towers: { top: 0, mid: 0, bot: 0 }, 
          colossus: 0, watcher: 0, fury: 0, 
          nexusHp: blueHp, maxNexusHp: blueHp,
          activeBuffs: { siegeUnit: false, voidPower: false } 
        },
        red: { 
          towers: { top: 0, mid: 0, bot: 0 }, 
          colossus: 0, watcher: 0, fury: 0, 
          nexusHp: redHp, maxNexusHp: redHp,
          activeBuffs: { siegeUnit: false, voidPower: false } 
        }
      },
      timeline: [],
      avgTier: getTierNameHelper(batch[0].score, config),
      logs: [{ time: 0, message: "--- 소환사의 협곡에 오신 것을 환영합니다 ---", type: 'START' }],

      // [신규] 스폰 타이머 초기화 (거신병: 5분, 주시자: 20분)
      nextColossusSpawnTime: 300,
      nextWatcherSpawnTime: 1200
    });
  }
  return newMatches;
}