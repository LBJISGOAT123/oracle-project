// src/components/battle/SpectateMap.tsx
import React from 'react';

export const SpectateMap: React.FC = () => {
  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      background: '#0a0f0a', // 맵 로드 전 기본 배경색
      backgroundImage: `url('https://raw.githubusercontent.com/RiotGames/developer-relations/master/assets/maps/summoners_rift.png')`, 
      backgroundSize: '100% 100%',
      backgroundPosition: 'center',
      opacity: 0.8,
      zIndex: 0
    }}>
      {/* 맵이 안 보일 때를 대비한 최소한의 라인 표시 */}
      <svg width="100%" height="100%" viewBox="0 0 100 100" style={{ position: 'absolute', top: 0, left: 0 }}>
        <g stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" fill="none">
          <path d="M 12 88 L 12 12 L 88 12" /> {/* 탑 */}
          <line x1="12" y1="88" x2="88" y2="12" /> {/* 미드 */}
          <path d="M 12 88 L 88 88 L 88 12" /> {/* 봇 */}
        </g>
      </svg>
    </div>
  );
};