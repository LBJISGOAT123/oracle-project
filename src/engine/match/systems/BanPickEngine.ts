// ==========================================
// FILE PATH: /src/engine/match/systems/BanPickEngine.ts
// ==========================================

import { Hero, LiveMatch } from '../../../types';

// 영웅 태그 분석 (카운터/시너지 계산용)
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

export const processDraftTurn = (match: LiveMatch, heroes: Hero[], userIq: number) => {
  if (!match.draft) return;
  const { turnIndex } = match.draft;

  // 1. 이미 밴/픽된 영웅 목록 (중복 방지)
  const unavailableIds = new Set<string>();
  [...match.bans.blue, ...match.bans.red].forEach(id => unavailableIds.add(id));
  [...match.blueTeam, ...match.redTeam].forEach(p => { if(p.heroId) unavailableIds.add(p.heroId); });

  // ----------------------------------------------------
  // A. 밴 페이즈 (0~9턴)
  // ----------------------------------------------------
  if (turnIndex < 10) {
    const candidates = heroes.filter(h => !unavailableIds.has(h.id));
    if (candidates.length === 0) return;

    // 승률 높은 영웅(OP) 위주로 밴
    candidates.sort((a, b) => b.recentWinRate - a.recentWinRate);
    
    // [개선] 상위 15개 중 랜덤 밴 (너무 고정되지 않게 범위 확대)
    const banPoolSize = Math.min(candidates.length, 15);
    const banTarget = candidates[Math.floor(Math.random() * banPoolSize)];

    if (banTarget) {
      if (turnIndex % 2 === 0) {
          match.bans.blue.push(banTarget.id);
      } else {
          match.bans.red.push(banTarget.id);
      }
    }
    return;
  }

  // ----------------------------------------------------
  // B. 픽 페이즈 (10~19턴)
  // ----------------------------------------------------
  const pickOrderIndex = turnIndex - 10;
  // 스네이크 픽 순서
  const SNAKE_ORDER = [0, 1, 1, 0, 0, 1, 1, 0, 0, 1]; 
  const TEAM_SLOT_MAP = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4]; 

  if (pickOrderIndex >= SNAKE_ORDER.length) return;

  const isBluePick = SNAKE_ORDER[pickOrderIndex] === 0;
  const teamIndex = TEAM_SLOT_MAP[pickOrderIndex];
  
  const targetTeam = isBluePick ? match.blueTeam : match.redTeam;
  const enemyTeam = isBluePick ? match.redTeam : match.blueTeam; 
  
  if (!targetTeam || !targetTeam[teamIndex]) return;
  const player = targetTeam[teamIndex]; 
  
  if (player.heroId) return;

  // 역할군 필터
  const roleKey = (teamIndex === 4) ? 'SUP' : player.lane; 
  const preferredRoles: Record<string, string[]> = {
    'TOP': ['집행관', '수호기사'],
    'JUNGLE': ['추적자', '집행관'],
    'MID': ['선지자', '추적자', '신살자'], 
    'BOT': ['신살자'], 
    'SUP': ['수호기사', '선지자']
  };
  const targetRoles = preferredRoles[roleKey] || ['집행관'];

  let candidates = heroes.filter(h => !unavailableIds.has(h.id) && targetRoles.includes(h.role));
  
  // 후보 없으면 전체에서 검색
  if (candidates.length === 0) candidates = heroes.filter(h => !unavailableIds.has(h.id));
  if (candidates.length === 0 && heroes.length > 0) candidates = [heroes[0]];

  // ----------------------------------------------------
  // [개선된] 픽 로직
  // ----------------------------------------------------
  let pickedHeroId = candidates[0].id;

  // 1. [장인/즐겜 모드] (20% 확률): 성능 무관하게 무작위 픽
  // 승률이 낮아도 애정으로 하는 유저들을 시뮬레이션
  const isOneTrickPony = Math.random() < 0.2;

  if (isOneTrickPony) {
      const randomPick = candidates[Math.floor(Math.random() * candidates.length)];
      if (randomPick) pickedHeroId = randomPick.id;
  } 
  else if (userIq >= 70) {
    // 2. [고수/천상계] (IQ 높음): 철저한 상성/조합 계산
    const scored = candidates.map(hero => {
      let score = hero.recentWinRate * 10;
      const myTags = analyzeHeroTags(hero);

      // (1) 적 카운터 점수
      enemyTeam.forEach(e => {
        if (!e.heroId) return;
        const eHero = heroes.find(h => h.id === e.heroId);
        if (!eHero) return;
        const eTags = analyzeHeroTags(eHero);

        if (eTags.isSquishy && myTags.hasDash && myTags.isBurst) score += 150; // 암살 가능
        if (eTags.hasCC && (myTags.hasDash || myTags.hasShield)) score += 80; // 생존 용이
        if (eTags.isTank && myTags.hasExecute) score += 120; // 탱커 처리
      });

      // (2) 아군 시너지 점수
      targetTeam.forEach(a => {
        if (!a.heroId || a === player) return;
        const aHero = heroes.find(h => h.id === a.heroId);
        if (!aHero) return;
        const aTags = analyzeHeroTags(aHero);

        if (aTags.hasCC && myTags.isBurst) score += 100; // CC연계
        if (aTags.isTank && myTags.isSquishy) score += 60; // 보호 받음
      });

      return { hero, score };
    });

    // 점수 높은 순 정렬
    scored.sort((a, b) => b.score - a.score);
    
    // 최상위 1~2개 중 하나 선택 (고수도 가끔 실수하거나 취향 탐)
    const topPicks = scored.slice(0, 2);
    const chosen = topPicks[Math.floor(Math.random() * topPicks.length)];
    if (chosen) pickedHeroId = chosen.hero.id;

  } else {
    // 3. [일반 유저] (IQ 낮음): 승률 위주지만, 폭넓게 선택
    candidates.sort((a, b) => b.recentWinRate - a.recentWinRate);
    
    // [개선] 상위 3개가 아니라 상위 50% 안에서 랜덤 선택
    // 예: 후보가 10명이면 1~5등 안에서 랜덤 (4, 5등 챔피언도 선택될 기회 부여)
    const pickPoolSize = Math.max(3, Math.ceil(candidates.length * 0.5));
    const chosen = candidates[Math.floor(Math.random() * pickPoolSize)];
    if (chosen) pickedHeroId = chosen.id;
  }

  player.heroId = pickedHeroId;
};