// ==========================================
// FILE PATH: /src/engine/match/BanPickEngine.ts
// ==========================================

import { Hero, LiveMatch } from '../../types';

// 영웅 분석 헬퍼
const analyzeHeroTags = (h: Hero) => {
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
 * [단일 턴 처리] 현재 순서의 유저가 밴 또는 픽을 수행함
 * @param userIq : 뇌지컬 수치 (0~100)
 */
export const processDraftTurn = (match: LiveMatch, heroes: Hero[], userIq: number) => {
  if (!match.draft) return;
  const { turnIndex } = match.draft;

  const unavailableIds = new Set<string>();
  [...match.bans.blue, ...match.bans.red].forEach(id => unavailableIds.add(id));
  [...match.blueTeam, ...match.redTeam].forEach(p => { if(p.heroId) unavailableIds.add(p.heroId); });

  // A. 밴 페이즈 (0~9턴)
  if (turnIndex < 10) {
    const candidates = heroes.filter(h => !unavailableIds.has(h.id));
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

  // B. 픽 페이즈 (10~19턴)
  const pickOrderIndex = turnIndex - 10;

  // 픽 순서: 교차 픽 (단순화: B1->R1->B2->R2...)
  const isBluePick = pickOrderIndex % 2 === 0;
  const teamIndex = Math.floor(pickOrderIndex / 2); // 0~4

  const targetTeam = isBluePick ? match.blueTeam : match.redTeam;
  const enemyTeam = isBluePick ? match.redTeam : match.blueTeam;
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

  const roleKey = (teamIndex === 4) ? 'SUP' : lane; 
  const targetRoles = preferredRoles[roleKey] || ['집행관'];

  let candidates = heroes.filter(h => 
    !unavailableIds.has(h.id) && targetRoles.includes(h.role)
  );
  if (candidates.length === 0) candidates = heroes.filter(h => !unavailableIds.has(h.id));

  // ----------------------------------------------------
  // [뇌지컬 로직]
  // ----------------------------------------------------
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
    player.heroId = scored[0].hero.id;
  } 
  else if (userIq >= 40) {
    // [일반] 승률 높은거 픽
    candidates.sort((a, b) => b.recentWinRate - a.recentWinRate);
    player.heroId = candidates[0].id;
  } 
  else {
    // [즐겜] 랜덤 픽
    const randomPick = candidates[Math.floor(Math.random() * candidates.length)];
    player.heroId = randomPick.id;
  }
};