// ==========================================
// FILE PATH: /src/engine/match/phases/SiegePhase.ts
// ==========================================
import { LiveMatch, Hero, RoleSettings, BattlefieldSettings, BattleSettings } from '../../../types';

export const processSiegePhase = (
  match: LiveMatch, 
  heroes: Hero[], 
  fieldSettings: BattlefieldSettings,
  roleSettings: RoleSettings, 
  battleSettings: BattleSettings, 
  dt: number
) => {
  // 공성 확률 조정
  let pushChance = 0.005 + (match.currentDuration / 4500) * 0.04;

  if (match.stats.blue.activeBuffs.siegeUnit || match.stats.red.activeBuffs.siegeUnit) {
      pushChance *= 4.5;
  }

  if (Math.random() >= (pushChance * dt)) return; 

  const scoreDiff = match.score.blue - match.score.red;
  let bluePushProb = 0.5 + (scoreDiff / 100); 

  const isBluePush = Math.random() < bluePushProb;
  const attackerName = isBluePush ? 'BLUE' : 'RED';
  const defenderName = isBluePush ? '레드' : '블루';
  const attackerTeam = isBluePush ? match.blueTeam : match.redTeam;
  const defenderStats = isBluePush ? match.stats.red : match.stats.blue;

  const hasAliveSlayer = attackerTeam.some(p => {
      const h = heroes.find(x => x.id === p.heroId);
      return h?.role === '신살자' && p.currentHp > 0;
  });

  const lanes = ['top', 'mid', 'bot'] as const;
  const lane = lanes[Math.floor(Math.random() * 3)];
  const laneName = lane === 'top' ? '탑' : lane === 'mid' ? '미드' : '바텀';

  if (defenderStats.towers[lane] < 3) {
      if (!hasAliveSlayer && Math.random() < 0.4) return;

      defenderStats.towers[lane]++;
      const tier = defenderStats.towers[lane];

      // 포탑 파괴 보상 하향
      const reward = 150 + (tier * 50);
      (isBluePush ? match.blueTeam : match.redTeam).forEach(p => p.gold += reward);

      match.logs.push({
          time: Math.floor(match.currentDuration),
          message: `🔨 ${defenderName}팀의 [${laneName} ${tier}차 포탑] 파괴!`,
          type: 'TOWER',
          team: attackerName
      });
  } 
  else {
      // 넥서스 타격 비중 조정
      let damage = 50 + (match.currentDuration / 12);

      if (hasAliveSlayer) {
          const bonusRatio = 1 + (roleSettings.slayer.structureDamage / 100);
          damage *= bonusRatio;
      }

      defenderStats.nexusHp -= (damage * dt * 8);

      if (defenderStats.nexusHp <= 0) {
          defenderStats.nexusHp = 0;
          match.logs.push({ 
              time: Math.floor(match.currentDuration), 
              message: `🏁 ${defenderName}팀의 수호자 파괴! 게임 종료!`, 
              type: 'TOWER', 
              team: attackerName 
          });
      }
  }
};