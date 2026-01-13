import { Hero, LiveMatch, LivePlayer, TierConfig } from '../../types';
import { userPool } from '../system/UserManager';

const getNextTierInfo = (currentScore: number, config: TierConfig) => {
  // Config가 없으면 기본값 사용
  if (!config) return null;
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
  // [Safety] 필수 데이터 검증
  if (!match || !match.stats || !match.score) return { isBlueWin: false, blueKills: 0, redKills: 0, duration: 0 };

  let isBlueWin = match.score.blue > match.score.red;
  if (match.stats.red.nexusHp <= 0) isBlueWin = true;       
  else if (match.stats.blue.nexusHp <= 0) isBlueWin = false; 

  const blueKills = match.blueTeam.reduce((sum, p) => sum + (p.kills || 0), 0);
  const redKills = match.redTeam.reduce((sum, p) => sum + (p.kills || 0), 0);

  // [Safety] 유저 풀이 비어있으면 정산 중단
  if (!userPool) return { isBlueWin, blueKills, redKills, duration: match.currentDuration };

  const participantNames = new Set([...match.blueTeam, ...match.redTeam].map(p => p.name));

  userPool.forEach(u => {
    if (u && participantNames.has(u.name)) {
      u.status = 'RESTING';
      u.restTimer = 5 + Math.floor(Math.random() * 5); 
    }
  });

  // 밴 통계
  const allBans = [...(match.bans?.blue || []), ...(match.bans?.red || [])];
  allBans.forEach(banId => {
    if (banId) {
        const hero = heroes.find(h => h.id === banId);
        if (hero && hero.record) hero.record.totalBans++; 
    }
  });

  const processTeam = (team: LivePlayer[], win: boolean) => {
    if (!Array.isArray(team)) return;

    team.forEach(player => {
      const hero = heroes.find(h => h.id === player.heroId);
      // 유저 찾기 (없어도 죽지 않게 처리)
      const user = userPool.find(u => u && u.name === player.name) as any;

      if (hero && hero.record) {
        hero.record.totalMatches++; 
        hero.record.totalPicks++; 
        if (win) hero.record.totalWins++;

        hero.record.totalKills += (player.kills || 0); 
        hero.record.totalDeaths += (player.deaths || 0); 
        hero.record.totalAssists += (player.assists || 0); 

        const itemsValue = (player.items || []).reduce((sum, item) => sum + (item.cost || 0), 0);
        hero.record.totalGold += ((player.gold || 0) + itemsValue);
        hero.record.totalDamage += (player.totalDamageDealt || 0); 
        hero.record.totalCs += (player.cs || 0);

        if (!hero.record.recentResults) hero.record.recentResults = [];
        hero.record.recentResults.push(win); 
        if (hero.record.recentResults.length > 1000) hero.record.recentResults.shift();
      }

      if (user) {
        // [Safety] 유저 데이터 구조 보장
        if (!user.history) user.history = [];
        if (!user.heroStats) user.heroStats = {};

        user.wins += win ? 1 : 0; 
        user.losses += win ? 0 : 1;

        let lpChange = win ? 25 : -20;
        let kdaStr = `${player.kills}/${player.deaths}/${player.assists}`;
        let historyMsg = win ? 'WIN' : 'LOSE';

        if (user.promoStatus) {
            lpChange = 0; 
            if (win) {
                user.promoStatus.wins++;
                historyMsg = 'PROMO WIN';
                if (user.promoStatus.wins >= user.promoStatus.targetWins) {
                    const nextTier = getNextTierInfo(user.score, tierConfig);
                    if (nextTier) {
                        user.score = nextTier.cut + 50; 
                        historyMsg = `🎉 승급! (${nextTier.name})`;
                    }
                    user.promoStatus = null;
                }
            } else {
                user.promoStatus.losses++;
                historyMsg = 'PROMO LOSS';
                const totalGames = user.promoStatus.targetWins * 2 - 1;
                const maxLosses = totalGames - user.promoStatus.targetWins + 1;
                if (user.promoStatus.losses >= maxLosses) {
                    user.score -= 40; 
                    historyMsg = '❌ 승급 실패';
                    user.promoStatus = null;
                }
            }
        } else {
            const oldScore = user.score || 0;
            user.score = Math.max(0, oldScore + lpChange);
            const nextTier = getNextTierInfo(oldScore, tierConfig);
            if (nextTier && user.score >= nextTier.cut) {
                user.score = nextTier.cut - 1; 
                const promoMatches = tierConfig.promos ? (tierConfig.promos[nextTier.key as keyof typeof tierConfig.promos] || 3) : 3;
                user.promoStatus = {
                    targetTier: nextTier.name,
                    wins: 0,
                    losses: 0,
                    targetWins: Math.ceil(promoMatches / 2)
                };
                historyMsg = `🔥 ${nextTier.name} 승급전!`;
            }
        }

        user.history.unshift({ 
          season: 1, 
          result: historyMsg, 
          heroName: hero?.name || 'Unknown', 
          kda: kdaStr, 
          lpChange: lpChange, 
          date: `Day ${day} ${hour}:00` 
        });
        if (user.history.length > 20) user.history.pop();

        if (!user.heroStats[player.heroId]) user.heroStats[player.heroId] = { matches:0, wins:0, kills:0, deaths:0, assists:0 };
        const st = user.heroStats[player.heroId];
        st.matches++; if(win) st.wins++; st.kills+=player.kills; st.deaths+=player.deaths; st.assists+=player.assists;
      }
    });
  };

  try {
    processTeam(match.blueTeam, isBlueWin);
    processTeam(match.redTeam, !isBlueWin);
  } catch (err) {
    console.error("Error in match settlement:", err);
  }

  return { isBlueWin, blueKills, redKills, duration: match.currentDuration };
}
