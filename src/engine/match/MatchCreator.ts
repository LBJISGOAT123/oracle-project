// ==========================================
// FILE PATH: /src/engine/match/MatchCreator.ts
// ==========================================
import { Hero, LiveMatch, LivePlayer, TierConfig } from '../../types';
import { userPool, getTierNameHelper } from '../system/UserManager';
import { useGameStore } from '../../store/useGameStore';

export function createLiveMatches(heroes: Hero[], ccu: number, currentTime: number, config: TierConfig): LiveMatch[] {
  const idleUsers = userPool.filter(u => u.status === 'IDLE');
  if (idleUsers.length < 10) return [];

  const matchesToMake = Math.min(Math.floor(idleUsers.length / 10), 100); 
  const newMatches: LiveMatch[] = [];
  const candidates = [...idleUsers].sort(() => Math.random() - 0.5);

  const state = useGameStore.getState().gameState;
  const positions = state.fieldSettings.positions; 

  const blueBase = positions.towers.blue.nexus;
  const redBase = positions.towers.red.nexus;
  
  const t1Hp = state.fieldSettings.towers?.t1?.hp || 5000;
  const nexusHp = state.fieldSettings.towers?.nexus?.hp || 30000;

  for (let i = 0; i < matchesToMake; i++) {
    const batch = candidates.slice(i * 10, (i + 1) * 10);

    const createPlayer = (user: any, idx: number, isBlue: boolean): LivePlayer => {
      const lanes = ['TOP', 'JUNGLE', 'MID', 'BOT', 'BOT']; 
      const lane = lanes[idx] as any;
      const base = isBlue ? blueBase : redBase;

      return {
        name: user.name, heroId: '', 
        kills: 0, deaths: 0, assists: 0, gold: 500, cs: 0, totalDamageDealt: 0, 
        currentHp: 1000, maxHp: 1000, currentMp: 300, maxMp: 300, mpRegen: 5,
        level: 1, items: [], 
        x: base.x, y: base.y, 
        lane: lane, buffs: [], mmr: user.hiddenMmr, respawnTimer: 0,
        stats: { brain: user.brain || 50, mechanics: user.mechanics || 50 },
        // [신규] 현상금 시스템 초기화
        killStreak: 0,
        bounty: 0
      };
    };

    const blueUsers = batch.slice(0, 5);
    const redUsers = batch.slice(5, 10);
    batch.forEach(u => u.status = 'INGAME');

    const jungleMobs = positions.jungle.map((pos, idx) => ({
        id: `jungle_${idx}`, campId: idx, type: idx % 2 === 0 ? 'WOLF' : 'GOLEM',
        x: pos.x, y: pos.y, 
        hp: 1000, maxHp: 1000, atk: 50, respawnTimer: 0, isAlive: true
    }));

    newMatches.push({
      id: `m_${currentTime}_${Math.random().toString(36).substr(2, 5)}`,
      status: 'DRAFTING', 
      draft: { isBlueTurn: true, turnIndex: 0, timer: 10, decisionTime: 5, phase: 'BAN' },
      bans: { blue: [], red: [] }, 
      blueTeam: blueUsers.map((u, i) => createPlayer(u, i, true)),
      redTeam: redUsers.map((u, i) => createPlayer(u, i, false)),
      startTime: currentTime, duration: 3600, currentDuration: 0, 
      score: { blue: 0, red: 0 }, 
      stats: {
        blue: { 
            towers: {top:0,mid:0,bot:0}, laneHealth: {top:t1Hp, mid:t1Hp, bot:t1Hp},
            colossus: 0, watcher: 0, fury: 0, nexusHp: nexusHp, maxNexusHp: nexusHp, activeBuffs: { siegeUnit: false, voidPower: false } 
        },
        red: { 
            towers: {top:0,mid:0,bot:0}, laneHealth: {top:t1Hp, mid:t1Hp, bot:t1Hp},
            colossus: 0, watcher: 0, fury: 0, nexusHp: nexusHp, maxNexusHp: nexusHp, activeBuffs: { siegeUnit: false, voidPower: false } 
        }
      },
      timeline: [], avgTier: getTierNameHelper(batch[0].score, config), logs: [], 
      
      nextColossusSpawnTime: state.fieldSettings.colossus.initialSpawnTime, 
      nextWatcherSpawnTime: state.fieldSettings.watcher.initialSpawnTime,
      objectives: {
        colossus: { hp: 0, maxHp: 10000, status: 'DEAD', nextSpawnTime: state.fieldSettings.colossus.initialSpawnTime },
        watcher: { hp: 0, maxHp: 10000, status: 'DEAD', nextSpawnTime: state.fieldSettings.watcher.initialSpawnTime }
      },
      minions: [], projectiles: [], 
      jungleMobs: jungleMobs as any 
    });
  }
  return newMatches;
}
