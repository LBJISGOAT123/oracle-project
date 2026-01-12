// ==========================================
// FILE PATH: /src/components/hero/HeroStatsView.tsx
// ==========================================

import React, { useState, useEffect, useMemo } from 'react'; // useMemo 추가
import { useGameStore } from '../../store/useGameStore';
import { Award, LayoutGrid, List } from 'lucide-react';
import { Role, Hero } from '../../types';
import { HeroListTable } from './HeroListTable';
import { LaneStatsView } from './LaneStatsView';
import { HeroDetailView } from './HeroDetailView';
import { PatchModal } from './PatchModal';

export const HeroStatsView = () => {
  const { heroes } = useGameStore();
  const [mode, setMode] = useState<'HERO' | 'LANE'>('HERO');
  const [selectedRole, setSelectedRole] = useState<Role>('집행관');

  // [수정 1] 영웅 객체 대신 ID를 저장하여 항상 최신 데이터를 참조하도록 변경
  const [viewingHeroId, setViewingHeroId] = useState<string | null>(null);
  const [showPatchModal, setShowPatchModal] = useState(false);

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // [수정 2] ID를 기반으로 현재 최신 영웅 데이터 찾기
  const viewingHero = useMemo(() => 
    heroes.find(h => h.id === viewingHeroId) || null, 
  [heroes, viewingHeroId]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // [수정 3] 핸들러가 ID를 저장하도록 변경
  const handleHeroClick = (hero: Hero) => {
    setViewingHeroId(hero.id);
  };

  return (
    <div className="stats-container" style={{ 
      background: '#161b22', borderRadius: '12px', border: '1px solid #30363d', 
      minHeight: '600px', display: 'flex', flexDirection: 'column', overflow: 'hidden',
      position: 'relative'
    }}>

      {/* 헤더 및 탭 */}
      <div style={{ 
        padding: '12px 15px', borderBottom: '1px solid #30363d', 
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background:'#21262d', gap: '10px'
      }}>
        {/* 제목 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', fontSize: isMobile ? '14px' : '16px', color: '#fff', whiteSpace:'nowrap' }}>
          <Award size={isMobile ? 16 : 18} color="#58a6ff" />
          <span>시즌 1 데이터</span>
        </div>

        {/* 탭 버튼 */}
        <div style={{ display:'flex', background:'#0d1117', padding:'3px', borderRadius:'6px', border:'1px solid #30363d' }}>
          <button 
            onClick={() => setMode('HERO')} 
            style={{ 
              display:'flex', alignItems:'center', justifyContent:'center', gap:'4px', 
              padding: isMobile ? '6px 10px' : '6px 14px', 
              borderRadius:'4px', border:'none', cursor:'pointer', fontWeight:'bold', fontSize: isMobile ? '11px' : '12px', 
              background: mode === 'HERO' ? '#58a6ff' : 'transparent', color: mode === 'HERO' ? '#000' : '#8b949e',
              transition: '0.2s', whiteSpace:'nowrap'
            }}
          >
            <List size={12}/> 영웅별
          </button>
          <button 
            onClick={() => setMode('LANE')} 
            style={{ 
              display:'flex', alignItems:'center', justifyContent:'center', gap:'4px', 
              padding: isMobile ? '6px 10px' : '6px 14px', 
              borderRadius:'4px', border:'none', cursor:'pointer', fontWeight:'bold', fontSize: isMobile ? '11px' : '12px', 
              background: mode === 'LANE' ? '#58a6ff' : 'transparent', color: mode === 'LANE' ? '#000' : '#8b949e',
              transition: '0.2s', whiteSpace:'nowrap'
            }}
          >
            <LayoutGrid size={12}/> 라인별
          </button>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {mode === 'HERO' ? (
          <HeroListTable 
            heroes={heroes} 
            isMobile={isMobile} 
            onHeroClick={handleHeroClick} 
          />
        ) : (
          <LaneStatsView 
            heroes={heroes} 
            selectedRole={selectedRole} 
            onSelectRole={setSelectedRole} 
            isMobile={isMobile}
            onHeroClick={handleHeroClick} 
          />
        )}
      </div>

      {/* 영웅 상세 팝업 (viewingHero는 이제 항상 최신 상태임) */}
      {viewingHero && (
        <HeroDetailView 
          hero={viewingHero} 
          onBack={() => setViewingHeroId(null)} 
          onPatch={() => setShowPatchModal(true)}
        />
      )}

      {/* 패치 모달 */}
      {showPatchModal && viewingHero && (
        <PatchModal 
          hero={viewingHero} 
          onClose={() => setShowPatchModal(false)} 
        />
      )}
    </div>
  );
};