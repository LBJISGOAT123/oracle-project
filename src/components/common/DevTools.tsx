// src/components/common/DevTools.tsx
import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { Trash2 } from 'lucide-react';

export const DevTools = () => {
  const { resetHeroStats } = useGameStore();

  const handleReset = () => {
    if (window.confirm('모든 챔피언의 누적 통계(승률, KDA, 판수)를 0으로 초기화하시겠습니까?\n\n*현재 진행 중인 게임에는 영향을 주지 않습니다.')) {
      resetHeroStats();
      alert('통계가 초기화되었습니다. 이제 새로운 게임 결과가 즉시 승률에 반영됩니다.');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: 9999
    }}>
      <button 
        onClick={handleReset}
        style={{
          background: '#e74c3c',
          color: 'white',
          border: 'none',
          padding: '10px 15px',
          borderRadius: '8px',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '13px',
          fontWeight: 'bold'
        }}
      >
        <Trash2 size={16} />
        통계 초기화
      </button>
    </div>
  );
};