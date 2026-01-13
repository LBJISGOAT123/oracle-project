// ==========================================
// FILE PATH: /src/components/battle/jungle/JungleCampMap.tsx
// ==========================================
import React, { useRef } from 'react';
import { JungleCampConfig } from '../../../types/jungle';
import { JungleSpot } from './JungleSpot';
import { useGameStore } from '../../../store/useGameStore';

interface Props {
  config: JungleCampConfig;
  selectedSpotId: string | null;
  onSelectSpot: (spotId: string) => void;
  onDragStart: (spotId: string, x: number, y: number) => void;
  dragTargetId: string | null;
  dragPos: { x: number, y: number };
}

// 카메라 중심점 (배경 이미지 위치 맞춤)
const CAMP_CENTERS: Record<string, {x: number, y: number}> = {
  'TOP_BLUE': { x: 22, y: 38 },
  'BOT_BLUE': { x: 38, y: 77 },
  'TOP_RED':  { x: 63, y: 22 },
  'BOT_RED':  { x: 77, y: 62 }  
};

export const JungleCampMap: React.FC<Props> = ({ config, selectedSpotId, onSelectSpot, onDragStart, dragTargetId, dragPos }) => {
  const { gameState } = useGameStore();
  const mapImage = gameState.customImages?.['map_bg'];
  const center = CAMP_CENTERS[config.id] || { x: 50, y: 50 };

  const containerRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const startTouchPos = useRef<{x: number, y: number} | null>(null);

  // [수정] 드래그 시작 로직 강화
  const handleSpotDown = (spotId: string, e: React.PointerEvent | React.TouchEvent) => {
    // 이벤트 전파 방지 (상위 스크롤 막기)
    e.stopPropagation();
    
    let clientX, clientY;
    if ('touches' in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = (e as React.PointerEvent).clientX;
        clientY = (e as React.PointerEvent).clientY;
    }

    startTouchPos.current = { x: clientX, y: clientY };

    if (longPressTimer.current) clearTimeout(longPressTimer.current);

    // 0.2초 꾹 누르면 드래그 시작 (시간 약간 늘려서 오동작 방지)
    longPressTimer.current = setTimeout(() => {
        // 드래그 시작 시 현재 좌표로 초기화
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
            const y = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));
            onDragStart(spotId, x, y);
        }
        startTouchPos.current = null; // 드래그 모드 진입 완료
    }, 200); 
  };

  // [수정] 터치 이동 중 로직 (민감도 완화)
  const handleMove = (clientX: number, clientY: number) => {
    // 1. 롱프레스 대기 중일 때 (아직 드래그 시작 안함)
    if (longPressTimer.current && startTouchPos.current) {
        const moveDist = Math.sqrt(
            Math.pow(clientX - startTouchPos.current.x, 2) + 
            Math.pow(clientY - startTouchPos.current.y, 2)
        );
        // 15px 이상 움직이면 '스크롤' 의도로 간주하고 타이머 취소
        if (moveDist > 15) { 
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
            startTouchPos.current = null;
        }
        return;
    }

    // 2. 이미 드래그 중일 때 (좌표 업데이트)
    if (dragTargetId && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        // 맵 밖으로 나가지 않게 클램핑 (5% ~ 95%)
        const x = Math.max(5, Math.min(95, ((clientX - rect.left) / rect.width) * 100));
        const y = Math.max(5, Math.min(95, ((clientY - rect.top) / rect.height) * 100));
        
        // onDragStart를 재활용하여 위치 업데이트 (상위 컴포넌트 state 갱신)
        onDragStart(dragTargetId, x, y);
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
      e.preventDefault();
      handleMove(e.clientX, e.clientY);
  };
  
  const onTouchMove = (e: React.TouchEvent) => {
      // 터치 스크롤 방지 (드래그 중일 때만)
      if (dragTargetId) e.preventDefault();
      handleMove(e.touches[0].clientX, e.touches[0].clientY);
  };

  const handleEnd = () => {
    if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
    }
    startTouchPos.current = null;
    // 드래그 종료 처리는 상위 컴포넌트(JunglePatchModal)의 onPointerUp에서 수행됨
  };

  return (
    <div 
      ref={containerRef}
      onPointerMove={onPointerMove}
      onTouchMove={onTouchMove}
      onPointerUp={handleEnd}
      onPointerLeave={handleEnd}
      onTouchEnd={handleEnd}
      onContextMenu={(e) => e.preventDefault()}
      style={{ 
        position: 'relative', width: '100%', height: '100%', 
        background: '#15191f', 
        border: '2px solid #30363d', borderRadius: '12px',
        overflow: 'hidden', boxShadow: 'inset 0 0 30px rgba(0,0,0,0.8)',
        touchAction: 'none', // 맵 내부에서는 브라우저 스크롤 비활성화 (드래그 우선)
        userSelect: 'none',
        WebkitUserSelect: 'none'
      }}
    >
      {mapImage ? (
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(${mapImage})`,
          backgroundSize: '160%', 
          backgroundPosition: `${center.x}% ${center.y}%`,
          opacity: 0.9, 
          filter: 'contrast(1.15) brightness(0.9)', 
          zIndex: 0, pointerEvents: 'none'
        }} />
      ) : (
        <div style={{ position: 'absolute', inset: 0, background: '#222', zIndex: 0 }} />
      )}

      <div style={{ position: 'absolute', top: 10, left: 10, fontSize: '12px', fontWeight: 'bold', color: '#fff', background:'rgba(0,0,0,0.7)', padding:'4px 10px', borderRadius:'6px', zIndex: 5, pointerEvents: 'none' }}>
        {config.name}
      </div>

      <div style={{ position: 'relative', width: '100%', height: '100%', zIndex: 10 }}>
        {config.monsters.map((mob) => {
            const isDragging = dragTargetId === mob.spotId;
            const displayX = isDragging ? dragPos.x : mob.x;
            const displayY = isDragging ? dragPos.y : mob.y;

            return (
              <div 
                key={mob.spotId}
                style={{ 
                    position: 'absolute', 
                    left: `${displayX}%`, top: `${displayY}%`, 
                    transform: 'translate(-50%, -50%)', 
                    zIndex: isDragging ? 100 : 10, // 드래그 중인 건 최상위로
                    cursor: 'grab',
                    touchAction: 'none'
                }}
                onPointerDown={(e) => handleSpotDown(mob.spotId, e)}
                onClick={(e) => { e.stopPropagation(); onSelectSpot(mob.spotId); }}
              >
                <JungleSpot 
                    x={0} y={0} // CSS left/top으로 제어하므로 0
                    name={mob.stats.name}
                    isBuff={mob.stats.isBuffMob}
                    isSelected={selectedSpotId === mob.spotId}
                    onClick={() => {}} // 위쪽 onClick에서 처리
                />
              </div>
            );
        })}
      </div>
    </div>
  );
};
