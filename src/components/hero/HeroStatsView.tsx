// ==========================================
// FILE PATH: /src/components/hero/HeroStatsView.tsx
// ==========================================

import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { Award, LayoutGrid, List } from 'lucide-react';
import { Role } from '../../types';
import { HeroListTable } from './HeroListTable';
import { LaneStatsView } from './LaneStatsView';

export const HeroStatsView = () => {
  const { heroes } = useGameStore();
  const [mode, setMode] = useState<'HERO' | 'LANE'>('HERO');
  const [selectedRole, setSelectedRole] = useState<Role>('집행관');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="stats-container" style={{ 
      background: '#161b22', borderRadius: '12px', border: '1px solid #30363d', 
      minHeight: '600px', display: 'flex', flexDirection: 'column', overflow: 'hidden'
    }}>

      {/* 상단 헤더 */}
      <div style={{ 
        padding: '15px 20px', borderBottom: '1px solid #30363d', 
        display: 'flex', flexDirection: isMobile ? 'column' : 'row', 
        justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', 
        background:'#21262d', gap: isMobile ? '10px' : '0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '16px', color: '#fff' }}>
          <Award size={18} color="#58a6ff" />
          <span>시즌 1 데이터 센터</span>
        </div>

        <div style={{ display:'flex', background:'#0d1117', padding:'4px', borderRadius:'8px', border:'1px solid #30363d', width: isMobile ? '100%' : 'auto' }}>
          <button 
            onClick={() => setMode('HERO')}
            style={{ 
              flex: isMobile ? 1 : 'none', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', 
              padding:'8px 16px', borderRadius:'6px', border:'none', cursor:'pointer', fontWeight:'bold', fontSize:'12px',
              background: mode === 'HERO' ? '#58a6ff' : 'transparent', color: mode === 'HERO' ? '#000' : '#8b949e'
            }}
          >
            <List size={14}/> 영웅별
          </button>
          <button 
            onClick={() => setMode('LANE')}
            style={{ 
              flex: isMobile ? 1 : 'none', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', 
              padding:'8px 16px', borderRadius:'6px', border:'none', cursor:'pointer', fontWeight:'bold', fontSize:'12px',
              background: mode === 'LANE' ? '#58a6ff' : 'transparent', color: mode === 'LANE' ? '#000' : '#8b949e'
            }}
          >
            <LayoutGrid size={14}/> 라인별
          </button>
        </div>
      </div>

      {/* 컨텐츠 영역 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {mode === 'HERO' ? (
          <HeroListTable heroes={heroes} isMobile={isMobile} />
        ) : (
          <LaneStatsView 
            heroes={heroes} 
            selectedRole={selectedRole} 
            onSelectRole={setSelectedRole} 
            isMobile={isMobile}
          />
        )}
      </div>

      <style>{`
        .tier-badge { 
          font-size: 10px; padding: 2px 6px; border-radius: 4px; font-weight: 800; 
          margin-left: 6px; border: 1px solid transparent; letter-spacing: -0.5px;
        }
        .tier-OP { background: rgba(255, 77, 77, 0.15); color: #ff4d4d; border-color: rgba(255, 77, 77, 0.4); box-shadow: 0 0 10px rgba(255, 77, 77, 0.1); }
        .tier-1 { background: rgba(232, 157, 64, 0.15); color: #e89d40; border-color: rgba(232, 157, 64, 0.4); }
        .tier-2 { background: rgba(88, 166, 255, 0.15); color: #58a6ff; border-color: rgba(88, 166, 255, 0.4); }
        .tier-3 { background: rgba(46, 204, 113, 0.15); color: #2ecc71; border-color: rgba(46, 204, 113, 0.4); }
        .tier-4, .tier-5 { background: #21262d; color: #8b949e; border-color: #30363d; }
      `}</style>
    </div>
  );
};