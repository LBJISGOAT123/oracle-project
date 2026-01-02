// ==========================================
// FILE PATH: /src/engine/match/MatchCreator.ts
// ==========================================
import { Hero, LiveMatch, LivePlayer, TierConfig } from '../../types';
import { userPool, getTierNameHelper } from '../UserManager';
import { useGameStore } from '../../store/useGameStore';

export function createLiveMatches(heroes: Hero[], ccu: number, currentTime: number, config: TierConfig): LiveMatch[] {
  const idleUsers = userPool.filter(u => u.status === 'IDLE');
  if (idleUsers.length < 10) return [];

  const matchesToMake = Math.min(Math.floor(idleUsers.length / 10), 100); 
  const newMatches: LiveMatch[] = [];
  const candidates = [...idleUsers].sort(() => Math.random() - 0.5);

  const state = useGameStore.getState().gameState;
  const blueHp = state.battleSettings?.dante?.guardianHp || 5000;
  const redHp = state.battleSettings?.izman?.guardianHp || 5000;
  const field = state.fieldSettings;

  for (let i = 0; i < matchesToMake; i++) {
    const batch = candidates.slice(i * 10, (i + 1) * 10);

    const createPlayer = (user: any, idx: number, teamSide: 'BLUE'|'RED'): LivePlayer => {
      const lanes = ['TOP', 'JUNGLE', 'MID', 'BOT', 'BOT']; 
      const lane = lanes[idx] as any;

      // 영웅 데이터를 미리 찾아 기초 스탯 반영 (없으면 기본값)
      // 실제로는 MatchUpdater에서 start 시점에 다시 maxHp 등을 맞추지만, 여기서도 초기화 해둠.
      return {
        name: user.name, 
        heroId: '', 
        kills: 0, deaths: 0, assists: 0, gold: 500, cs: 0,
        totalDamageDealt: 0,
        currentHp: 1000, maxHp: 1000, 

        // [신규] 마나 스탯 초기화 (기본값)
        currentMp: 300, maxMp: 300, mpRegen: 5,

        level: 1, 
        exp: 0, 
        items: [], 
        x: 50, y: 50, 
        lane: lane, 
        buffs: [], 
        mmr: user.hiddenMmr,

        // 부활 대기 시간 (0: 생존)
        respawnTimer: 0,

        stats: {
            brain: user.brain,
            mechanics: user.mechanics
        }
      };
    };

    const blueUsers = batch.slice(0, 5);
    const redUsers = batch.slice(5, 10);

    batch.forEach(u => u.status = 'INGAME');

    const colossusHp = field?.colossus?.hp || 8000;
    const watcherHp = field?.watcher?.hp || 12000;
    const colossusRespawn = field?.colossus?.respawnTime || 300;

    newMatches.push({
      id: `m_${currentTime}_${Math.random().toString(36).substr(2, 5)}`,
      status: 'DRAFTING', 
      draft: {
        isBlueTurn: true,
        turnIndex: 0,
        timer: 30, 
        decisionTime: 3 + Math.random() * 25, 
        phase: 'BAN'
      },

      blueTeam: blueUsers.map((u, i) => createPlayer(u, i, 'BLUE')),
      redTeam: redUsers.map((u, i) => createPlayer(u, i, 'RED')),
      bans: { blue: [], red: [] },
      startTime: currentTime, 
      duration: 3600, 
      currentDuration: 0, 
      score: { blue: 0, red: 0 }, 
      stats: {
        blue: { towers: { top: 0, mid: 0, bot: 0 }, colossus: 0, watcher: 0, fury: 0, nexusHp: blueHp, maxNexusHp: blueHp, activeBuffs: { siegeUnit: false, voidPower: false } },
        red: { towers: { top: 0, mid: 0, bot: 0 }, colossus: 0, watcher: 0, fury: 0, nexusHp: redHp, maxNexusHp: redHp, activeBuffs: { siegeUnit: false, voidPower: false } }
      },
      timeline: [], 
      avgTier: getTierNameHelper(batch[0].score, config),
      logs: [], 
      nextColossusSpawnTime: colossusRespawn, 
      nextWatcherSpawnTime: 900,
      objectives: {
        colossus: { hp: 0, maxHp: colossusHp, status: 'DEAD', nextSpawnTime: colossusRespawn },
        watcher: { hp: 0, maxHp: watcherHp, status: 'DEAD', nextSpawnTime: 900 }
      }
    });
  }
  return newMatches;
}