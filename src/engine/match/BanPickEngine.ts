// ==========================================
// FILE PATH: /src/engine/match/BanPickEngine.ts
// ==========================================

import { Hero, LiveMatch } from '../../types';

// 영웅 분석 헬퍼 (안전장치 포함)
const analyzeHeroTags = (h: Hero) => {
  if (!h || !h.skills) return { hasCC: false, hasDash: false, hasShield: false, hasExecute: false, isTank: false, isSquishy: false, isBurst: false };
  
  const skills = [h.skills.q, h.skills.w, h.skills.e, h.skills.r];
  return {
    hasCC: skills.some(s => s.mechanic === 'STUN' || s.mechanic === 'HOOK'),
    hasDash: skills.some(s => s.mechanic === 'DASH'),
    hasShield: skills.some(s => s.mechanic === 'SHIELD' || s.mechanic === 'HEAL'),
    hasExecute: skills.some(s => s.mechanic === 'EXECUTE'),
    isTank: h.stats.hp >= 2500 || h.stats.armor >= 50,
    isSquishy: h.stats.hp < 1800,
    isBurst: h.stats.ad > 80 || h.stats.ap > 80
  };
};

/**
 * [단일 턴 처리] 스네이크 방식(ㄹ자) 픽 적용
 * @param userIq : 뇌지컬 수치 (0~100)
 */
export const processDraftTurn = (match: LiveMatch, heroes: Hero[], userIq: number) => {
  if (!match.draft) return;
  const { turnIndex } = match.draft;

  // [안전장치] 영웅 데이터가 없으면 중단
  if (!heroes || heroes.length === 0) return;

  const unavailableIds = new Set<string>();
  [...match.bans.blue, ...match.bans.red].forEach(id => unavailableIds.add(id));
  // heroId가 있는 경우(이미 픽된 경우)만 제외
  [...match.blueTeam, ...match.redTeam].forEach(p => { if(p.heroId) unavailableIds.add(p.heroId); });

  // ----------------------------------------------------
  // A. 밴 페이즈 (0~9턴) - 기존 유지 (교차 밴)
  // ----------------------------------------------------
  if (turnIndex < 10) {
    const candidates = heroes.filter(h => !unavailableIds.has(h.id));
    if (candidates.length === 0) return; // 밴 할 영웅이 없으면 패스

    // 승률 상위 20% 중에서 랜덤 밴
    candidates.sort((a, b) => b.recentWinRate - a.recentWinRate);
    const targetPool = candidates.slice(0, Math.max(5, candidates.length / 5));
    const banTarget = targetPool[Math.floor(Math.random() * targetPool.length)];

    if (banTarget) {
      if (turnIndex % 2 === 0) match.bans.blue.push(banTarget.id);
      else match.bans.red.push(banTarget.id);
    }
    return;
  }

  // ----------------------------------------------------
  // B. 픽 페이즈 (10~19턴) - [변경] 스네이크 방식 적용
  // ----------------------------------------------------
  const pickOrderIndex = turnIndex - 10;

  // [스네이크 픽 순서 정의]
  // 0: Blue Team, 1: Red Team
  // 순서: B -> R -> R -> B -> B -> R -> R -> B -> B -> R
  const SNAKE_ORDER = [0, 1, 1, 0, 0, 1, 1, 0, 0, 1];
  
  // [팀 내 슬롯 인덱스 매핑]
  // 각 픽이 팀의 몇 번째 선수(0~4)인지 결정
  const TEAM_SLOT_MAP = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4]; 

  // 배열 범위 안전 체크
  if (pickOrderIndex >= SNAKE_ORDER.length) return;

  const isBluePick = SNAKE_ORDER[pickOrderIndex] === 0;
  const teamIndex = TEAM_SLOT_MAP[pickOrderIndex];

  const targetTeam = isBluePick ? match.blueTeam : match.redTeam;
  const enemyTeam = isBluePick ? match.redTeam : match.blueTeam;
  
  // [안전장치] 플레이어가 없으면 중단
  if (!targetTeam || !targetTeam[teamIndex]) return;
  
  const player = targetTeam[teamIndex]; 
  const lane = player.lane; 

  // 역할군 필터
  const preferredRoles: Record<string, string[]> = {
    'TOP': ['집행관', '수호기사'],
    'JUNGLE': ['추적자', '집행관'],
    'MID': ['선지자', '추적자', '신살자'], 
    'BOT': ['신살자'], 
    'SUP': ['수호기사', '선지자']
  };

  // 5번째 픽(인덱스4)은 보통 서포터 포지션으로 간주하거나 라인에 맞춤
  const roleKey = (teamIndex === 4) ? 'SUP' : lane; 
  const targetRoles = preferredRoles[roleKey] || ['집행관'];

  let candidates = heroes.filter(h => 
    !unavailableIds.has(h.id) && targetRoles.includes(h.role)
  );
  
  // 후보가 없으면 전체 영웅에서 다시 검색
  if (candidates.length === 0) {
    candidates = heroes.filter(h => !unavailableIds.has(h.id));
  }

  // [안전장치] 그래도 후보가 없으면 아무나(첫번째 영웅) 강제 할당 후 종료
  if (candidates.length === 0) {
     if (heroes.length > 0) player.heroId = heroes[0].id;
     return;
  }

  // ----------------------------------------------------
  // [뇌지컬 로직]
  // ----------------------------------------------------
  let pickedHeroId: string = candidates[0].id; // 기본값

  if (userIq >= 70) {
    // [고지능] 전략적 계산 (카운터 + 시너지)
    const scored = candidates.map(hero => {
      let score = hero.recentWinRate * 10;
      const myTags = analyzeHeroTags(hero);

      // 카운터 점수
      enemyTeam.forEach(e => {
        if (!e.heroId) return;
        const eHero = heroes.find(h => h.id === e.heroId);
        if (!eHero) return;
        const eTags = analyzeHeroTags(eHero);

        if (eTags.isSquishy && myTags.hasDash && myTags.isBurst) score += 150; // 암살
        if (eTags.hasCC && (myTags.hasDash || myTags.hasShield)) score += 80; // 생존
        if (eTags.isTank && myTags.hasExecute) score += 120; // 탱커킬
      });

      // 시너지 점수
      targetTeam.forEach(a => {
        if (!a.heroId || a === player) return;
        const aHero = heroes.find(h => h.id === a.heroId);
        if (!aHero) return;
        const aTags = analyzeHeroTags(aHero);

        if (aTags.hasCC && myTags.isBurst) score += 100; // CC연계
        if (aTags.isTank && myTags.isSquishy) score += 60; // 보호
      });

      return { hero, score };
    });

    scored.sort((a, b) => b.score - a.score);
    // [안전장치] 배열 접근 체크
    if (scored.length > 0) pickedHeroId = scored[0].hero.id;

  } 
  else if (userIq >= 40) {
    // [일반] 승률 높은거 픽
    candidates.sort((a, b) => b.recentWinRate - a.recentWinRate);
    if (candidates.length > 0) pickedHeroId = candidates[0].id;
  } 
  else {
    // [즐겜] 랜덤 픽
    const randomPick = candidates[Math.floor(Math.random() * candidates.length)];
    if (randomPick) pickedHeroId = randomPick.id;
  }

  player.heroId = pickedHeroId;
};
