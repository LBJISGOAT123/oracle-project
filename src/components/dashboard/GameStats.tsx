// ==========================================
// FILE PATH: /src/components/dashboard/GameStats.tsx
// ==========================================

import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { StatCard } from '../common/StatCard';
import { Users, Activity, Smile, Frown, Meh, Monitor } from 'lucide-react';

interface Props {
  isMobile: boolean;
  onOpenGameList: () => void;
}

export const GameStats: React.FC<Props> = ({ isMobile, onOpenGameList }) => {
  const { gameState } = useGameStore();

  // 민심 상태에 따른 UI 속성 반환
  const getSentimentInfo = (value: number) => {
    if (value >= 70) return { icon: Smile, color: '#2ecc71', label: '축제' }; // 높음: 초록
    if (value >= 40) return { icon: Meh, color: '#f1c40f', label: '보통' };   // 중간: 노랑
    return { icon: Frown, color: '#e74c3c', label: '폭동' };                  // 낮음: 빨강
  };

  const sentiment = gameState.userSentiment || 60;
  const sentInfo = getSentimentInfo(sentiment);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: isMobile ? '6px' : '15px', marginBottom: '20px' }}>

      <StatCard 
        title="가입자" 
        value={(gameState.totalUsers ?? 0).toLocaleString()} 
        icon={Users} 
        color="#fff" 
      />

      <StatCard 
        title="CCU" 
        value={(gameState.ccu ?? 0).toLocaleString()} 
        icon={Activity} 
        color="#58a6ff" 
      />

      {/* 동적 민심 카드 */}
      <StatCard 
        title={`민심 (${sentInfo.label})`} 
        value={sentiment.toFixed(1)} 
        icon={sentInfo.icon} 
        color={sentInfo.color} 
      />

      <div onClick={onOpenGameList} style={{ cursor: 'pointer' }}>
        <StatCard 
          title="진행중" 
          value={gameState.liveMatches?.length ?? 0} 
          icon={Monitor} 
          color="#9b59b6" 
        />
      </div>
    </div>
  );
};