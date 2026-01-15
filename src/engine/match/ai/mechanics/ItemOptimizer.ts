// ==========================================
// FILE PATH: /src/engine/match/ai/mechanics/ItemOptimizer.ts
// ==========================================
import { LivePlayer, Hero, Role } from '../../../../types';

interface StatWeights {
  ad: number; ap: number; hp: number; armor: number; 
  crit: number; speed: number; pen: number; regen: number; mp: number; mpRegen: number;
}

// 기본 역할군별 가중치
const BASE_WEIGHTS: Record<Role, StatWeights> = {
  '집행관': { ad: 1.2, hp: 0.8, armor: 0.8, regen: 0.5, pen: 1.0, speed: 0.5, crit: 0.5, ap: 0, mp: 0.2, mpRegen: 0.2 },
  '추적자': { ad: 1.5, speed: 1.5, pen: 1.2, crit: 1.0, hp: 0.2, armor: 0.2, regen: 0.2, ap: 0, mp: 0.2, mpRegen: 0.2 },
  '선지자': { ap: 1.5, mp: 1.2, mpRegen: 1.2, pen: 0.8, hp: 0.3, speed: 0.5, armor: 0.2, regen: 0.1, ad: 0, crit: 0 },
  '신살자': { ad: 1.5, crit: 1.5, speed: 1.0, pen: 1.2, hp: 0.1, armor: 0.1, regen: 0.2, ap: 0, mp: 0.2, mpRegen: 0.2 },
  '수호기사': { hp: 1.5, armor: 1.5, regen: 1.5, mp: 0.5, speed: 0.3, ad: 0.2, ap: 0.2, pen: 0, crit: 0, mpRegen: 0.3 },
};

export class ItemOptimizer {
  
  /**
   * 적 팀의 성장 상태를 분석하여 현재 플레이어에게 최적화된 아이템 가중치를 반환합니다.
   */
  static getDynamicWeights(
    player: LivePlayer, 
    hero: Hero, 
    enemies: LivePlayer[], 
    heroes: Hero[]
  ): StatWeights {
    // 1. 기본 가중치 복사
    const weights = { ...BASE_WEIGHTS[hero.role] };
    const brain = player.stats.brain;

    // 뇌지컬이 낮으면(50 미만) 그냥 추천 템트리(기본 가중치)대로 감
    if (brain < 50) return weights;

    // 2. 적 위협 분석 (가장 잘 큰 적 3명 기준)
    const topThreats = [...enemies]
      .sort((a, b) => b.gold - a.gold)
      .slice(0, 3);

    let threatAD = 0;
    let threatAP = 0;
    let threatTank = 0;

    for (const enemy of topThreats) {
      const eHero = heroes.find(h => h.id === enemy.heroId);
      if (!eHero) continue;

      // 아이템 스탯 합산
      const itemAD = enemy.items.reduce((s, i) => s + (i.ad || 0), 0);
      const itemAP = enemy.items.reduce((s, i) => s + (i.ap || 0), 0);
      const itemArmor = enemy.items.reduce((s, i) => s + (i.armor || 0), 0);
      const itemHP = enemy.items.reduce((s, i) => s + (i.hp || 0), 0);

      const totalAD = eHero.stats.ad + itemAD;
      const totalAP = eHero.stats.ap + itemAP;
      const totalTankiness = itemArmor + (itemHP / 10);

      threatAD += totalAD;
      threatAP += totalAP;
      threatTank += totalTankiness;
    }

    // 3. 가중치 동적 조정 (Counter Building)

    // A. 적이 너무 아픔 (방어 아이템 가중치 증가)
    if (threatAD > threatAP * 1.5) {
        // 적이 올AD -> 방어력(Armor) 중요도 급상승
        weights.armor = (weights.armor || 0.1) * 2.5;
        // 딜러라도 최소한의 방어력 챙기게 유도
        if (weights.armor < 0.5) weights.armor = 0.5;
    } 
    else if (threatAP > threatAD * 1.5) {
        // 적이 올AP -> 체력(HP) 및 재생 중요도 상승 (마저템이 따로 없으므로 체력으로 버팀)
        weights.hp = (weights.hp || 0.1) * 2.0;
        weights.regen = (weights.regen || 0.1) * 2.0;
        // 방어력 효율 감소 (AP 상대로는 쓸모 없음)
        weights.armor *= 0.5;
    }

    // B. 적이 너무 단단함 (관통력 가중치 증가)
    if (threatTank > 300) { // 적들이 탱템을 두름
        weights.pen = (weights.pen || 0.1) * 2.5; // 관통력 필수
        // 탱커 상대로는 치명타나 깡뎀보다는 관통이 효율적
    }

    // C. 내가 너무 많이 죽음 (생존템 우선)
    const kdaRatio = player.deaths === 0 ? player.kills : player.kills / player.deaths;
    if (player.deaths >= 4 && kdaRatio < 0.5) {
        weights.hp *= 1.5;
        weights.armor *= 1.2;
    }

    return weights;
  }
}
