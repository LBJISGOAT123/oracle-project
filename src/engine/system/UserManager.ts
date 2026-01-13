import { Hero, UserProfile, TierConfig } from '../../types';
import { generateUserName } from '../../utils/nameGenerator';

const registeredNames = new Set<string>();

const HOURLY_ACTIVITY_RATES = [
  0.15, 0.10, 0.05, 0.03, 0.02, 0.05, 
  0.10, 0.15, 0.20, 0.25, 0.25, 0.30, 
  0.35, 0.35, 0.40, 0.40, 0.45, 0.50, 
  0.55, 0.60, 0.65, 0.60, 0.50, 0.40 
];

// 전역 유저 데이터 저장소 (순수 배열)
export let userPool: UserProfile[] = [];

// [로드용] 유저 풀 데이터 교체
export function replaceUserPool(newUsers: UserProfile[]) {
  userPool = newUsers;
}

// 1. 유저 생성 로직 (데이터만 반환)
export function createUser(id: number, heroes: Hero[]): UserProfile {
  let tempName = generateUserName(id);
  if (!registeredNames.has(tempName)) {
      registeredNames.add(tempName);
  } else {
      tempName = `${tempName}#${id}`;
  }

  const hiddenMmr = 1000 + Math.floor(Math.random() * 2000);
  const mmrFactor = (hiddenMmr - 1000) / 2000;
  const baseStat = 20 + (mmrFactor * 40) + (Math.random() * 20); 

  // 피지컬/뇌지컬 랜덤 설정
  let brain = 50, mechanics = 50;
  const typeRand = Math.random();
  if (typeRand < 0.2) { brain = baseStat * 0.8; mechanics = baseStat * 1.3; } 
  else if (typeRand < 0.4) { brain = baseStat * 1.3; mechanics = baseStat * 0.8; } 
  else { brain = baseStat; mechanics = baseStat; }

  brain = Math.min(100, Math.max(10, Math.floor(brain)));
  mechanics = Math.min(100, Math.max(10, Math.floor(mechanics)));

  const lanes = ['TOP', 'JUNGLE', 'MID', 'BOT'];
  const preferredLane = lanes[Math.floor(Math.random() * lanes.length)] as any;

  // 선호 영웅 설정
  let preferredHeroes: string[] = [];
  if (heroes && heroes.length > 0) {
    const myRoleHeroes = heroes.filter(h => isHeroForLane(h, preferredLane));
    const poolSize = Math.min(myRoleHeroes.length, 3);
    preferredHeroes = myRoleHeroes.slice(0, poolSize).map(h => h.id);
    if (preferredHeroes.length === 0) preferredHeroes = [heroes[0].id];
  }

  return {
    id,
    name: tempName,
    score: 0,
    hiddenMmr,
    tier: '아이언',
    rank: 0,
    isChallenger: false,
    winRate: 0,
    totalGames: 0,
    wins: 0,
    losses: 0,
    mainHeroId: preferredHeroes[0] || '',
    preferredLane,
    preferredHeroes,
    brain,
    mechanics,
    activityBias: (Math.random() * 0.2) - 0.1,
    status: 'OFFLINE',
    restTimer: 0,
    history: [],
    heroStats: {},
    promoStatus: null,
    mostChamps: [],
    laneStats: []
  };
}

// 2. 헬퍼 함수: 라인에 맞는 영웅인지
function isHeroForLane(hero: Hero, lane: string) {
  if (lane === 'TOP') return hero.role === '수호기사' || hero.role === '집행관';
  if (lane === 'MID') return hero.role === '선지자' || hero.role === '추적자';
  if (lane === 'BOT') return hero.role === '신살자';
  if (lane === 'JUNGLE') return hero.role === '추적자' || hero.role === '집행관';
  return true;
}

// 3. 헬퍼 함수: 티어 이름 계산 (UserAgent.getTierName 대체)
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

// 4. 헬퍼 함수: 영웅 픽 (UserAgent.pickHero 대체)
export function userPickHero(user: UserProfile, heroes: Hero[]): string {
  if (Math.random() < 0.7 && user.preferredHeroes.length > 0) {
    return user.preferredHeroes[Math.floor(Math.random() * user.preferredHeroes.length)];
  }
  if (heroes.length > 0) return heroes[Math.floor(Math.random() * heroes.length)].id;
  return '';
}

// 5. 헬퍼 함수: 접속 여부 판단 (UserAgent.shouldBeOnline 대체)
export function userShouldBeOnline(user: UserProfile, hour: number): boolean {
  const baseRate = HOURLY_ACTIVITY_RATES[hour] || 0.3;
  const finalRate = Math.min(0.95, Math.max(0.01, baseRate + user.activityBias));
  return Math.random() < finalRate;
}

// 초기화
export function initUserPool(heroes: Hero[], count: number = 3000) {
  const startId = userPool.length;
  if (count > userPool.length) {
    const newUsersCount = count - userPool.length;
    for(let i=0; i<newUsersCount; i++) {
        userPool.push(createUser(startId + i, heroes));
    }
  }
}

// 상태 업데이트
export function updateUserActivity(hour: number, heroes: Hero[]) {
  userPool.forEach(u => {
    if (u.status === 'INGAME') return; 
    if (u.status === 'RESTING') {
      u.restTimer -= 1;
      if (u.restTimer <= 0) u.status = 'IDLE';
      return;
    }
    const wantsToPlay = userShouldBeOnline(u, hour);
    if (u.status === 'OFFLINE' && wantsToPlay) u.status = 'IDLE'; 
    else if ((u.status === 'IDLE' || u.status === 'QUEUE') && !wantsToPlay) {
        if (Math.random() < 0.2) u.status = 'OFFLINE';
    }
  });
}

// 랭킹 조회
export function getTopRankers(heroes: Hero[], config: TierConfig): UserProfile[] {
  const sorted = [...userPool].sort((a, b) => b.score - a.score || a.id - b.id);
  
  // 상위 50명만 리턴
  return sorted.slice(0, 50).map(u => {
    // 실시간 티어 계산하여 주입
    return {
        ...u,
        tier: getUserTierName(u, config)
    };
  });
}

// 특정 티어 유저 조회
export function getUsersInTier(tierName: string, config: TierConfig): UserProfile[] {
  return userPool
    .filter(u => getUserTierName(u, config) === tierName)
    .sort((a, b) => b.score - a.score);
}

// 이름으로 찾기
export function findUserProfileByName(name: string, config: TierConfig): UserProfile | null {
  const user = userPool.find(u => u.name === name);
  if (!user) return null;
  return { ...user, tier: getUserTierName(user, config) };
}

// 단순 스코어 기반 티어 이름 (유저 객체 없을 때용)
export function getTierNameHelper(score: number, config: TierConfig) {
  return getUserTierName({ score, isChallenger: false } as UserProfile, config);
}
