// ==========================================
// FILE PATH: /src/engine/match/phases/GrowthPhase.ts
// ==========================================
import { LiveMatch, BattleSettings, Hero, BattlefieldSettings } from '../../../types';
// [수정] ItemManager에서 통합 스탯 갱신 함수만 가져옴 (불필요한 계산 함수 제거)
import { updateLivePlayerStats } from '../systems/ItemManager';

const getRequiredExpForLevel = (level: number): number => {
  if (level >= 18) return 999999;
  return 250 + (level * 90) + (Math.pow(level, 2) * 5);
};

export const processGrowthPhase = (
  match: LiveMatch, 
  battleSettings: BattleSettings,
  fieldSettings: BattlefieldSettings,
  heroes: Hero[], 
  dt: number
) => {
  const allPlayers = [...match.blueTeam, ...match.redTeam];

  // 정글 설정 (없으면 기본값)
  const jgGold = fieldSettings?.jungle?.gold ?? 80;
  const jgXp = fieldSettings?.jungle?.xp ?? 160;

  allPlayers.forEach(p => {
    if (p.respawnTimer > 0) return; // 죽은 자는 말이 없다

    const heroData = heroes.find(h => h.id === p.heroId);
    if (!heroData) return;

    // ====================================================
    // 1. 기본 회복 (체력/마나) - [수정됨]
    // ====================================================
    // 아이템으로 갱신된 regen 수치를 우선 사용하고, 없으면 기본 스탯 사용
    const mpRegen = p.mpRegen || 5;
    const hpRegen = (p as any).hpRegen || heroData.stats.regen; 

    // 초당 회복량 적용
    if (p.currentMp < p.maxMp) {
        p.currentMp = Math.min(p.maxMp, p.currentMp + (mpRegen * dt));
    }
    if (p.currentHp < p.maxHp) {
        p.currentHp = Math.min(p.maxHp, p.currentHp + (hpRegen * dt));
    }

    // ====================================================
    // 2. 자연 골드 (초당 2G)
    // ====================================================
    p.gold += (2.0 * dt);

    // ====================================================
    // 3. CS 및 정글링 (피지컬 스탯 기반 확률)
    // ====================================================
    const farmingSpeed = 1 + (p.stats.mechanics / 2000) + (p.level * 0.05);
    
    if (p.lane === 'JUNGLE') {
        const csRatePerSec = 0.2 * farmingSpeed; // 정글 사냥 속도

        if (Math.random() < csRatePerSec * dt) {
            p.cs += 1;
            p.gold += jgGold;
            (p as any).exp = ((p as any).exp || 0) + jgXp;
            // 정글몹에게 맞아서 체력 소모 (레벨 오를수록 덜 아픔)
            p.currentHp -= Math.max(0, (30 - p.level * 2)); 
        }
    } else {
        const csRatePerSec = 0.25 * farmingSpeed; // 라인 파밍 속도

        if (Math.random() < csRatePerSec * dt) {
            p.cs += 1;
            p.gold += 21; // 미니언 골드
            (p as any).exp = ((p as any).exp || 0) + 60;
        }
    }

    // ====================================================
    // 4. 레벨업 처리 - [핵심 수정]
    // ====================================================
    const reqExp = getRequiredExpForLevel(p.level);
    
    if ((p as any).exp >= reqExp && p.level < 18) {
        (p as any).exp -= reqExp;
        p.level++;

        // 레벨업 전 최대치 저장
        const oldMaxHp = p.maxHp;
        const oldMaxMp = p.maxMp;

        // [중요] 레벨업 시 통합 스탯 재계산 (성장 스탯 + 아이템 스탯 모두 반영)
        // ItemManager에 있는 이 함수가 maxHp, maxMp, speed 등을 모두 갱신해줌
        updateLivePlayerStats(p, heroData);

        // 최대 체력/마나가 늘어난 만큼 현재 체력/마나도 회복시켜줌 + 레벨업 보너스 힐(100)
        p.currentHp += (p.maxHp - oldMaxHp) + 100; 
        p.currentMp += (p.maxMp - oldMaxMp) + 100;

        // 로그 기록
        match.logs.push({
            time: Math.floor(match.currentDuration),
            message: `🆙 [${heroData.name}] ${p.level}레벨 달성!`,
            type: 'LEVELUP',
            team: match.blueTeam.includes(p) ? 'BLUE' : 'RED'
        });
    }

    // ====================================================
    // 5. 귀환 로직 (우물)
    // ====================================================
    const isLowHp = p.currentHp < p.maxHp * 0.2; 
    const isLowMp = p.currentMp < p.maxMp * 0.1; 
    const hasLotsOfGold = p.gold > 2000; 

    // 체력/마나가 너무 없거나 돈이 많으면 확률적으로 집에 감 (즉시 회복 처리)
    // *실제 게임에서는 이동 시간이 걸리지만, 여기서는 시뮬레이션 약식 처리
    if ((isLowHp || isLowMp || hasLotsOfGold) && Math.random() < 0.1 * dt) {
        p.currentHp = p.maxHp;
        p.currentMp = p.maxMp;
    }
  });
};