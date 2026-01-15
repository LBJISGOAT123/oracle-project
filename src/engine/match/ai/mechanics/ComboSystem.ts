// ==========================================
// FILE PATH: /src/engine/match/ai/mechanics/ComboSystem.ts
// ==========================================
import { LivePlayer, Hero } from '../../../../types';
import { ROLE_COMBOS, ComboSequence, SkillKey } from './ComboPatterns';
import { AIUtils } from '../AIUtils';

// 플레이어별 현재 콤보 상태를 저장 (타입 수정 없이 확장)
interface ComboState {
  sequence: ComboSequence;
  currentIndex: number;
  targetId: string;
  startTime: number;
}

// 메모리 누수 방지를 위해 WeakMap 사용 (플레이어 객체가 사라지면 상태도 사라짐)
const comboMemory = new WeakMap<LivePlayer, ComboState>();

export class ComboSystem {

  /**
   * 현재 상황에 맞는 최적의 스킬(콤보)을 반환합니다.
   */
  static getNextSkill(
    player: LivePlayer, 
    target: LivePlayer, 
    hero: Hero, 
    dist: number,
    currentTime: number
  ): string | null {
    
    // 1. 현재 진행 중인 콤보가 있는지 확인
    let state = comboMemory.get(player);

    // 콤보 유효성 검사 (타겟이 바뀌었거나, 시간이 너무 지났으면 리셋)
    if (state) {
      if (state.targetId !== target.heroId || (currentTime - state.startTime > 5)) {
        comboMemory.delete(player);
        state = undefined;
      }
    }

    // 2. 콤보가 없다면 새로 시작
    if (!state) {
      const bestCombo = this.selectBestCombo(player, target, hero, dist);
      if (bestCombo) {
        state = {
          sequence: bestCombo,
          currentIndex: 0,
          targetId: target.heroId,
          startTime: currentTime
        };
        comboMemory.set(player, state);
      }
    }

    // 3. 콤보 진행
    if (state) {
      // 현재 단계의 스킬을 쓸 수 있는지 확인
      const skillKey = state.sequence[state.currentIndex];
      
      if (this.canUseSkill(player, hero, skillKey, dist)) {
        // [뇌지컬 반영] 뇌지컬이 높으면 스킬 사이 딜레이(평캔)를 줄임
        // 여기서는 즉시 반환하여 실행
        
        // 다음 단계로 인덱스 증가 (실행은 MicroBrain이 함)
        state.currentIndex++;
        if (state.currentIndex >= state.sequence.length) {
          comboMemory.delete(player); // 콤보 끝
        }
        return skillKey;
      } 
      else {
        // 스킬 쿨타임이거나 마나 부족 등으로 못 쓰면?
        // 뇌지컬이 높으면: 기다림 (콤보 유지)
        // 뇌지컬이 낮으면: 콤보 깨고 아무거나 씀
        if (player.stats.brain < 50) {
            comboMemory.delete(player);
        }
        // 못 쓰면 null 반환 (평타 치거나 무빙하게 됨)
        return null;
      }
    }

    return null;
  }

  private static selectBestCombo(player: LivePlayer, target: LivePlayer, hero: Hero, dist: number): ComboSequence | null {
    const combos = ROLE_COMBOS[hero.role];
    if (!combos || combos.length === 0) return null;

    // 킬각이면 궁극기 포함된 콤보 선호
    const targetHp = AIUtils.hpPercent(target);
    const useUltCombo = targetHp < 0.5 && this.canUseSkill(player, hero, 'r', dist);

    for (const combo of combos) {
      // 1. 궁극기 조건 체크
      if (combo.includes('r') && !useUltCombo) continue;

      // 2. 첫 스킬이 사용 가능한지 체크 (진입 가능 여부)
      if (this.canUseSkill(player, hero, combo[0], dist)) {
        return combo;
      }
    }
    
    return null;
  }

  private static canUseSkill(player: LivePlayer, hero: Hero, key: SkillKey, dist: number): boolean {
    const skill = hero.skills[key];
    const cooldown = (player.cooldowns as any)[key];
    const cost = skill.cost || 0;
    
    // 쿨타임 & 마나 체크
    if (cooldown > 0 || player.currentMp < cost) return false;

    // 사거리 체크 (타겟팅 스킬인 경우만)
    // 일부 스킬(버프/이동기)은 사거리 무관하게 사용 가능하다고 가정할 수도 있으나, 
    // 여기서는 간단하게 모든 스킬에 사거리 체크 (단, 0이면 자가버프로 간주)
    if (skill.range > 0 && dist > (skill.range / 100) + 1.0) return false;

    return true;
  }
}
