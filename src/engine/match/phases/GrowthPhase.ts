// ==========================================
// FILE PATH: /src/engine/match/phases/GrowthPhase.ts
// ==========================================

import { LiveMatch, BattleSettings, Hero } from '../../../types';
import { useGameStore } from '../../../store/useGameStore';
import { calculateTotalStats } from '../ItemManager';
import { JUNGLE_CONFIG } from '../../../data/jungle';

export const processGrowthPhase = (
  match: LiveMatch, 
  battleSettings: BattleSettings,
  heroes: Hero[]
) => {
  const allPlayers = [...match.blueTeam, ...match.redTeam];
  if (allPlayers.length === 0) return;

  const state = useGameStore.getState();
  const jungleRaw = state.gameState.fieldSettings?.jungle;

  // 정글 설정값 로드
  const jungleSettings = {
    density: jungleRaw?.density ?? 50,
    yield: jungleRaw?.yield ?? 50,
    attack: jungleRaw?.attack ?? 30,
    defense: jungleRaw?.defense ?? 20
  };

  // 설정에 따른 보정치 계산
  const densityMod = 0.5 + (jungleSettings.density / 100);
  const yieldMod = 0.5 + (jungleSettings.yield / 100);
  const attackMod = 0.5 + (jungleSettings.attack / 50); 
  const defenseMod = 1.0 + (jungleSettings.defense / 200);

  allPlayers.forEach(p => {
    // 0. 기본 골드 수급 (초당 1골드)
    p.gold += 1;

    if (!p.heroId) return;
    const heroData = heroes.find(h => h.id === p.heroId);
    if (!heroData) return;

    // [신규] 1. 전술적 귀환 (Recall) 로직
    // 체력이 30% 미만이고, 현재 살아있다면 집에 감
    if (p.currentHp > 0 && (p.currentHp / p.maxHp) < 0.3) {
      // 성장(CS/경험치)을 포기하고 체력 회복
      p.currentHp = p.maxHp;
      return; // 이번 틱 종료 (파밍 불가)
    }

    const enemyMinions = p.lane === 'JUNGLE' 
      ? null 
      : (match.blueTeam.includes(p) ? battleSettings.izman.minions : battleSettings.dante.minions);

    // [2] 정글러 로직
    if (p.lane === 'JUNGLE' || !enemyMinions) {
        // 정글몹 조우 확률
        const spawnChance = (JUNGLE_CONFIG.BASE_SPAWN_RATE * densityMod) / defenseMod;

        if (Math.random() < spawnChance) {
            // 데미지 계산 (레벨 비례 방어)
            const heroDefenseFactor = 1 + (p.level * 0.1); 
            const damageTaken = (JUNGLE_CONFIG.BASE_DAMAGE_TAKEN * attackMod) / heroDefenseFactor;

            // 체력 감소
            p.currentHp -= damageTaken;

            // [신규] 2. 정글 처형 (Execution) 로직
            if (p.currentHp <= 0) {
              p.currentHp = p.maxHp; // 부활 (리스폰 대기시간은 시뮬레이션 단순화를 위해 생략하되 턴 날림)
              p.deaths += 1; // 데스 추가

              // 처형 로그 기록 (너무 자주 뜨면 도배되므로 확률적으로 기록하거나, 중요 이벤트로 처리)
              if (Math.random() < 0.3) {
                match.logs.push({
                  time: match.currentDuration,
                  message: `💀 ${p.name}님이 정글 몬스터에게 처형당했습니다.`,
                  type: 'KILL' // 킬 로그로 처리하여 눈에 띄게 함
                });
              }
              return; // 죽었으므로 보상 획득 불가
            }

            // 생존 시 보상 획득
            p.cs++;
            p.gold += Math.floor(JUNGLE_CONFIG.BASE_GOLD * yieldMod);

            // 경험치 획득 및 레벨업
            if (p.cs % JUNGLE_CONFIG.BASE_XP_INTERVAL === 0) {
              p.level = Math.min(18, p.level + 1);
              // 레벨업 시 체력/스탯 상승 효과 (간략화: 체력 회복)
              p.currentHp = Math.min(p.maxHp, p.currentHp + 100);
            }

            // 정글링 중 소량의 체력 회복 (기본 유지력)
            const sustain = JUNGLE_CONFIG.BASE_REGEN; 
            p.currentHp = Math.min(p.maxHp, p.currentHp + sustain);
        }
        return;
    }

    // [3] 라이너(Laner) 로직 - 라인전
    const currentStats = calculateTotalStats(heroData, p.items);

    // CS 먹을 확률 계산
    const farmingPower = (currentStats.ad * (currentStats.speed / 500)) + (currentStats.ap * 0.3);
    const rand = Math.random();
    let targetMinion = enemyMinions.melee;
    if (rand > 0.8) targetMinion = enemyMinions.siege;
    else if (rand > 0.4) targetMinion = enemyMinions.ranged;

    const minionDurability = targetMinion.hp + (targetMinion.def * 2);
    const difficultyFactor = Math.max(1, minionDurability / 50); 
    const efficiency = farmingPower / difficultyFactor;

    let csChance = 0.11 * efficiency; 
    csChance += (p.level * 0.002);
    csChance = Math.max(0.08, Math.min(0.16, csChance));

    // CS 획득 시도
    if (Math.random() < csChance) {
        p.cs++;
        p.gold += targetMinion.gold;
        if (p.cs % 15 === 0) p.level = Math.min(18, p.level + 1);

        // 미니언 처치 시 소량 회복 (흡혈 등 추상화)
        p.currentHp = Math.min(p.maxHp, p.currentHp + 8);
    }

    // 라인전 딜교환 (Poking)
    // 딜교환으로 체력이 깎이면 다음 틱에 '전술적 귀환' 로직이 발동됨
    if (Math.random() < 0.04) {
        let pokeDamage = (p.level * 20) + (currentStats.ad * 0.5) + (currentStats.ap * 0.4);
        if (heroData.stats && heroData.stats.range > 300) pokeDamage *= 1.2;

        // 딜교환 데미지 누적 (상대방 HP 감소는 CombatPhase 등에서 처리하거나 여기서 간략화)
        // 여기서는 '내가 딜을 넣었다'는 기록만 남김. 
        // 실제 상대 HP 감소는 복잡도를 낮추기 위해 CombatPhase의 확률적 킬이나 
        // 별도의 Poke 로직으로 분리하는 것이 좋으나, 
        // 간단히 p.currentHp가 깎이는 것은 '상대 미니언/타워/챔피언'에게 맞은 것으로 간주하여 아래 추가

        p.totalDamageDealt += Math.floor(pokeDamage);

        // 상대에게 맞음 (랜덤 데미지)
        p.currentHp -= (10 + p.level * 2);
    }
  });
};