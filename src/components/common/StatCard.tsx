import React, { useState, useEffect } from 'react';
import { LucideIcon } from 'lucide-react';

interface Props {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: string;
}

export const StatCard: React.FC<Props> = ({ title, value, icon: Icon, color = "#58a6ff" }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="stat-card-mini" style={{ 
      display: 'flex', 
      flexDirection: 'column', // 아이콘과 텍스트를 위아래로 배치
      alignItems: 'center', 
      justifyContent: 'center',
      padding: isMobile ? '8px 4px' : '16px', 
      background: '#161b22',
      border: '1px solid #30363d',
      borderRadius: '8px',
      flex: 1,
      minWidth: 0, // 좁은 화면에서 찌그러짐 방지
    }}>
      {/* 아이콘 - 크기 축소 */}
      <div style={{ 
        color: color,
        marginBottom: isMobile ? '4px' : '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: 0.9
      }}>
        <Icon size={isMobile ? 16 : 22} />
      </div>

      <div style={{ textAlign: 'center', width: '100%' }}>
        {/* 수치 - 가독성 확보 */}
        <div className="text-mono" style={{ 
          fontSize: isMobile ? '13px' : '18px', 
          fontWeight: '800',
          color: '#fff',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {value}
        </div>
        {/* 제목 - 아주 작게 표시 */}
        <div style={{ 
          fontSize: isMobile ? '8px' : '11px', 
          color: '#8b949e',
          marginTop: '1px',
          whiteSpace: 'nowrap'
        }}>
          {isMobile ? title.replace(' ', '') : title}
        </div>
      </div>
    </div>
  );
};