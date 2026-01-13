// ==========================================
// FILE PATH: /src/components/battle/spectate/map/objects/MinionRender.tsx
// ==========================================
import React from 'react';
import { Minion } from '../../../../../../types';
import { Skull } from 'lucide-react';

export const MinionRender = ({ minions }: { minions?: Minion[] }) => {
  if (!minions) return null;

  return (
    <>
      {minions.map((m) => {
        const isBlue = m.team === 'BLUE';
        const color = isBlue ? '#58a6ff' : '#e84057';
        
        // [수정] 거신병 렌더링 (체력바 추가)
        if (m.type === 'SUMMONED_COLOSSUS') {
            const hpPercent = (m.hp / m.maxHp) * 100;
            return (
                <div
                    key={m.id}
                    id={`minion-${m.id}`}
                    style={{
                        position: 'absolute',
                        left: `${m.x}%`,
                        top: `${m.y}%`,
                        transform: 'translate(-50%, -50%)',
                        zIndex: 15,
                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                        transition: 'none'
                    }}
                >
                    {/* 체력바 */}
                    <div style={{ width: '40px', height: '6px', background: '#000', borderRadius: '3px', marginBottom: '4px', border: '1px solid #fff', overflow:'hidden' }}>
                        <div style={{ width: `${hpPercent}%`, height: '100%', background: '#a658ff', transition: 'width 0.2s' }} />
                    </div>

                    {/* 본체 아이콘 */}
                    <div style={{
                        width: '28px',
                        height: '28px',
                        backgroundColor: isBlue ? '#a658ff' : '#ff5858', 
                        borderRadius: '50%',
                        border: '2px solid #fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 0 15px #a658ff'
                    }}>
                        <Skull size={18} color="#fff" />
                    </div>
                </div>
            );
        }

        // 일반 미니언
        const size = m.type === 'SIEGE' ? 14 : (m.type === 'MELEE' ? 10 : 8);
        const shape = m.type === 'RANGED' ? '50%' : '3px';
        const border = m.type === 'SIEGE' ? '2px solid #fff' : '1px solid #000';

        return (
          <div
            key={m.id}
            id={`minion-${m.id}`}
            style={{
              position: 'absolute',
              left: `${m.x}%`,
              top: `${m.y}%`,
              width: `${size}px`,
              height: `${size}px`,
              backgroundColor: color,
              borderRadius: shape,
              border: border,
              transform: 'translate(-50%, -50%)',
              zIndex: 4,
              boxShadow: m.type === 'SIEGE' ? '0 0 5px rgba(255,255,255,0.5)' : 'none',
              pointerEvents: 'none',
              transition: 'none' 
            }}
          />
        );
      })}
    </>
  );
};
