// ==========================================
// FILE PATH: /src/components/battle/jungle/JungleSpot.tsx
// ==========================================
import React from 'react';
import { Skull, Star } from 'lucide-react';

interface Props {
  x: number; // 사용 안 함 (상위에서 제어)
  y: number; // 사용 안 함
  isSelected: boolean;
  isBuff: boolean;
  name: string;
  onClick: () => void;
}

export const JungleSpot: React.FC<Props> = ({ isSelected, isBuff, name, onClick }) => {
  return (
    <div 
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      style={{
        cursor: 'pointer',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        // [중요] 터치 영역을 확실히 확보
        padding: '10px' 
      }}
    >
      <div style={{
        width: isBuff ? '36px' : '28px', 
        height: isBuff ? '36px' : '28px',
        borderRadius: '50%',
        background: isSelected ? '#fff' : '#161b22',
        border: isSelected ? '2px solid #58a6ff' : (isBuff ? '2px solid #f1c40f' : '2px solid #8b949e'),
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: isSelected ? '0 0 15px #58a6ff' : '0 0 5px rgba(0,0,0,0.5)',
        transition: 'transform 0.1s',
        transform: isSelected ? 'scale(1.1)' : 'scale(1)'
      }}>
        {isBuff ? <Star size={18} color={isSelected ? '#58a6ff' : '#f1c40f'} /> : <Skull size={14} color={isSelected ? '#58a6ff' : '#8b949e'} />}
      </div>
      <div style={{
        marginTop: '2px', fontSize: '9px', fontWeight: 'bold',
        color: isSelected ? '#58a6ff' : '#ccc',
        background: 'rgba(0,0,0,0.7)', padding: '2px 6px', borderRadius: '4px',
        whiteSpace: 'nowrap', pointerEvents: 'none'
      }}>
        {name}
      </div>
    </div>
  );
};
