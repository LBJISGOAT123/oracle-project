// ==========================================
// FILE PATH: /src/components/hero/HeroStatsView.tsx
// ==========================================
import React, { useState, useEffect, useMemo } from 'react'; 
import { useGameStore } from '../../store/useGameStore';
import { Award, LayoutGrid, List, TrendingUp, Coins } from 'lucide-react';
import { Role, Hero } from '../../types';
import { HeroListTable } from './HeroListTable';
import { LaneStatsView } from './LaneStatsView';
import { HeroDetailView } from './HeroDetailView';
import { PatchModal } from './PatchModal';
import { GrowthSettingModal } from './GrowthSettingModal';
import { RewardSettingModal } from './RewardSettingModal';

export const HeroStatsView = () => {
  const { heroes } = useGameStore();
  const [mode, setMode] = useState<'HERO' | 'LANE'>('HERO');
  const [selectedRole, setSelectedRole] = useState<Role>('집행관');

  const [viewingHeroId, setViewingHeroId] = useState<string | null>(null);
  const [showPatchModal, setShowPatchModal] = useState(false);
  const [showGrowthModal, setShowGrowthModal] = useState(false);
  const [showRewardModal, setShowRewardModal] = useState(false);

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const viewingHero = useMemo(() => 
    heroes.find(h => h.id === viewingHeroId) || null, 
  [heroes, viewingHeroId]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleHeroClick = (hero: Hero) => {
    setViewingHeroId(hero.id);
  };

  return (
    <div className="stats-container" style={{ 
      background: '#161b22', borderRadius: '12px', border: '1px solid #30363d', 
      minHeight: '600px', display: 'flex', flexDirection: 'column', overflow: 'hidden',
      position: 'relative'
    }}>

      <div style={{ 
        padding: '12px 15px', borderBottom: '1px solid #30363d', 
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background:'#21262d', gap: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', fontSize: isMobile ? '14px' : '16px', color: '#fff', whiteSpace:'nowrap' }}>
          <Award size={isMobile ? 16 : 18} color="#58a6ff" />
          <span>{isMobile ? '시즌1' : '시즌 1 데이터'}</span>
        </div>

        <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
          
          <button 
              onClick={() => setShowRewardModal(true)}
              style={{ background: '#e67e22', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: isMobile ? '6px 8px' : '6px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
              <Coins size={12}/> {isMobile ? '보상' : '보상 설정'}
          </button>

          <button 
              onClick={() => setShowGrowthModal(true)}
              style={{ background: '#238636', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: isMobile ? '6px 8px' : '6px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
              <TrendingUp size={12}/> {isMobile ? '성장' : '성장 밸런스'}
          </button>

          <div style={{ display:'flex', background:'#0d1117', padding:'3px', borderRadius:'6px', border:'1px solid #30363d' }}>
            <button onClick={() => setMode('HERO')} style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'4px', padding: isMobile ? '6px 10px' : '6px 14px', borderRadius:'4px', border:'none', cursor:'pointer', fontWeight:'bold', fontSize: isMobile ? '11px' : '12px', background: mode === 'HERO' ? '#58a6ff' : 'transparent', color: mode === 'HERO' ? '#000' : '#8b949e', transition: '0.2s', whiteSpace:'nowrap' }}>
              <List size={12}/> {isMobile ? '영웅' : '영웅별'}
            </button>
            <button onClick={() => setMode('LANE')} style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'4px', padding: isMobile ? '6px 10px' : '6px 14px', borderRadius:'4px', border:'none', cursor:'pointer', fontWeight:'bold', fontSize: isMobile ? '11px' : '12px', background: mode === 'LANE' ? '#58a6ff' : 'transparent', color: mode === 'LANE' ? '#000' : '#8b949e', transition: '0.2s', whiteSpace:'nowrap' }}>
              <LayoutGrid size={12}/> {isMobile ? '라인' : '라인별'}
            </button>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {mode === 'HERO' ? (
          <HeroListTable heroes={heroes} isMobile={isMobile} onHeroClick={handleHeroClick} />
        ) : (
          <LaneStatsView heroes={heroes} selectedRole={selectedRole} onSelectRole={setSelectedRole} isMobile={isMobile} onHeroClick={handleHeroClick} />
        )}
      </div>

      {viewingHero && <HeroDetailView hero={viewingHero} onBack={() => setViewingHeroId(null)} onPatch={() => setShowPatchModal(true)} />}
      {showPatchModal && viewingHero && <PatchModal hero={viewingHero} onClose={() => setShowPatchModal(false)} />}
      {showGrowthModal && <GrowthSettingModal onClose={() => setShowGrowthModal(false)} />}
      {showRewardModal && <RewardSettingModal onClose={() => setShowRewardModal(false)} />}
    </div>
  );
};
