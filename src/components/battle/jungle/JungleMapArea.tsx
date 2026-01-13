// ==========================================
// FILE PATH: /src/components/battle/jungle/JungleMapArea.tsx
// ==========================================
import React, { useRef, useState } from 'react';
import { JungleCampConfig } from '../../../types/jungle';
import { DraggableMob } from './DraggableMob';
import { useGameStore } from '../../../store/useGameStore';

interface Props {
  config: JungleCampConfig;
  selectedSpotId: string | null;
  onSelectSpot: (spotId: string) => void;
  onUpdatePos: (spotId: string, x: number, y: number) => void;
  isMobile: boolean;
}

// 둥지별 카메라 중심점 (이미지 매칭용)
const CAMP_CENTERS: Record<string, {x: number, y: number}> = {
  'TOP_BLUE': { x: 22, y: 38 },
  'BOT_BLUE': { x: 38, y: 77 },
  'TOP_RED':  { x: 63, y: 22 },
  'BOT_RED':  { x: 77, y: 62 }  
};

export const JungleMapArea: React.FC<Props> = ({ config, selectedSpotId, onSelectSpot, onUpdatePos, isMobile }) => {
  const { gameState } = useGameStore();
  const mapImage = gameState.customImages?.['map_bg'];
  const center = CAMP_CENTERS[config.id] || { x: 50, y: 50 };

  const containerRef = useRef<HTMLDivElement>(null);
  
  // 드래그 상태 관리 (상위에서 분리됨)
  const [dragTargetId, setDragTargetId] = useState<string | null>(null);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });

  const handleDragStart = (spotId: string, clientX: number, clientY: number) => {
    setDragTargetId(spotId);
    updateDragPos(clientX, clientY);
  };

  const updateDragPos = (clientX: number, clientY: number) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      // 좌표 변환 (0~100%)
      const x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
      const y = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));
      setDragPos({ x, y });
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (dragTargetId) {
      e.preventDefault(); // 드래그 중에는 스크롤 방지
      updateDragPos(e.clientX, e.clientY);
    }
  };

  const handlePointerUp = () => {
    if (dragTargetId) {
      onUpdatePos(dragTargetId, dragPos.x, dragPos.y);
      setDragTargetId(null);
    }
  };

  return (
    <div 
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      style={{ 
        position: 'relative', width: '100%', height: '100%', 
        background: '#15191f', 
        overflow: 'hidden', // 내부 요소가 튀어나오지 않게
        touchAction: dragTargetId ? 'none' : 'pan-y', // 드래그 중엔 스크롤 막고, 평소엔 허용
        userSelect: 'none'
      }}
    >
      {/* 맵 배경 */}
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

      {/* 안내 문구 */}
      <div style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', 
        fontSize: '11px', fontWeight: 'bold', color: '#888', background:'rgba(0,0,0,0.8)', 
        padding:'4px 12px', borderRadius:'12px', zIndex: 5, pointerEvents: 'none', whiteSpace:'nowrap' 
      }}>
        {dragTargetId ? '원하는 위치에 놓으세요' : '꾹 눌러서 이동 / 터치하여 선택'}
      </div>

      {/* 몬스터들 */}
      {config.monsters.map((mob) => (
        <DraggableMob
          key={mob.spotId}
          spotId={mob.spotId}
          x={mob.x}
          y={mob.y}
          name={mob.stats.name}
          isBuff={mob.stats.isBuffMob}
          isSelected={selectedSpotId === mob.spotId}
          isDragging={dragTargetId === mob.spotId}
          dragPos={dragPos}
          onSelect={() => onSelectSpot(mob.spotId)}
          onDragStart={handleDragStart}
        />
      ))}
    </div>
  );
};
