// ==========================================
// FILE PATH: /src/engine/match/RoleManager.ts
// ==========================================

import { Role, LivePlayer, RoleSettings } from '../../../types';

// 기본값 (설정 로드 실패 시 안전장치)
const DEFAULT_SETTINGS: RoleSettings = {
  executor: { damage: 15, defense: 15 },
  tracker: { gold: 20, smiteChance: 1.5 },
  prophet: { cdrPerLevel: 2 },
  slayer: { structureDamage: 30 },
  guardian: { survivalRate: 20 }
};

export const applyRoleBonus = (
  player: LivePlayer, 
  role: Role, 
  isSiegeMode: boolean, 
  allies: LivePlayer[],
  settings: RoleSettings = DEFAULT_SETTINGS // [중요] 설정값 인자 추가
) => {
  let damageMod = 1.0;
  let defenseMod = 1.0;
  let siegeMod = 1.0;

  switch (role) {
    case '집행관': 
      // 고립 시 보너스 (설정된 %만큼 증가)
      const nearbyAllies = allies.filter(a => a.lane === player.lane && a.heroId !== player.heroId).length;
      if (nearbyAllies === 0) {
        damageMod = 1 + (settings.executor.damage / 100); 
        defenseMod = 1 + (settings.executor.defense / 100);
      }
      break;

    case '추적자': 
      // 정글러 기본 보정
      damageMod = 1.05; 
      break;

    case '선지자': 
      // 레벨당 설정된 %만큼 데미지 보너스 (쿨감을 딜량으로 환산)
      // 예: 레벨 10 * 2% = 20% 데미지 증가
      damageMod = 1 + ((player.level * settings.prophet.cdrPerLevel) / 100);
      break;

    case '신살자': 
      if (isSiegeMode) {
        // 구조물 피해량 보너스
        siegeMod = 1 + (settings.slayer.structureDamage / 100);
      }
      if (player.items.length >= 3) {
        damageMod = 1.25;
      }
      break;

    case '수호기사': 
      // 방어력 보너스
      defenseMod = 1.3; 
      damageMod = 0.6;  
      break;
  }

  return { damageMod, defenseMod, siegeMod };
};

// 정글러 강타 확률 보정
export const getSmiteChance = (role: Role, settings: RoleSettings = DEFAULT_SETTINGS) => {
  return role === '추적자' ? settings.tracker.smiteChance : 1.0; 
};