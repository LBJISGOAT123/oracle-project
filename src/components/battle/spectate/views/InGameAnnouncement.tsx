// ==========================================
// FILE PATH: /src/components/battle/spectate/views/InGameAnnouncement.tsx
// ==========================================
import React, { useEffect } from 'react';
import { useGameStore } from '../../../../store/useGameStore';

export const InGameAnnouncement: React.FC = () => {
  const announcement = useGameStore(state => state.announcement);
  const setAnnouncement = useGameStore(state => state.setAnnouncement);

  useEffect(() => {
    if (announcement) {
      // [핵심] 만료 검사 (생성된 지 5초 지났으면 즉시 삭제)
      const now = Date.now();
      const elapsed = now - (announcement.createdAt || 0);
      
      // createdAt이 없거나 5초(5000ms) 이상 지났으면 폐기
      if (!announcement.createdAt || elapsed > 5000) {
        setAnnouncement(null);
        return;
      }

      // 남은 시간만큼만 보여주고 삭제
      const remainingTime = 5000 - elapsed;
      const timer = setTimeout(() => {
        setAnnouncement(null);
      }, remainingTime); 

      return () => clearTimeout(timer);
    }
  }, [announcement, setAnnouncement]);

  if (!announcement) return null;

  return (
    <div className="announcement-container" style={{
      position: 'absolute', top: '15%', left: '50%', transform: 'translateX(-50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      zIndex: 40000, pointerEvents: 'none', width: '80%', textAlign: 'center'
    }}>
      <div className="announce-box" style={{
        background: 'linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.8) 20%, rgba(0,0,0,0.8) 80%, rgba(0,0,0,0) 100%)',
        padding: '10px 40px',
        borderTop: `2px solid ${announcement.color}`,
        borderBottom: `2px solid ${announcement.color}`,
        animation: 'pulseBorder 2s infinite'
      }}>
        <h1 style={{ 
          margin: 0, fontSize: '24px', fontWeight: '900', color: announcement.color,
          textShadow: '0 0 10px rgba(0,0,0,0.8), 0 0 20px ' + announcement.color,
          letterSpacing: '-1px', textTransform: 'uppercase', fontStyle: 'italic'
        }}>
          {announcement.title}
        </h1>
        <div style={{ color: '#fff', fontSize: '13px', marginTop: '4px', fontWeight: 'bold', textShadow: '0 1px 2px #000' }}>
          {announcement.subtext}
        </div>
      </div>
      
      <style>{`
        .announcement-container {
          animation: slideDown 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        @keyframes slideDown {
          from { transform: translate(-50%, -50px); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
        @keyframes pulseBorder {
          0% { border-color: rgba(255,255,255,0.2); }
          50% { border-color: rgba(255,255,255,0.8); }
          100% { border-color: rgba(255,255,255,0.2); }
        }
      `}</style>
    </div>
  );
};
