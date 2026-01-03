// ==========================================
// FILE PATH: /src/components/user/TierUserListModal.tsx
// ==========================================

import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../store/useGameStore';
// [경로 수정됨] system 폴더 추가
import { getUsersInTier } from '../../engine/system/UserManager';
import { UserProfile } from '../../types';
import { X, Trophy } from 'lucide-react';

interface Props {
  tierName: string;
  onClose: () => void;
  onUserClick: (u: UserProfile) => void;
}

export const TierUserListModal: React.FC<Props> = ({ tierName, onClose, onUserClick }) => {
  const { gameState } = useGameStore();
  const [users, setUsers] = useState<UserProfile[]>([]);

  useEffect(() => {
    const list = getUsersInTier(tierName, gameState.tierConfig);
    setUsers(list);
  }, [tierName, gameState.tierConfig]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  // 랭킹별 색상 반환 함수
  const getRankStyle = (index: number) => {
    if (index === 0) return { color: '#FFD700', scale: 1.2 }; // Gold
    if (index === 1) return { color: '#C0C0C0', scale: 1.1 }; // Silver
    if (index === 2) return { color: '#CD7F32', scale: 1.05 }; // Bronze
    return { color: '#666', scale: 1 };
  };

  return (
    <div 
      onClick={handleBackdropClick}
      style={{ 
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
        background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', 
        zIndex: 1500, backdropFilter: 'blur(5px)', padding: '15px'
      }}
    >
      <div className="panel" style={{ 
        width: '100%', maxWidth: '450px', maxHeight: '80vh',
        background: '#161b22', border: '1px solid #30363d', 
        display: 'flex', flexDirection: 'column', 
        borderRadius: '16px', overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}>

        {/* 헤더 */}
        <div style={{ 
          padding: '16px 20px', background: '#0d1117', borderBottom: '1px solid #30363d', 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Trophy size={18} color="#e89d40" />
            <h3 style={{ margin: 0, fontSize: '16px', color: '#fff', fontWeight: 'bold' }}>
              {tierName} <span style={{ color:'#8b949e', fontSize:'13px', fontWeight:'normal' }}>TOP {users.length}</span>
            </h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#8b949e', cursor: 'pointer', padding:'4px' }}>
            <X size={24} />
          </button>
        </div>

        {/* 유저 리스트 */}
        <div style={{ flex: 1, overflowY: 'auto', background: '#161b22' }}>
          {users.map((u, i) => {
            const rankStyle = getRankStyle(i);
            const isTop3 = i < 3;

            return (
              <div 
                key={u.id}
                onClick={() => onUserClick(u)}
                style={{ 
                  display: 'flex', alignItems: 'center',
                  padding: '12px 16px', 
                  borderBottom: '1px solid #21262d', 
                  cursor: 'pointer',
                  background: isTop3 ? `rgba(255, 215, 0, ${0.05 - (i * 0.015)})` : 'transparent'
                }}
              >
                {/* 1. 순위 */}
                <div style={{ 
                  width: '40px', textAlign: 'center', 
                  fontSize: isTop3 ? '18px' : '14px', 
                  fontWeight: '900', fontStyle: 'italic',
                  color: rankStyle.color,
                  marginRight: '12px'
                }}>
                  {i + 1}
                </div>

                {/* 2. 유저 정보 */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '14px' }}>
                    {u.name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#8b949e', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ color: '#e89d40', fontWeight:'bold' }}>{u.score} LP</span>
                    <span style={{ width: '3px', height: '3px', background: '#444', borderRadius: '50%' }}></span>
                    <span>Lv.{Math.floor(u.totalGames / 10) + 1}</span>
                  </div>
                </div>

                {/* 3. 승률 */}
                <div style={{ textAlign: 'right' }}>
                  <div style={{ 
                    fontSize: '14px', fontWeight: 'bold', 
                    color: u.winRate >= 60 ? '#ff4d4d' : u.winRate >= 50 ? '#3fb950' : '#8b949e' 
                  }}>
                    {u.winRate.toFixed(1)}%
                  </div>
                  <div style={{ fontSize: '11px', color: '#666' }}>
                    {u.totalGames}전
                  </div>
                </div>
              </div>
            );
          })}

          {users.length === 0 && (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#555', fontSize: '14px' }}>
              <div style={{ fontSize:'24px', marginBottom:'10px' }}>🕵️</div>
              이 티어에 배치된 유저가 없습니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};