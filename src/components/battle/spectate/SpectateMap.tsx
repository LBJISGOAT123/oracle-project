import React from 'react';
import { useGameStore } from '../../store/useGameStore';

export const SpectateMap: React.FC = () => {
  const { gameState } = useGameStore();
  const mapImage = gameState.customImages?.['map_bg'];

  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: '#0a0f0a', 
      overflow: 'hidden', zIndex: 0
    }}>
      {/* 1. 업로드된 이미지가 있으면 사용 */}
      {mapImage ? (
        <div style={{
          width: '100%', height: '100%',
          backgroundImage: `url(${mapImage})`,
          backgroundSize: '100% 100%',
          backgroundPosition: 'center',
          opacity: 0.6
        }} />
      ) : (
        /* 2. 이미지가 없으면 CSS로 그린 기본 맵 사용 */
        <div style={{ width: '100%', height: '100%', position: 'relative', background: '#1e272e' }}>
          {/* 강 (River) */}
          <div style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            background: 'linear-gradient(135deg, transparent 40%, #0984e3 45%, #0984e3 55%, transparent 60%)',
            opacity: 0.3
          }} />
          
          {/* 라인 가이드 (Top/Mid/Bot) */}
          <svg width="100%" height="100%" style={{ position: 'absolute', opacity: 0.1 }}>
            <path d="M 5 95 L 5 15 Q 5 5 15 5 L 95 5" fill="none" stroke="#fff" strokeWidth="20" />
            <line x1="5" y1="95" x2="95" y2="5" stroke="#fff" strokeWidth="20" />
            <path d="M 5 95 L 85 95 Q 95 95 95 85 L 95 5" fill="none" stroke="#fff" strokeWidth="20" />
          </svg>

          {/* 정글 구역 표시 */}
          <div style={{ position: 'absolute', top: '25%', left: '25%', width: '15%', height: '15%', border: '2px dashed #444', borderRadius: '50%', opacity: 0.2 }} />
          <div style={{ position: 'absolute', bottom: '25%', right: '25%', width: '15%', height: '15%', border: '2px dashed #444', borderRadius: '50%', opacity: 0.2 }} />
        </div>
      )}

      {/* 3. 좌표 그리드 (디버깅용, 아주 옅게) */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(#ffffff11 1px, transparent 1px), linear-gradient(90deg, #ffffff11 1px, transparent 1px)',
        backgroundSize: '10% 10%',
        pointerEvents: 'none'
      }} />
    </div>
  );
};
