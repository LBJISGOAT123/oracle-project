// ==========================================
// FILE PATH: /src/components/battle/BattlefieldTab.tsx
// ==========================================

import React, { useState, useRef } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { Skull, Ghost, Shield, Zap, Info, Move } from 'lucide-react';
import { BattlefieldPatchModal } from './BattlefieldPatchModal';
import { SpectateMap } from './spectate/SpectateMap'; 
import { MapObjectIcon } from './ui/MapObjectIcon';
import { JunglePatchModal } from './jungle/JunglePatchModal';
import { JungleCampType } from '../../types/jungle';

export const BattlefieldTab: React.FC = () => {
  const { gameState, updateObjectPosition } = useGameStore();
  const positions = gameState.fieldSettings.positions;

  // [모달 상태]
  const [editingTarget, setEditingTarget] = useState<{ key: string, title: string, color: string } | null>(null);
  const [jungleModal, setJungleModal] = useState<JungleCampType | null>(null);

  // [드래그 상태]
  const [isDragging, setIsDragging] = useState<string | null>(null);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 드래그 종료 (저장)
  const handlePointerUp = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    if (isDragging) {
        updateObjectPosition(isDragging, dragPos.x, dragPos.y);
        setIsDragging(null);
    }
  };

  // 드래그 중 이동
  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDragging && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
        const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
        setDragPos({ x, y });
    }
  };

  // [핵심] 드래그 가능한 오브젝트 래퍼
  const DraggableObject = ({ objKey, x, y, icon, color, size, label, title, isJungle = false, jungleType }: any) => {
    const isTarget = isDragging === objKey;
    const displayX = isTarget ? dragPos.x : x;
    const displayY = isTarget ? dragPos.y : y;

    const handleDown = (e: React.PointerEvent) => {
        // 텍스트 선택 방지 및 이벤트 전파 차단
        e.preventDefault(); 
        
        longPressTimer.current = setTimeout(() => {
            setIsDragging(objKey);
            setDragPos({ x, y });
        }, 300); // 0.3초 꾹 누르면 드래그 시작
    };

    const handleClick = () => {
        if (!isTarget) {
            if (isJungle && jungleType) {
                setJungleModal(jungleType);
            } else {
                // [버그 수정] 포탑 개별 키(towers.blue.mid.0)를 공통 설정 키(towers.t1)로 변환
                let settingKey = objKey;
                
                if (objKey.startsWith('towers.')) {
                    if (objKey.includes('nexus')) {
                        settingKey = 'towers.nexus';
                    } else {
                        // 예: towers.blue.mid.0 -> parts[3]이 인덱스(0, 1, 2)
                        const parts = objKey.split('.');
                        const tierIdx = parseInt(parts[3]); 
                        // 인덱스 0 -> t1, 1 -> t2, 2 -> t3
                        settingKey = `towers.t${tierIdx + 1}`;
                    }
                }
                
                // 변환된 키로 모달 열기 (이제 값이 정상적으로 뜹니다)
                setEditingTarget({ key: settingKey, title, color });
            }
        }
    };

    return (
        <div onPointerDown={handleDown} style={{ position:'absolute', left:0, top:0, width:'100%', height:'100%', pointerEvents:'none' }}>
            <div style={{ pointerEvents:'auto' }}>
                <MapObjectIcon 
                    x={displayX} y={displayY} 
                    size={size} color={isTarget ? '#fff' : color} 
                    icon={isTarget ? <Move size={20}/> : icon} 
                    label={isTarget ? '이동 중...' : label}
                    onClick={handleClick}
                />
            </div>
        </div>
    );
  };

  const renderTowers = (side: 'blue' | 'red') => {
    const isBlue = side === 'blue';
    const color = isBlue ? '#58a6ff' : '#e84057';
    const coords = positions.towers[side];

    return (
      <>
        {(['top', 'mid', 'bot'] as const).map(lane => (
          coords[lane].map((pos: any, index: number) => {
            const tier = index + 1; 
            const showLabel = isBlue && lane === 'top' ? `${tier}차` : undefined;
            return (
              <DraggableObject 
                key={`towers.${side}.${lane}.${index}`}
                objKey={`towers.${side}.${lane}.${index}`}
                x={pos.x} y={pos.y} size={24} color={color} 
                icon={<Shield size={12}/>} label={showLabel}
                title={`${tier}차 포탑 (${lane.toUpperCase()})`}
              />
            );
          })
        ))}
        {/* 넥서스 */}
        <DraggableObject 
            key={`towers.${side}.nexus`}
            objKey={`towers.${side}.nexus`}
            x={coords.nexus.x} y={coords.nexus.y} size={36} color={color} 
            icon={<Shield size={18}/>} label={isBlue ? "수호자" : undefined}
            title="수호자 (넥서스)"
        />
      </>
    );
  };

  const jungleTypes: JungleCampType[] = ['TOP_BLUE', 'BOT_BLUE', 'TOP_RED', 'BOT_RED'];

  return (
    <div style={{ height: 'calc(100vh - 200px)', minHeight: '600px', display: 'flex', flexDirection: 'column', background: '#0d1117' }}
         onPointerUp={handlePointerUp} // 드래그 해제 (화면 전체 감지)
    >
      <div style={{ padding: '15px 20px', background: '#161b22', borderBottom: '1px solid #30363d', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Info size={18} color="#58a6ff" />
        <div style={{ fontSize: '13px', color: '#ccc' }}>
          <strong style={{ color: '#fff' }}>전장 에디터:</strong> 아이콘을 <strong style={{color:'#f1c40f'}}>길게 눌러</strong> 위치 이동, 클릭하여 스탯/몬스터를 설정하세요.
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', overflow: 'hidden' }}>
        <div 
            ref={containerRef}
            onPointerMove={handlePointerMove}
            style={{ 
              position: 'relative', width: '100%', maxWidth: '700px', aspectRatio: '1/1',
              border: '1px solid #30363d', borderRadius: '12px', overflow: 'hidden',
              boxShadow: '0 0 50px rgba(0,0,0,0.5)', touchAction: 'none' 
            }}
        >
          <SpectateMap />

          {/* 타워 */}
          {renderTowers('blue')}
          {renderTowers('red')}

          {/* 거신병 & 주시자 */}
          <DraggableObject objKey="colossus" x={positions.colossus.x} y={positions.colossus.y} size={40} color="#a658ff" label="거신병" title="거신병" icon={<Skull/>} />
          <DraggableObject objKey="watcher" x={positions.watcher.x} y={positions.watcher.y} size={40} color="#e67e22" label="주시자" title="주시자" icon={<Zap/>} />

          {/* 정글 4곳 */}
          {positions.jungle.map((pos, idx) => (
             <DraggableObject 
                key={`jungle.${idx}`} 
                objKey={`jungle.${idx}`} 
                x={pos.x} y={pos.y} 
                size={28} color="#2ecc71" icon={<Ghost/>} 
                label={idx < 2 ? (idx === 0 ? "심연(Top)" : "심연(Bot)") : undefined}
                title="정글 캠프"
                isJungle={true}
                jungleType={jungleTypes[idx]}
             />
          ))}

        </div>
      </div>

      {editingTarget && (
        <BattlefieldPatchModal 
          targetKey={editingTarget.key} 
          title={editingTarget.title} 
          color={editingTarget.color} 
          onClose={() => setEditingTarget(null)} 
        />
      )}

      {jungleModal && (
        <JunglePatchModal 
            campType={jungleModal} 
            onClose={() => setJungleModal(null)} 
        />
      )}
    </div>
  );
};
