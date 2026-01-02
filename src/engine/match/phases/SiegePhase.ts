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
  // [신규] 포탑 설정값 로드
  const towerHp = fieldSettings?.tower?.hp || 5000;
  const towerArmor = fieldSettings?.tower?.armor || 50;

  // 포탑의 '유효 내구도(Effective HP)' 계산
  const effectiveTowerHP = towerHp * (1 + towerArmor / 100);

  // 기본 공성 확률
  let pushChance = 0.005 + (match.currentDuration / 4500) * 0.04;

  // [핵심 수정 1] 포탑 내구도 반영 (내구도가 높을수록 파괴 확률 감소)
  // 내구도 8000(기본)을 기준점(1.0)으로 잡음
  const durabilityFactor = 8000 / Math.max(1, effectiveTowerHP);
  pushChance *= durabilityFactor;

  // 거신병 버프 시 공성 확률 대폭 증가
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

  // [신규] 방어 측 타워 공격력 반영 (역관광 확률)
  const defenderGod = isBluePush ? battleSettings.izman : battleSettings.dante;
  const defenderTowerAtk = defenderGod.towerAtk || 100;

  // [핵심 수정 2] 타워 공격력이 높으면 공성 실패 확률 증가
  // 타워 공격력 100 기준 저항력 0.66
  const towerResistance = 100 / (50 + defenderTowerAtk);
  // 저항력 수치가 낮을수록 공성 실패 확률 높음
  if (Math.random() > towerResistance) return; 

  // 신살자 생존 여부 체크
  const hasAliveSlayer = attackerTeam.some(p => {
      const h = heroes.find(x => x.id === p.heroId);
      return h?.role === '신살자' && p.currentHp > 0;
  });

  const lanes = ['top', 'mid', 'bot'] as const;
  const lane = lanes[Math.floor(Math.random() * 3)];
  const laneName = lane === 'top' ? '탑' : lane === 'mid' ? '미드' : '바텀';

  // --- [포탑 파괴 로직] ---
  if (defenderStats.towers[lane] < 3) {
      // 신살자 없으면 철거 힘듦
      if (!hasAliveSlayer && Math.random() < 0.4) return;

      defenderStats.towers[lane]++;
      const tier = defenderStats.towers[lane];

      // 포탑 파괴 보상 (설정값 반영)
      const reward = (fieldSettings?.tower?.rewardGold || 150) + (tier * 50);
      (isBluePush ? match.blueTeam : match.redTeam).forEach(p => p.gold += reward);

      match.logs.push({
          time: Math.floor(match.currentDuration),
          message: `🔨 ${defenderName}팀의 [${laneName} ${tier}차 포탑] 파괴!`,
          type: 'TOWER',
          team: attackerName
      });
  } 
  // --- [넥서스 파괴 로직] ---
  else {
      let damage = 50 + (match.currentDuration / 12);

      if (hasAliveSlayer) {
          const bonusRatio = 1 + (roleSettings.slayer.structureDamage / 100);
          damage *= bonusRatio;
      }

      // 넥서스 체력 감소 (설정된 넥서스 HP가 많으면 더 오래 버팀)
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