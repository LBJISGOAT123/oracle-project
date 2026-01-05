// ==========================================
// FILE PATH: /src/engine/match/MatchSettlement.ts
// ==========================================

import { Hero, LiveMatch, LivePlayer, TierConfig } from '../../types';
import { userPool } from '../system/UserManager';

// 다음 티어 정보 반환 (이름, 컷, 승급전 설정 키)
const getNextTierInfo = (currentScore: number, config: TierConfig) => {
  if (currentScore < config.bronze) return { name: '브론즈', cut: config.bronze, key: 'bronze' };
  if (currentScore < config.silver) return { name: '실버', cut: config.silver, key: 'silver' };
  if (currentScore < config.gold) return { name: '골드', cut: config.gold, key: 'gold' };
  if (currentScore < config.joker) return { name: '조커', cut: config.joker, key: 'joker' };
  if (currentScore < config.ace) return { name: '에이스', cut: config.ace, key: 'ace' };
  if (currentScore < config.master) return { name: '마스터', cut: config.master, key: 'master' };
  return null; 
};

export function finishMatch(
  match: LiveMatch, 
  heroes: Hero[], 
  day: number, 
  hour: number, 
  battleSettings: any,
  tierConfig: TierConfig
) {

  let isBlueWin = match.score.blue > match.score.red;
  // 넥서스 파괴 여부로 승패 확정
  if (match.stats.red.nexusHp <= 0) isBlueWin = true;       
  else if (match.stats.blue.nexusHp <= 0) isBlueWin = false; 

  const blueKills = match.blueTeam.reduce((sum, p) => sum + p.kills, 0);
  const redKills = match.redTeam.reduce((sum, p) => sum + p.kills, 0);

  const participantNames = new Set([...match.blueTeam, ...match.redTeam].map(p => p.name));

  // 참여 유저 휴식 처리
  userPool.forEach(u => {
    if (participantNames.has(u.name)) {
      u.status = 'RESTING';
      u.restTimer = 5 + Math.floor(Math.random() * 5); 
    }
  });

  // =========================================================
  // [누락되었던 부분 추가] 밴 통계 업데이트
  // =========================================================
  const allBans = [...match.bans.blue, ...match.bans.red];
  allBans.forEach(banId => {
    if (banId) {
        const hero = heroes.find(h => h.id === banId);
        if (hero) {
            hero.record.totalBans++; // 밴 횟수 증가
        }
    }
  });

  const processTeam = (team: LivePlayer[], win: boolean) => {
    team.forEach(player => {
      const hero = heroes.find(h => h.id === player.heroId);
      const user = userPool.find(u => u.name === player.name) as any;

      // 1. 영웅 통계 갱신 (누적)
      if (hero) {
        hero.record.totalMatches++; 
        hero.record.totalPicks++; 
        if (win) hero.record.totalWins++;

        hero.record.totalKills += player.kills; 
        hero.record.totalDeaths += player.deaths; 
        hero.record.totalAssists += player.assists; 

        // 아이템 가치 합산
        const itemsValue = player.items.reduce((sum, item) => sum + item.cost, 0);
        hero.record.totalGold += (player.gold + itemsValue);
        hero.record.totalDamage += player.totalDamageDealt || 0; 
        hero.record.totalCs += player.cs;

        // 최근 전적
        hero.record.recentResults.push(win); 
        if (hero.record.recentResults.length > 1000) {
            hero.record.recentResults.shift();
        }
      }

      // 2. 유저 점수 및 승급전 처리
      if (user) {
        user.wins += win ? 1 : 0; 
        user.losses += win ? 0 : 1;

        let lpChange = win ? 25 : -20;
        let kdaStr = `${player.kills}/${player.deaths}/${player.assists}`;
        let historyMsg = win ? 'WIN' : 'LOSE';

        // --- [A] 승급전 진행 중일 때 ---
        if (user.promoStatus) {
            lpChange = 0; // 점수 변동 없음

            if (win) {
                user.promoStatus.wins++;
                historyMsg = 'PROMO WIN';
                // 승급 성공 조건
                if (user.promoStatus.wins >= user.promoStatus.targetWins) {
                    const nextTier = getNextTierInfo(user.score, tierConfig);
                    if (nextTier) {
                        user.score = nextTier.cut + 50; // 승급 보너스
                        historyMsg = `🎉 승급! (${nextTier.name})`;
                    }
                    user.promoStatus = null;
                }
            } else {
                user.promoStatus.losses++;
                historyMsg = 'PROMO LOSS';

                // 탈락 조건
                const totalGames = user.promoStatus.targetWins * 2 - 1;
                const maxLosses = totalGames - user.promoStatus.targetWins + 1;

                if (user.promoStatus.losses >= maxLosses) {
                    user.score -= 40; // 승급 실패 패널티
                    historyMsg = '❌ 승급 실패';
                    user.promoStatus = null;
                }
            }
        } 
        // --- [B] 일반 매치일 때 ---
        else {
            const oldScore = user.score;
            user.score = Math.max(0, user.score + lpChange);

            // 승급전 발동 체크
            const nextTier = getNextTierInfo(oldScore, tierConfig);
            if (nextTier && user.score >= nextTier.cut) {
                user.score = nextTier.cut - 1; // 점수 잠금

                // 티어별 승급전 판수 적용 (기본 3판)
                const promoMatches = tierConfig.promos ? (tierConfig.promos[nextTier.key as keyof typeof tierConfig.promos] || 3) : 3;
                const targetWins = Math.ceil(promoMatches / 2);

                user.promoStatus = {
                    targetTier: nextTier.name,
                    wins: 0,
                    losses: 0,
                    targetWins: targetWins
                };
                historyMsg = `🔥 ${nextTier.name} 승급전! (${promoMatches}전)`;
            }
        }

        user.history.unshift({ 
          season: 1, 
          result: historyMsg as any, 
          heroName: hero?.name || '?', 
          kda: kdaStr, 
          lpChange: lpChange, 
          date: `Day ${day} ${hour}:00` 
        });
        if (user.history.length > 20) user.history.pop();

        // 모스트 챔피언 통계 갱신
        if (!user.heroStats[player.heroId]) user.heroStats[player.heroId] = { matches:0, wins:0, kills:0, deaths:0, assists:0 };
        const st = user.heroStats[player.heroId];
        st.matches++; if(win) st.wins++; st.kills+=player.kills; st.deaths+=player.deaths; st.assists+=player.assists;
      }
    });
  };

  processTeam(match.blueTeam, isBlueWin);
  processTeam(match.redTeam, !isBlueWin);

  return { isBlueWin, blueKills, redKills, duration: match.currentDuration };
}