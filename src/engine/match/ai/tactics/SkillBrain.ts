// ==========================================
// FILE PATH: /src/engine/match/ai/tactics/SkillBrain.ts
// ==========================================
import { LivePlayer, Hero } from '../../../../types';
import { AIUtils } from '../AIUtils';

export class SkillBrain {
  /**
   * 현재 상황에서 사용할 최적의 스킬을 판단합니다.
   * @returns 사용할 스킬 키 ('q' | 'w' | 'e' | 'r') 또는 null
   */
  static getBestSkill(
    player: LivePlayer, 
    target: LivePlayer, 
    hero: Hero, 
    dist: number
  ): string | null {
    // 쿨타임 및 마나 체크 헬퍼
    const canUse = (key: string) => {
        const skill = (hero.skills as any)[key];
        const cooldown = (player.cooldowns as any)[key];
        const cost = skill.cost || 0;
        return cooldown <= 0 && player.currentMp >= cost;
    };

    const brain = player.stats.brain; // 0 ~ 100
    const targetHpPercent = AIUtils.hpPercent(target);

    // 1. [궁극기(R) 판단] - 킬각이거나 한타일 때
    if (canUse('r')) {
        const rSkill = hero.skills.r;
        
        // 뇌지컬 높으면: 확실한 킬각일 때만 궁 씀
        if (brain > 60) {
            if (targetHpPercent < 0.4) return 'r'; // 마무리
        } else {
            // 뇌지컬 낮으면: 그냥 쿨 돌면 씀 (브론즈)
            if (targetHpPercent < 0.8) return 'r'; 
        }
    }

    // 2. [주력기(Q) 판단] - 딜교환
    if (canUse('q')) {
        // 사거리 체크
        if (dist <= 6) return 'q'; // 사거리 내면 발사
    }

    // 3. [CC기/유틸기(W, E) 판단]
    // 적이 도망가거나(체력 낮음) 내가 위험할 때
    if (targetHpPercent < 0.3 && canUse('e')) return 'e'; // 추격/마무리
    if (AIUtils.hpPercent(player) < 0.4 && canUse('w')) return 'w'; // 생존용

    return null;
  }
}
