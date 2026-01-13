// ==========================================
// FILE PATH: /src/components/battle/jungle/DraggableMob.tsx
// ==========================================
import React, { useRef } from 'react';
import { JungleSpot } from './JungleSpot';

interface Props {
  spotId: string;
  x: number;
  y: number;
  name: string;
  isBuff: boolean;
  isSelected: boolean;
  isDragging: boolean;
  dragPos: { x: number, y: number };
  onSelect: () => void;
  onDragStart: (spotId: string, clientX: number, clientY: number) => void;
}

export const DraggableMob: React.FC<Props> = ({ 
  spotId, x, y, name, isBuff, isSelected, isDragging, dragPos, onSelect, onDragStart 
}) => {
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const isMoved = useRef(false);

  // 현재 표시될 위치 (드래그 중이면 dragPos, 아니면 원래 좌표)
  const displayX = isDragging ? dragPos.x : x;
  const displayY = isDragging ? dragPos.y : y;

  const handlePointerDown = (e: React.PointerEvent) => {
    // 이벤트 버블링 막아서 맵 스크롤과 간섭 방지
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    
    isMoved.current = false;

    // 0.2초 이상 누르면 드래그 시작으로 간주
    longPressTimer.current = setTimeout(() => {
      onDragStart(spotId, e.clientX, e.clientY);
    }, 200);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
      
      // 드래그가 시작되지 않았고, 움직이지 않았다면 '클릭(선택)'으로 간주
      if (!isDragging && !isMoved.current) {
        onSelect();
      }
    }
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const handlePointerMove = () => {
    // 아주 미세한 움직임은 무시하도록 할 수 있으나, 여기선 단순화
    isMoved.current = true;
  };

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerMove={handlePointerMove}
      style={{
        position: 'absolute',
        left: `${displayX}%`,
        top: `${displayY}%`,
        transform: 'translate(-50%, -50%)',
        zIndex: isDragging ? 100 : 10,
        // 드래그 중이 아니면 스크롤 허용, 몹 자체는 터치 액션 막음
        touchAction: 'none', 
        cursor: isDragging ? 'grabbing' : 'pointer'
      }}
    >
      <JungleSpot 
        x={0} y={0} // 좌표는 상위 div가 제어함
        name={name}
        isBuff={isBuff}
        isSelected={isSelected}
        onClick={() => {}} // Pointer 이벤트로 통합 처리하므로 빈 함수
      />
      {isDragging && (
        <div style={{
          position:'absolute', top:'-30px', left:'50%', transform:'translateX(-50%)',
          background:'#58a6ff', color:'#000', fontSize:'10px', fontWeight:'bold',
          padding:'2px 6px', borderRadius:'4px', whiteSpace:'nowrap', pointerEvents:'none'
        }}>
          이동 중
        </div>
      )}
    </div>
  );
};
