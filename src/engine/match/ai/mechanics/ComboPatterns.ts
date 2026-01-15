// ==========================================
// FILE PATH: /src/engine/match/ai/mechanics/ComboPatterns.ts
// ==========================================
import { Role } from '../../../../types';

export type SkillKey = 'q' | 'w' | 'e' | 'r';
export type ComboSequence = SkillKey[];

/**
 * 역할군별 기본 콤보 패턴 정의
 * (나중에 영웅별 고유 콤보로 확장 가능)
 */
export const ROLE_COMBOS: Record<Role, ComboSequence[]> = {
  '추적자': [ // 암살자: 진입 -> CC/딜 -> 폭딜 -> 마무리
    ['e', 'w', 'q', 'r'], 
    ['e', 'q', 'w'],
    ['w', 'q']
  ],
  '선지자': [ // 마법사: CC걸고 -> 폭딜 -> 궁
    ['e', 'q', 'r'],
    ['w', 'q'],
    ['q', 'r']
  ],
  '집행관': [ // 브루저: 진입 -> 평캔(Q) -> 버티기(W)
    ['e', 'q', 'w'],
    ['q', 'w']
  ],
  '수호기사': [ // 탱커: 진입 -> CC -> 버티기
    ['e', 'w', 'q'],
    ['r', 'w']
  ],
  '신살자': [ // 원딜: 생존기/버프 아끼고 딜링기 위주
    ['q', 'w'],
    ['r']
  ]
};
