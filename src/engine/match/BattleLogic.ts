// ==========================================
// FILE PATH: /src/engine/match/BattleLogic.ts
// ==========================================
import { LivePlayer, Hero } from '../../types';
import { getDistance, Vector2 } from '../data/MapData';

// 유닛의 현재 상태
export type UnitState = 'IDLE' | 'MOVING' | 'ATTACKING' | 'RECALLING' | 'DEAD';

// --- [이동 로직] ---
// 목표 지점까지 이동. 도착했으면 true 반환
export const moveUnit = (p: LivePlayer, target: Vector2, dt: number, speedVal: number) => {
  const dist = getDistance(p, target);

  // 아주 가깝다면 도착 처리
  if (dist <= 1.0) return true; 

  // 맵 크기 100 기준, 속도 스케일 보정 (대략적인 게임 속도 조절)
  // speedVal(이속)이 보통 300~400 정도이므로 1/100 정도로 줄여서 이동
  const speed = (speedVal / 100) * dt * 0.8; 

  // [수정] 거리가 너무 가까우면(0에 수렴하면) 나누기 0 에러 발생 가능하므로 방어
  if (dist > 0.001) {
      const dx = (target.x - p.x) / dist;
      const dy = (target.y - p.y) / dist;

      p.x += dx * speed;
      p.y += dy * speed;
  }

  // 맵 밖으로 나가지 않게 제한 (0~100)
  p.x = Math.max(0, Math.min(100, p.x));
  p.y = Math.max(0, Math.min(100, p.y));

  return false;
};

// --- [타겟팅 로직] ---
// 사거리 내의 가장 가까운 적 찾기
export const findTarget = (me: LivePlayer, enemies: LivePlayer[], range: number): LivePlayer | null => {
  let target = null;
  // 맵 크기가 100이므로, 사거리(보통 500~600)를 맵 단위(5~6)로 변환
  let minDist = range / 10; 

  for (const e of enemies) {
    // 살아있고 부활 대기중이 아닌 적만 타겟팅
    if (e.currentHp > 0 && e.respawnTimer <= 0) {
      const d = getDistance(me, e);
      if (d < minDist) {
        minDist = d;
        target = e;
      }
    }
  }
  return target;
};

// --- [공격 실행 로직] ---
// *Note: 실제 데미지 계산은 CombatPhase.ts에서 통합 처리하므로, 여기서는 스킬 사용 텍스트 처리 등만 담당할 수도 있음
// 하지만 현재 구조상 이 함수는 PlayerSystem 등에서 직접 호출되지 않고 CombatPhase로 대체되었습니다.
// 하위 호환성을 위해 함수 형태만 유지하거나, 특정 상황(반격 등)에서 쓸 수 있도록 남겨둡니다.
export const executeAttack = (
  attacker: LivePlayer, 
  target: LivePlayer, 
  hero: Hero, 
  dt: number,
  logs: any[],
  time: number
) => {
  // CombatPhase.ts 에서 처리되므로 여기 로직은 비워두거나 단순화 가능
  // (현재 시뮬레이션 구조에서는 CombatPhase가 메인이므로 이 함수는 사용되지 않을 수 있음)
};