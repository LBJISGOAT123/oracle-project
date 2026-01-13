import { Hero, LiveMatch, LivePlayer, TierConfig } from '../../types';
// [중요] 헬퍼 함수 가져오기
import { userPool, getTierNameHelper } from '../system/UserManager';
import { useGameStore } from '../../store/useGameStore';
import { BASES } from '../data/MapData';

export function createLiveMatches(heroes: Hero[], ccu: number, currentTime: number, config: TierConfig): LiveMatch[] {
  const idleUsers = userPool.filter(u => u.status === 'IDLE');
  if (idleUsers.length < 10) return [];

  const matchesToMake = Math.min(Math.floor(idleUsers.length / 10), 100); 
  const newMatches: LiveMatch[] = [];
  const candidates = [...idleUsers].sort(() => Math.random() - 0.5);

  const state = useGameStore.getState().gameState;
  const blueHp = state.battleSettings?.dante?.guardianHp || 5000;
  const redHp = state.battleSettings?.izman?.guardianHp || 5000;

  for (let i = 0; i < matchesToMake; i++) {
    const batch = candidates.slice(i * 10, (i + 1) * 10);

    const createPlayer = (user: any, idx: number, teamSide: 'BLUE'|'RED'): LivePlayer => {
      const lanes = ['TOP', 'JUNGLE', 'MID', 'BOT', 'BOT']; 
      const lane = lanes[idx] as any;

      return {
        name: user.name, 
        heroId: '', 
        kills: 0, deaths: 0, assists: 0, gold: 500, cs: 0,
        totalDamageDealt: 0, 
        currentHp: 1000, maxHp: 1000, 
        currentMp: 300, maxMp: 300, mpRegen: 5,
        level: 1, exp: 0, items: [], 
        x: 50, y: 50, 
        lane: lane, 
        buffs: [], 
        mmr: user.hiddenMmr,
        respawnTimer: 0,
        stats: {
            // [수정] 이제 brain/mechanics는 프로퍼티이므로 직접 접근 가능
            brain: user.brain || 50,
            mechanics: user.mechanics || 50
        }
      };
    };

    const blueUsers = batch.slice(0, 5);
    const redUsers = batch.slice(5, 10);

    batch.forEach(u => u.status = 'INGAME');

    newMatches.push({
      id: `m_${currentTime}_${Math.random().toString(36).substr(2, 5)}`,
      status: 'DRAFTING', 
      draft: { isBlueTurn: true, turnIndex: 0, timer: 10, decisionTime: 5, phase: 'BAN' },
      bans: { blue: [], red: [] }, 
      blueTeam: blueUsers.map((u, i) => createPlayer(u, i, 'BLUE')),
      redTeam: redUsers.map((u, i) => createPlayer(u, i, 'RED')),
      startTime: currentTime, duration: 3600, currentDuration: 0, 
      score: { blue: 0, red: 0 }, 
      stats: {
        blue: { towers: {top:0,mid:0,bot:0}, colossus: 0, watcher: 0, fury: 0, nexusHp: blueHp, maxNexusHp: blueHp, activeBuffs: { siegeUnit: false, voidPower: false } },
        red: { towers: {top:0,mid:0,bot:0}, colossus: 0, watcher: 0, fury: 0, nexusHp: redHp, maxNexusHp: redHp, activeBuffs: { siegeUnit: false, voidPower: false } }
      },
      timeline: [], 
      // [수정] 헬퍼 함수 사용
      avgTier: getTierNameHelper(batch[0].score, config),
      logs: [], 
      nextColossusSpawnTime: 300, nextWatcherSpawnTime: 900,
      objectives: {
        colossus: { hp: 0, maxHp: 10000, status: 'DEAD', nextSpawnTime: 300 },
        watcher: { hp: 0, maxHp: 10000, status: 'DEAD', nextSpawnTime: 900 }
      },
      minions: [], projectiles: [], jungleMobs: []
    });
  }
  return newMatches;
}
