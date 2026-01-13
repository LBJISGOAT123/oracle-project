import React from 'react';
import { useGameStore } from '../../../store/useGameStore';

export const SpectateMap: React.FC = () => {
  const { gameState } = useGameStore();
  
  // 업로드된 맵 이미지가 있는지 확인 ('map_bg' 키 사용)
  const mapImage = gameState.customImages?.['map_bg'];

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      background: '#0a0f0a', // 기본 배경색 (이미지 없을 때)
      overflow: 'hidden',
      zIndex: 0
    }}>
      {/* 1. 맵 배경 이미지 레이어 */}
      {mapImage ? (
        <div style={{
          width: '100%',
          height: '100%',
          backgroundImage: `url(${mapImage})`,
          backgroundSize: '100% 100%', // 맵을 꽉 채움
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: 0.8, // 유닛 시인성을 위해 약간 어둡게
          filter: 'contrast(1.1) saturate(1.1)' // 게임 느낌 보정
        }} />
      ) : (
        /* 이미지가 없을 때 보여줄 기본 격자 패턴 */
        <div style={{
          width: '100%', height: '100%',
          backgroundImage: 'linear-gradient(#1a1a1c 1px, transparent 1px), linear-gradient(90deg, #1a1a1c 1px, transparent 1px)',
          backgroundSize: '5% 5%',
          opacity: 0.3
        }} />
      )}

      {/* 2. 라인 가이드 (이미지가 있어도 희미하게 표시하여 경로 확인) */}
      <svg width="100%" height="100%" viewBox="0 0 100 100" style={{ position: 'absolute', top: 0, left: 0, opacity: mapImage ? 0.15 : 0.4, pointerEvents:'none' }}>
        <defs>
          <linearGradient id="riverGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3498db" stopOpacity="0" />
            <stop offset="50%" stopColor="#3498db" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#3498db" stopOpacity="0" />
          </linearGradient>
        </defs>
        
        {/* 강 (River) */}
        <line x1="0" y1="100" x2="100" y2="0" stroke="url(#riverGrad)" strokeWidth="8" />

        {/* 라인 경로 */}
        <g stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" fill="none" strokeDasharray="2,2">
          {/* TOP */}
          <path d="M 5 95 L 5 20 Q 5 5 20 5 L 95 5" />
          {/* MID */}
          <line x1="5" y1="95" x2="95" y2="5" /> 
          {/* BOT */}
          <path d="M 5 95 L 80 95 Q 95 95 95 80 L 95 5" />
        </g>

        {/* 본진 구역 표시 */}
        <circle cx="5" cy="95" r="3" fill="#58a6ff" fillOpacity="0.2" />
        <circle cx="95" cy="5" r="3" fill="#e84057" fillOpacity="0.2" />
      </svg>
    </div>
  );
};
