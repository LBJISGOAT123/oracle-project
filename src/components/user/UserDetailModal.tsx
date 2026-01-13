// ==========================================
// FILE PATH: /src/components/user/UserDetailModal.tsx
// ==========================================

import React, { useState, useEffect } from 'react';
import { UserProfile } from '../../types';
import { useGameStore } from '../../store/useGameStore';

// 분리된 모듈 임포트
import { ProfileHeader } from './detail/ProfileHeader';
import { StatsOverview } from './detail/StatsOverview';
import { MatchHistoryList } from './detail/MatchHistoryList';

interface Props { user: UserProfile; onClose: () => void; }

export const UserDetailModal: React.FC<Props> = ({ user, onClose }) => {
  const { heroes, gameState } = useGameStore();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 배경 이미지용 (영웅 ID 기반)
  const heroImage = gameState.customImages?.[`${user.mainHeroId}_bg`] || gameState.customImages?.[user.mainHeroId];

  return (
    <div style={{ 
      position: 'fixed', inset: 0, zIndex: 9999, 
      backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)',
      display: 'flex', justifyContent: 'center', alignItems: isMobile ? 'flex-end' : 'center',
      padding: isMobile ? 0 : '20px'
    }}>
      <div className="panel-content" style={{ 
        width: '100%', maxWidth: '900px', 
        height: isMobile ? '90vh' : '85vh',
        background: '#0d1117', border: '1px solid #30363d', borderRadius: isMobile ? '16px 16px 0 0' : '16px',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 50px 100px -20px rgba(0,0,0,0.8)'
      }}>
        
        {/* 1. 상단 헤더 모듈 */}
        <ProfileHeader user={user} onClose={onClose} heroImage={heroImage} />

        {/* 2. 메인 컨텐츠 (스크롤 영역) */}
        <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '15px' : '25px', display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '25px' }}>
          
          {/* 좌측: 분석 및 스탯 */}
          <div style={{ flex: 1, minWidth: isMobile ? '100%' : '300px', display:'flex', flexDirection:'column', gap:'20px' }}>
            <StatsOverview user={user} />
            
            {/* 선호 포지션 (간단 표시) */}
            <div style={{ background: '#161b22', padding: '15px', borderRadius: '12px', border: '1px solid #30363d', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <span style={{ fontSize:'12px', color:'#888', fontWeight:'bold' }}>선호 포지션</span>
              <span style={{ fontSize:'14px', color:'#fff', fontWeight:'900' }}>{user.preferredLane}</span>
            </div>
          </div>

          {/* 우측: 챔피언 및 전적 */}
          <div style={{ flex: 1.5, minWidth: isMobile ? '100%' : '400px' }}>
            <MatchHistoryList user={user} heroes={heroes} />
          </div>

        </div>
      </div>
    </div>
  );
};
