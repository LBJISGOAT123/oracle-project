// ==========================================
// FILE PATH: /src/components/common/GameIcon.tsx
// ==========================================

import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../store/useGameStore';

interface Props {
  id: string; 
  size?: string | number;
  fallback?: React.ReactNode;
  shape?: 'square' | 'circle' | 'rounded';
  border?: string;
}

export const GameIcon: React.FC<Props> = ({ id, size = 40, fallback, shape = 'rounded', border = '1px solid #333' }) => {
  const gameState = useGameStore(state => state.gameState);

  // 1. 커스텀 이미지(업로드된 것) 확인
  // 2. 없으면 초기 데이터(경로) 확인
  // 3. 둘 다 없으면 null
  const imageUrl = (gameState?.customImages && gameState.customImages[id]) 
    ? gameState.customImages[id] 
    : null;

  // 이미지 로드 에러 상태 관리
  const [hasError, setHasError] = useState(false);

  // ID가 바뀌면 에러 상태 초기화 (새 이미지 시도)
  useEffect(() => {
    setHasError(false);
  }, [id, imageUrl]);

  const style: React.CSSProperties = {
    width: typeof size === 'number' ? `${size}px` : size,
    height: typeof size === 'number' ? `${size}px` : size,
    borderRadius: shape === 'circle' ? '50%' : shape === 'rounded' ? '12px' : '0',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#1c1c1f', // 이미지가 없을 때의 배경색 (어두운 회색)
    border: border,
    flexShrink: 0,
    position: 'relative',
  };

  // 1. 이미지가 있고, 에러가 안 났을 때 -> 이미지 렌더링
  if (imageUrl && !hasError) {
    return (
      <div style={style}>
        <img 
          src={imageUrl} 
          alt={id}
          onError={() => setHasError(true)} // 로드 실패 시 에러 상태로 전환
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover', // 배경이미지처럼 꽉 차게
            display: 'block'
          }} 
        />
      </div>
    );
  }

  // 2. 이미지가 없거나 로드 실패 시 -> 빈칸(혹은 Fallback) 렌더링
  return (
    <div style={style}>
      {/* fallback이 있으면 그걸 보여주고, 없으면 그냥 빈칸(어두운 배경) 유지 */}
      {fallback || <span style={{ opacity: 0 }}></span>} 
    </div>
  );
};