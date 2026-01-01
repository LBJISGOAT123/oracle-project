// ==========================================
// FILE PATH: /src/engine/match/BanPickEngine.ts
// ==========================================

import { Hero } from '../../types';

export const performBanPick = (heroes: Hero[], players: any[]) => {
  const bans: { blue: string[], red: string[] } = { blue: [], red: [] };
  const picks: { blue: any[], red: any[] } = { blue: [], red: [] };
  const unavailableIds = new Set<string>();

  // 1. 밴 페이즈 개선
  // 승률 최상위권만 밴 당하는 것이 아니라, "상위 30% + 랜덤"이 섞이도록 수정
  const sortedHeroes = [...heroes].sort((a, b) => b.recentWinRate - a.recentWinRate);

  const attemptBan = (sideBans: string[]) => {
    // 밴 후보군을 상위 15명이 아니라 전체의 40%까지 넓게 봅니다.
    const banPoolSize = Math.max(10, Math.floor(heroes.length * 0.4));
    const banCandidates = sortedHeroes.slice(0, banPoolSize).filter(h => !unavailableIds.has(h.id));

    if (banCandidates.length > 0) {
      // 후보군 중에서 랜덤 선택 (무조건 1등만 밴하지 않음)
      const target = banCandidates[Math.floor(Math.random() * banCandidates.length)];
      sideBans.push(target.id);
      unavailableIds.add(target.id);
    }
  };

  // 블루팀 2밴, 레드팀 2밴
  attemptBan(bans.blue);
  attemptBan(bans.blue);
  attemptBan(bans.red);
  attemptBan(bans.red);

  // 2. 픽 페이즈 개선 (다양성 확보 핵심 로직)
  const selectHero = (user: any) => {
    // 이미 밴/픽된 영웅 제외한 목록
    const available = heroes.filter(h => !unavailableIds.has(h.id));

    // 만약 남은 영웅이 없으면(거의 없겠지만) 아무나 리턴
    if (available.length === 0) return heroes[0].id;

    const rand = Math.random();
    let selectedHeroId = '';

    // [전략 A] "즐겜/뉴메타" 픽 (30% 확률)
    // -> 승률 무시하고 완전 랜덤으로 픽합니다. 
    // -> 이 로직 덕분에 0% 픽률인 영웅들이 강제로 게임에 참여하게 됩니다.
    if (rand < 0.3) {
      const randomPick = available[Math.floor(Math.random() * available.length)];
      selectedHeroId = randomPick.id;
    }
    // [전략 B] "주류 메타" 픽 (50% 확률)
    // -> 기존에는 상위 4명만 뽑았지만, 이제는 "상위 60%" 중에서 랜덤으로 뽑습니다.
    // -> 1티어뿐만 아니라 2~3티어도 자주 나오게 됩니다.
    else if (rand < 0.8) {
      const sortedByWin = [...available].sort((a, b) => b.recentWinRate - a.recentWinRate);
      const metaPoolSize = Math.max(5, Math.floor(sortedByWin.length * 0.6)); // 상위 60%
      const metaPool = sortedByWin.slice(0, metaPoolSize);

      const metaPick = metaPool[Math.floor(Math.random() * metaPool.length)];
      selectedHeroId = metaPick.id;
    }
    // [전략 C] "장인/애정" 픽 (나머지 20%)
    // -> 그냥 남은 것 중 또 랜덤 (결과적으로 랜덤성이 50% 가까이 됨)
    else {
      const randomPick = available[Math.floor(Math.random() * available.length)];
      selectedHeroId = randomPick.id;
    }

    unavailableIds.add(selectedHeroId);
    return selectedHeroId;
  };

  // 블루팀 5명 픽, 레드팀 5명 픽
  players.slice(0, 5).forEach(u => picks.blue.push({ name: u.name, heroId: selectHero(u) }));
  players.slice(5, 10).forEach(u => picks.red.push({ name: u.name, heroId: selectHero(u) }));

  return { bans, picks };
};