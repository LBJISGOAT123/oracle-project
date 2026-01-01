// ==========================================
// FILE PATH: /src/engine/match/phases/SiegePhase.ts
// ==========================================

import { LiveMatch, Hero, RoleSettings, BattleSettings } from '../../../types';

export const processSiegePhase = (
  match: LiveMatch, 
  heroes: Hero[], 
  rewards: any,
  roleSettings: RoleSettings,
  battleSettings?: BattleSettings // [신규] 하수인 스펙 참조용
) => {
  // [기본 확률] 시간 비례
  let pushChance = 0.001 + (match.currentDuration / 3600) * 0.01; 

  // [신규] 하수인 공격력 반영 (강한 미니언일수록 라인을 잘 밈)
  if (battleSettings) {
    // 양 팀 미니언의 평균 공격력 계산 (원거리/근거리/공성 평균)
    const getAvgMinionAtk = (teamSettings: any) => {
      const m = teamSettings.minions;
      return (m.melee.atk + m.ranged.atk + m.siege.atk) / 3;
    };

    const blueMinionPower = getAvgMinionAtk(battleSettings.dante);
    const redMinionPower = getAvgMinionAtk(battleSettings.izman);
    const avgPower = (blueMinionPower + redMinionPower) / 2;

    // 공격력 30 기준 0.001 추가 (미미해 보이지만 매초 실행되므로 유의미함)
    pushChance += (avgPower / 10000); 
  }

  // 거신병 버프 시 5배 가속
  if (match.stats.blue.activeBuffs.siegeUnit || match.stats.red.activeBuffs.siegeUnit) pushChance *= 5;

  if (Math.random() >= pushChance) return; 

  // 2. 미는 쪽 결정 (점수차 + 하수인 강함 차이)
  const scoreDiff = match.score.blue - match.score.red;
  let bluePushProb = 0.5 + (scoreDiff / 100);

  // 하수인이 더 센 쪽이 밀 확률 증가
  if (battleSettings) {
    const blueAtk = battleSettings.dante.minions.siege.atk;
    const redAtk = battleSettings.izman.minions.siege.atk;
    // 공성 미니언 공격력 차이 10당 1% 확률 변동
    bluePushProb += (blueAtk - redAtk) * 0.001; 
  }

  const isBluePush = Math.random() < bluePushProb;
  const attacker = isBluePush ? 'BLUE' : 'RED';
  const attackerTeam = isBluePush ? match.blueTeam : match.redTeam;
  const defenderStats = isBluePush ? match.stats.red : match.stats.blue;
  const defenderName = isBluePush ? '이즈마한' : '단테';

  // 3. 신살자(God Slayer) 생존 여부 확인
  const hasGodSlayer = attackerTeam.some(p => {
      const h = heroes.find(x => x.id === p.heroId);
      return h?.role === '신살자' && p.currentHp > 0;
  });

  if (hasGodSlayer && Math.random() < 0.6) {
      // 공성 진행
  } else if (!hasGodSlayer && Math.random() < 0.3) { 
      return; 
  }

  const lanes = ['top', 'mid', 'bot'] as const;
  const lane = lanes[Math.floor(Math.random() * 3)];
  const laneName = lane === 'top' ? '탑' : lane === 'mid' ? '미드' : '바텀';

  // 4. 타워 철거 로직
  if (defenderStats.towers[lane] < 3) {
      defenderStats.towers[lane]++;
      const tier = defenderStats.towers[lane];
      const reward = rewards.tower.rewardGold + (tier * 30);
      (isBluePush ? match.blueTeam : match.redTeam).forEach(p => p.gold += reward);

      match.logs.push({
          time: match.currentDuration,
          message: `🔨 ${defenderName}의 [${laneName} ${tier}차 포탑] 파괴!`,
          type: 'TOWER',
          team: attacker
      });
  } 
  // 5. 넥서스 타격 로직
  else {
      let damage = 500 + (match.currentDuration / 2);

      if (hasGodSlayer) {
          const bonusRatio = 1 + (roleSettings.slayer.structureDamage / 100);
          damage *= bonusRatio;
      }

      defenderStats.nexusHp -= damage;
      const hpPercent = (defenderStats.nexusHp / defenderStats.maxNexusHp) * 100;

      if (hpPercent <= 0) {
          match.logs.push({ time: match.currentDuration, message: `👑 ${defenderName}의 수호자가 파괴되었습니다! 게임 종료!`, type: 'TOWER', team: attacker });
      } else if (Math.random() < 0.3) {
          match.logs.push({ time: match.currentDuration, message: `⚔️ ${defenderName} 수호자 공격받음! (${Math.max(0, Math.floor(hpPercent))}%)`, type: 'TOWER', team: attacker });
      }
  }
};