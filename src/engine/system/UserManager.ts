import { Hero, UserProfile, TierConfig, PlayStyle } from '../../types';
import { generateUserName } from '../../utils/nameGenerator';

const registeredNames = new Set<string>();
export let userPool: UserProfile[] = [];

export function replaceUserPool(newUsers: UserProfile[]) {
  userPool = newUsers;
}

export function createUser(id: number, heroes: Hero[]): UserProfile {
  let tempName = generateUserName(id);
  if (!registeredNames.has(tempName)) registeredNames.add(tempName);
  else tempName = `${tempName}#${id}`;

  const hiddenMmr = 1000 + Math.floor(Math.random() * 2000);
  const mmrFactor = (hiddenMmr - 1000) / 2000;
  const baseStat = 20 + (mmrFactor * 40) + (Math.random() * 20); 

  let brain = 50, mechanics = 50;
  if (Math.random() < 0.5) { brain = baseStat * 1.2; mechanics = baseStat * 0.8; } 
  else { brain = baseStat * 0.8; mechanics = baseStat * 1.2; }
  brain = Math.min(100, Math.max(10, Math.floor(brain)));
  mechanics = Math.min(100, Math.max(10, Math.floor(mechanics)));

  const lanes = ['TOP', 'JUNGLE', 'MID', 'BOT'];
  const preferredLane = lanes[Math.floor(Math.random() * lanes.length)] as any;

  let preferredHeroes: string[] = [];
  if (heroes && heroes.length > 0) {
    const myRoleHeroes = heroes.filter(h => isHeroForLane(h, preferredLane));
    const poolSize = Math.min(myRoleHeroes.length, 3);
    preferredHeroes = myRoleHeroes.slice(0, poolSize).map(h => h.id);
    if (preferredHeroes.length === 0) preferredHeroes = [heroes[0].id];
  }

  // [핵심] 현실적인 성향 비율 할당
  const rand = Math.random();
  let style: PlayStyle = 'WORKER'; // 기본: 직장인 (40%)
  if (rand < 0.4) style = 'WORKER';
  else if (rand < 0.7) style = 'STUDENT'; // 학생 (30%)
  else if (rand < 0.85) style = 'NIGHT_OWL'; // 올빼미 (15%)
  else style = 'HARDCORE'; // 폐인 (15%)

  return {
    id, name: tempName, score: 0, hiddenMmr, tier: '아이언', rank: 0, isChallenger: false,
    winRate: 0, totalGames: 0, wins: 0, losses: 0,
    mainHeroId: preferredHeroes[0] || '', preferredLane, preferredHeroes,
    brain, mechanics,
    
    // 신규 속성 초기화
    playStyle: style, 
    activityBias: (Math.random() * 0.4) - 0.2, // -0.2 ~ +0.2 (활동성 편차)
    tiredness: 0, 
    sessionTarget: 3,

    status: 'OFFLINE', restTimer: 0, history: [], heroStats: {}, promoStatus: null,
    mostChamps: [], laneStats: []
  };
}

function isHeroForLane(hero: Hero, lane: string) {
  if (lane === 'TOP') return hero.role === '수호기사' || hero.role === '집행관';
  if (lane === 'MID') return hero.role === '선지자' || hero.role === '추적자';
  if (lane === 'BOT') return hero.role === '신살자';
  if (lane === 'JUNGLE') return hero.role === '추적자' || hero.role === '집행관';
  return true;
}

export function getUserTierName(user: UserProfile, config: TierConfig) {
  const cfg = config || { challengerRank:50, master:4800, ace:3800, joker:3200, gold:2100, silver:1300, bronze:300 };
  if (user.isChallenger) return '천상계';
  if (user.score >= cfg.master) return '마스터';
  if (user.score >= cfg.ace) return '에이스';
  if (user.score >= cfg.joker) return '조커';
  if (user.score >= cfg.gold) return '골드';
  if (user.score >= cfg.silver) return '실버';
  if (user.score >= cfg.bronze) return '브론즈';
  return '아이언';
}

export function initUserPool(heroes: Hero[], count: number = 3000) {
  const startId = userPool.length;
  if (count > userPool.length) {
    const newUsersCount = count - userPool.length;
    for(let i=0; i<newUsersCount; i++) userPool.push(createUser(startId + i, heroes));
  }
}

// 구버전 호환용 (사용 안함)
export function updateUserActivity(hour: number, heroes: Hero[]) {}

export function getTopRankers(heroes: Hero[], config: TierConfig): UserProfile[] {
  const sorted = [...userPool].sort((a, b) => b.score - a.score || a.id - b.id);
  return sorted.slice(0, 50).map(u => ({ ...u, tier: getUserTierName(u, config) }));
}

export function getUsersInTier(tierName: string, config: TierConfig): UserProfile[] {
  return userPool
    .filter(u => getUserTierName(u, config) === tierName)
    .sort((a, b) => b.score - a.score);
}

export function findUserProfileByName(name: string, config: TierConfig): UserProfile | null {
  const user = userPool.find(u => u.name === name);
  if (!user) return null;
  return { ...user, tier: getUserTierName(user, config) };
}

export function getTierNameHelper(score: number, config: TierConfig) {
  return getUserTierName({ score, isChallenger: false } as UserProfile, config);
}
