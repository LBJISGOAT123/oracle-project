// ==========================================
// FILE PATH: /src/engine/match/phases/CombatPhase.ts
// ==========================================

import { LiveMatch, Hero, BattleSettings, RoleSettings } from '../../../types';
import { calculateHeroPower } from '../calculators/PowerCalculator';

export const processCombatPhase = (
  match: LiveMatch, 
  heroes: Hero[], 
  settings: BattleSettings,
  roleSettings: RoleSettings,
  watcherBuffType: string,
  watcherBuffAmount: number
) => {
  // [수정] 기본 교전 확률 감소 (0.015 -> 0.008)
  // 초당 0.8% 확률 -> 분당 약 0.5회 한타 발생 (게임 전체 15~20킬 정도)
  let fightChance = 0.008 + (match.currentDuration / 3600) * 0.02;
  if (match.stats.blue.activeBuffs?.voidPower || match.stats.red.activeBuffs?.voidPower) fightChance *= 1.5; 

  if (Math.random() >= fightChance) return; 
  if (match.blueTeam.length === 0 || match.redTeam.length === 0) return;

  const blueHeroPlayer = match.blueTeam[Math.floor(Math.random() * match.blueTeam.length)];
  const redHeroPlayer = match.redTeam[Math.floor(Math.random() * match.redTeam.length)];

  if (!blueHeroPlayer || !redHeroPlayer) return;

  const bluePower = calculateHeroPower(blueHeroPlayer.heroId, heroes, blueHeroPlayer, false, match.blueTeam, roleSettings);
  const redPower = calculateHeroPower(redHeroPlayer.heroId, heroes, redHeroPlayer, false, match.redTeam, roleSettings);

  const totalPower = bluePower + redPower;
  if (totalPower === 0) return;

  let blueWinChance = bluePower / totalPower; 

  if (watcherBuffType === 'COMBAT') {
      if (match.stats.blue.activeBuffs?.voidPower) blueWinChance += watcherBuffAmount;
      if (match.stats.red.activeBuffs?.voidPower) blueWinChance -= watcherBuffAmount;
  }

  const isBlueKill = Math.random() < blueWinChance;
  const winners = isBlueKill ? match.blueTeam : match.redTeam;
  const killer = isBlueKill ? blueHeroPlayer : redHeroPlayer;
  const victim = isBlueKill ? redHeroPlayer : blueHeroPlayer;

  let killGold = 300;
  if (watcherBuffType === 'GOLD' && (isBlueKill ? match.stats.blue.activeBuffs.voidPower : match.stats.red.activeBuffs.voidPower)) {
      killGold += (300 * watcherBuffAmount);
  }

  killer.kills++; 
  killer.gold += killGold; 
  victim.deaths++;

  // [유지] 킬 딜량: 체력의 70% 정도 기여
  const damageContribution = victim.maxHp * (0.7 + Math.random() * 0.2); 
  killer.totalDamageDealt += Math.floor(damageContribution);

  const assisters = winners.filter(p => p !== killer && Math.random() < 0.4);
  assisters.forEach(a => { 
      a.assists++; 
      a.gold += (killGold / 2); 
      const assistDamage = victim.maxHp * (0.1 + Math.random() * 0.1);
      a.totalDamageDealt += Math.floor(assistDamage);
  });

  if (isBlueKill) match.score.blue++; else match.score.red++;

  const getHeroName = (id: string) => heroes.find(h => h.id === id)?.name || 'Unknown';

  match.logs.push({
    time: match.currentDuration, 
    message: `${getHeroName(killer.heroId)}님이 ${getHeroName(victim.heroId)} 처치!`, 
    type: 'KILL', 
    team: isBlueKill ? 'BLUE' : 'RED'
  });
};