// ==========================================
// FILE PATH: /src/components/common/GameIcon.tsx
// ==========================================

import React from 'react';
import { useGameStore } from '../../store/useGameStore';

interface Props {
  id: string;
  size?: string | number;
  fallback?: React.ReactNode;
  shape?: 'square' | 'circle' | 'rounded';
  border?: string;
}

export const GameIcon: React.FC<Props> = ({ id, size = 40, fallback, shape = 'rounded', border = '1px solid #444' }) => {
  const { gameState } = useGameStore();
  const customImage = gameState.customImages?.[id];

  const style: React.CSSProperties = {
    width: typeof size === 'number' ? `${size}px` : size,
    height: typeof size === 'number' ? `${size}px` : size,
    borderRadius: shape === 'circle' ? '50%' : shape === 'rounded' ? '12px' : '0',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#21262d',
    border: border,
    flexShrink: 0,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  };

  if (customImage) {
    return (
      <div style={{ ...style, backgroundImage: `url(${customImage})` }} />
    );
  }

  return (
    <div style={style}>
      {fallback || <span style={{fontSize: typeof size === 'number' ? size/2 : '12px'}}>🧙‍♂️</span>}
    </div>
  );
};