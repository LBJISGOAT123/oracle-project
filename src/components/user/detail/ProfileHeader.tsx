import React from 'react';
import { UserProfile } from '../../../types';
import { X, Award, Hash } from 'lucide-react';
import { GameIcon } from '../../common/GameIcon';

interface Props {
  user: UserProfile;
  onClose: () => void;
  heroImage?: string; // 배경용 이미지 URL
}

const getTierColor = (tier: string) => {
  if (tier.includes('챌린저') || tier.includes('천상계')) return '#00bfff';
  if (tier.includes('마스터')) return '#9b59b6';
  if (tier.includes('에이스')) return '#e74c3c';
  if (tier.includes('조커')) return '#2ecc71';
  if (tier.includes('골드')) return '#f1c40f';
  if (tier.includes('실버')) return '#95a5a6';
  return '#cd7f32'; // 브론즈
};

export const ProfileHeader: React.FC<Props> = ({ user, onClose, heroImage }) => {
  const tierColor = getTierColor(user.tier);
  const level = Math.floor(user.totalGames / 10) + 1;

  return (
    <div style={{ 
      position: 'relative', 
      padding: '30px 25px', 
      overflow: 'hidden', 
      borderBottom: '1px solid #333',
      background: '#161b22'
    }}>
      {/* 배경 이미지 (어둡게 처리) */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: heroImage ? `url(${heroImage})` : 'none',
        backgroundSize: 'cover', backgroundPosition: 'center 20%',
        opacity: 0.25, filter: 'blur(2px)', zIndex: 0
      }} />
      
      {/* 그라데이션 오버레이 */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, #0d1117 10%, rgba(13,17,23,0.6) 100%)', zIndex: 1 }} />

      <div style={{ position: 'relative', zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          
          {/* 프로필 아이콘 */}
          <div style={{ position: 'relative' }}>
            <div style={{ 
              width: '80px', height: '80px', borderRadius: '24px', 
              background: '#0d1117', border: `3px solid ${tierColor}`, 
              overflow: 'hidden', boxShadow: `0 0 20px ${tierColor}44`
            }}>
              <GameIcon id={user.mainHeroId} size="100%" />
            </div>
            <div style={{ 
              position: 'absolute', bottom: -10, left: '50%', transform: 'translateX(-50%)',
              background: '#21262d', color: '#fff', fontSize: '11px', fontWeight: 'bold',
              padding: '2px 8px', borderRadius: '10px', border: '1px solid #444', whiteSpace: 'nowrap'
            }}>
              Lv.{level}
            </div>
          </div>

          {/* 유저 정보 텍스트 */}
          <div>
            <h1 style={{ margin: 0, fontSize: '28px', color: '#fff', fontWeight: '900', letterSpacing: '-0.5px', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
              {user.name}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
              <span style={{ 
                color: tierColor, fontWeight: '800', fontSize: '14px', 
                display: 'flex', alignItems: 'center', gap: '4px',
                background: `${tierColor}11`, padding: '2px 8px', borderRadius: '4px', border: `1px solid ${tierColor}44`
              }}>
                <Award size={14}/> {user.tier}
              </span>
              <span style={{ color: '#8b949e', fontSize: '13px', fontWeight: 'bold' }}>
                {user.score.toLocaleString()} LP
              </span>
              <span style={{ color: '#444' }}>|</span>
              <span style={{ color: '#8b949e', fontSize: '13px' }}>
                랭킹 {user.rank > 0 ? `${user.rank}위` : 'Unranked'}
              </span>
            </div>
          </div>
        </div>

        <button onClick={onClose} style={{ 
          background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', 
          width: '36px', height: '36px', borderRadius: '50%', 
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(4px)'
        }}>
          <X size={20} />
        </button>
      </div>
    </div>
  );
};
