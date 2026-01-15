import React from 'react';
import { useGameStore } from '../../store/useGameStore';

interface Props {
  id: string; 
  size?: string | number;
  fallback?: React.ReactNode;
  shape?: 'square' | 'circle' | 'rounded';
  border?: string;
}

// React.memo를 써서 불필요한 리렌더링 자체를 막습니다.
export const GameIcon = React.memo(({ id, size = 40, fallback, shape = 'rounded', border = '1px solid #333' }: Props) => {
  const customImages = useGameStore(state => state.gameState.customImages);
  const imageUrl = customImages?.[id];

  const style: React.CSSProperties = {
    width: typeof size === 'number' ? `${size}px` : size,
    height: typeof size === 'number' ? `${size}px` : size,
    borderRadius: shape === 'circle' ? '50%' : shape === 'rounded' ? '12px' : '0',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#1c1c1f', 
    border: border,
    flexShrink: 0,
    position: 'relative',
    
    // [핵심] img 태그 대신 background-image 사용
    // 이러면 이미지 로딩 중/실패/성공 여부와 상관없이 태그 구조가 <div> 하나로 완벽하게 고정됩니다.
    // 리액트가 태그를 뺐다 꼈다 할 일이 없습니다.
    backgroundImage: imageUrl ? `url(${imageUrl})` : 'none',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat'
  };

  return (
    <div style={style}>
      {/* 이미지가 없을 때만 글자 표시 (배경 이미지가 덮으면 자연스럽게 안보임) */}
      {!imageUrl && (
        <div style={{ 
          width:'100%', height:'100%', 
          display: 'flex', alignItems:'center', justifyContent:'center', 
          color: '#666', fontWeight:'bold',
          backgroundColor: 'rgba(0,0,0,0.5)' 
        }}>
           {fallback || (
             <span style={{ fontSize: '12px', textTransform:'uppercase' }}>
               {id ? id.split('_')[1]?.substring(0, 2) || '??' : '??'}
             </span>
           )}
        </div>
      )}
    </div>
  );
});
