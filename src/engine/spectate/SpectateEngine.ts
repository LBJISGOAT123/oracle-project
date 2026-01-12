// ==========================================
// FILE PATH: /src/engine/spectate/SpectateEngine.ts
// ==========================================

export const MAP = {
  BLUE_BASE: { x: 15, y: 85 },
  RED_BASE: { x: 85, y: 15 },
  CENTER: { x: 50, y: 50 }
};

// [보간 함수] 현재 UI 좌표(current)를 목표 시뮬레이션 좌표(target)로 부드럽게 이동
export const lerpPosition = (current: {x:number, y:number}, target: {x:number, y:number}, factor: number) => {
  const dx = target.x - current.x;
  const dy = target.y - current.y;
  
  // 거리가 너무 멀면(텔레포트, 귀환 등) 순간이동 처리 (부드러운 이동 생략)
  if (Math.abs(dx) > 20 || Math.abs(dy) > 20) return target;

  return {
    x: current.x + dx * factor,
    y: current.y + dy * factor
  };
};
