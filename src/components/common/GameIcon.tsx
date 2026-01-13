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
  const customImages = useGameStore(state => state.gameState.customImages);
  
  // 이미지가 존재하는지 확인
  const imageUrl = customImages?.[id];
  const [hasError, setHasError] = useState(false);

  // ID가 바뀌면 에러 상태 초기화 (새로운 이미지는 다시 시도해봐야 하므로)
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
    background: '#1c1c1f', // 이미지가 로딩되기 전 보여줄 배경색
    border: border,
    flexShrink: 0,
    position: 'relative',
  };

  // 1. 이미지가 있고, 에러가 나지 않은 경우 -> 이미지 렌더링
  if (imageUrl && !hasError) {
    return (
      <div style={style}>
        <img 
          src={imageUrl} 
          alt={id}
          loading="lazy"
          decoding="async"
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover', 
            display: 'block'
          }}
          onError={(e) => {
            console.warn(`이미지 로드 실패: ${id}`);
            e.currentTarget.style.display = 'none'; // 깨진 이미지 숨김
            setHasError(true); // 에러 상태로 전환하여 Fallback 표시
          }}
        />
        {/* 로딩 중 깜빡임 방지를 위해 뒤에 Fallback을 깔아둠 */}
        <div style={{ position: 'absolute', inset:0, zIndex: -1, display:'flex', alignItems:'center', justifyContent:'center', opacity: 0.3 }}>
           {fallback || <div style={{width:'50%', height:'50%', background:'#555', borderRadius:'50%'}}/>}
        </div>
      </div>
    );
  }

  // 2. 이미지가 없거나 에러가 난 경우 -> Fallback 렌더링
  return (
    <div style={style}>
      {fallback || (
        // 기본 Fallback: 영웅/아이템 ID의 첫 글자 표시
        <span style={{ fontSize: '12px', color: '#666', fontWeight:'bold', textTransform:'uppercase' }}>
          {id.split('_')[1]?.substring(0, 2) || '??'}
        </span>
      )} 
    </div>
  );
};
