// === FILE: /src/components/common/GameIcon.tsx ===

// ==========================================
// FILE PATH: /src/components/common/GameIcon.tsx
// ==========================================

import React from 'react';
import { useGameStore } from '../../store/useGameStore';

interface Props {
  id: string; // id가 비어있을 수 있음
  size?: string | number;
  fallback?: React.ReactNode;
  shape?: 'square' | 'circle' | 'rounded';
  border?: string;
}

export const GameIcon: React.FC<Props> = ({ id, size = 40, fallback, shape = 'rounded', border = '1px solid #444' }) => {
  // [Safety] useGameStore가 초기화되기 전일 수 있으므로 안전하게 접근
  const gameState = useGameStore(state => state.gameState);
  const customImage = id && gameState && gameState.customImages ? gameState.customImages[id] : null;

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

  // 커스텀 이미지가 있으면 렌더링
  if (customImage) {
    return (
      <div style={{ ...style, backgroundImage: `url(${customImage})` }} />
    );
  }

  // 없으면 fallback 아이콘 또는 기본 물음표
  return (
    <div style={style}>
      {fallback || <span style={{fontSize: typeof size === 'number' ? size/2 : '12px', opacity: 0.5}}>❓</span>}
    </div>
  );
};
