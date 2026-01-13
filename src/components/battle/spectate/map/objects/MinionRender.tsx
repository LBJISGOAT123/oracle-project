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
        
        // [신규] 소환된 거신병 스타일
        if (m.type === 'SUMMONED_COLOSSUS') {
            return (
                <div
                    key={m.id}
                    id={`minion-${m.id}`}
                    style={{
                        position: 'absolute',
                        left: `${m.x}%`,
                        top: `${m.y}%`,
                        width: '24px',
                        height: '24px',
                        backgroundColor: isBlue ? '#a658ff' : '#ff5858', // 보라/빨강
                        borderRadius: '50%',
                        border: '2px solid #fff',
                        transform: 'translate(-50%, -50%)',
                        zIndex: 15,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 0 10px #a658ff',
                        transition: 'none'
                    }}
                >
                    <Skull size={14} color="#fff" />
                </div>
            );
        }

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
