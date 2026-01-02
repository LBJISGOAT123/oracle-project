// ==========================================
// FILE PATH: /src/engine/match/phases/GrowthPhase.ts
// ==========================================
import { LiveMatch, BattleSettings, Hero, BattlefieldSettings } from '../../../types';
import { calculateTotalStats } from '../ItemManager';
import { getLevelScaledStats } from '../calculators/PowerCalculator';

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

  // [신규] 정글 설정 로드 (설정값 없으면 기본값 사용)
  const jgGold = fieldSettings?.jungle?.gold ?? 80;
  const jgXp = fieldSettings?.jungle?.xp ?? 160;
  const yieldMod = (fieldSettings?.jungle?.yield ?? 50) / 50; 
  const jgAtk = fieldSettings?.jungle?.attack ?? 30;
  const jgDef = fieldSettings?.jungle?.defense ?? 20;

  allPlayers.forEach(p => {
    // 죽어있으면 성장 중지
    if (p.respawnTimer > 0) return;

    const heroData = heroes.find(h => h.id === p.heroId);
    if (!heroData) return;

    // [신규] 적 진영의 하수인 설정값 가져오기
    const isBlue = match.blueTeam.includes(p);
    const enemyGod = isBlue ? battleSettings.izman : battleSettings.dante;

    // 미니언 평균 골드/경험치 계산
    const m = enemyGod.minions;
    const avgMinionGold = (m.melee.gold * 3 + m.ranged.gold * 3 + m.siege.gold) / 7;
    const avgMinionXp = (m.melee.xp * 3 + m.ranged.xp * 3 + m.siege.xp) / 7;

    if ((p as any).exp === undefined) (p as any).exp = 0;
    const oldLevel = p.level;

    // 마나 자연 회복
    const regen = p.mpRegen || 5;
    if (p.currentMp < p.maxMp) {
       p.currentMp = Math.min(p.maxMp, p.currentMp + (regen * dt));
    }

    // 초당 패시브 골드
    p.gold += (2.1 * dt); 

    const csChance = 0.13 + (p.stats.mechanics / 2000); 
    const macroBonus = 1.0 + (p.stats.brain / 1000); 

    let gainExp = 0;

    // --- [CS 및 정글링] ---
    if (p.lane === 'JUNGLE') {
        // [핵심 수정 1] 정글 사냥 속도 (내 공격력 vs 정글 방어력)
        const totalAD = heroData.stats.ad + (p.items.reduce((s, i)=>s+(i.ad||0), 0));
        // 정글 몹 방어력이 높으면 사냥 확률 감소
        const clearSpeedMod = Math.max(0.5, totalAD / (jgDef + 50));

        if (Math.random() < (0.045 * macroBonus * yieldMod * clearSpeedMod * dt)) { 
            p.cs += 4;
            p.gold += jgGold * macroBonus;
            gainExp = jgXp;

            // [핵심 수정 2] 정글 사냥 시 입는 피해 (정글 공격력 vs 내 방어력)
            const totalArmor = heroData.stats.armor + (p.items.reduce((s, i)=>s+(i.armor||0), 0));
            const dmgReduction = 100 / (100 + totalArmor);
            const damageTaken = jgAtk * dmgReduction * 2; // *2는 정글 몹 공속 보정

            p.currentHp -= Math.max(0, damageTaken);
        }
    } else {
        // 라인전 CS
        if (Math.random() < (csChance * dt)) { 
            p.cs++;
            // [핵심 수정 3] 설정된 하수인 골드 획득
            p.gold += avgMinionGold * macroBonus; 
            gainExp = avgMinionXp;
        }
    }

    // 시간 흐름 경험치
    gainExp += (2.5 * dt); 
    (p as any).exp += gainExp;

    // --- [레벨업 처리] ---
    const reqExp = getRequiredExpForLevel(p.level);
    if ((p as any).exp >= reqExp && p.level < 18) {
        (p as any).exp -= reqExp;
        p.level++;
    }

    // 레벨업 시 스탯 갱신
    if (p.level > oldLevel) {
        const scaledBaseStats = getLevelScaledStats(heroData.stats, p.level);
        const totalStats = calculateTotalStats({ ...heroData, stats: scaledBaseStats }, p.items);

        // HP 갱신
        const oldMaxHp = p.maxHp;
        p.maxHp = totalStats.hp;
        const healAmount = (p.maxHp - oldMaxHp) + (p.maxHp * 0.3);
        p.currentHp = Math.min(p.maxHp, p.currentHp + healAmount);

        // MP 갱신
        p.maxMp = (scaledBaseStats as any).mp || (300 + p.level * 40);
        p.mpRegen = (scaledBaseStats as any).mpRegen || (5 + p.level * 0.5);
        p.currentMp = p.maxMp; // 레벨업 시 마나 풀회복

        if (Math.random() < 0.1) {
            match.logs.push({
                time: Math.floor(match.currentDuration),
                message: `🆙 [${heroData.name}] ${p.level}레벨 달성!`,
                type: 'LEVELUP',
                team: match.blueTeam.includes(p) ? 'BLUE' : 'RED'
            });
        }
    }

    // --- [체력 회복 및 귀환] ---
    if (p.currentHp < p.maxHp) {
        p.currentHp = Math.min(p.maxHp, p.currentHp + (heroData.stats.regen * 0.2 * dt));
    }
    // 라인전 짤짤이 데미지 시뮬레이션
    if (Math.random() < (0.18 * dt)) {
        p.currentHp -= (15 + p.level * 3); 
    }

    // 귀환 판단 (돈이 많거나, 체력/마나가 없을 때)
    const recallThreshold = 0.12 + (p.stats.brain / 1000); 
    const needsShopping = p.gold > 2800;
    const isLowHp = p.currentHp > 0 && p.currentHp < p.maxHp * recallThreshold;
    const isLowMp = p.currentMp < p.maxMp * 0.15;

    if (needsShopping || isLowHp || isLowMp) {
        p.currentHp = p.maxHp; 
        p.currentMp = p.maxMp;
    }

    // 오버플로우 방지
    if (p.currentHp > p.maxHp) p.currentHp = p.maxHp;
    if (p.currentMp > p.maxMp) p.currentMp = p.maxMp;
  });
};