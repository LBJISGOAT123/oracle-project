// ==========================================
// FILE PATH: /src/components/battle/spectate/InGameScreen.tsx
// ==========================================
import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../../store/useGameStore';
import { SpectateHeader } from './views/SpectateHeader';
import { SpectateMapView } from './views/SpectateMapView';
import { SpectateListView } from './views/SpectateListView';

export const InGameScreen: React.FC<any> = ({ match: initialMatch, onClose }) => {
  const match = useGameStore(state => state.gameState.liveMatches.find(m => m.id === initialMatch.id));
  const { heroes, gameState, setSpeed, togglePlay } = useGameStore();

  const [selectedHeroId, setSelectedHeroId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [mobileTab, setMobileTab] = useState<'LIST' | 'MAP'>('LIST');

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    setSpeed(1); // 관전 시작 시 1배속으로 초기화
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!match) return <div style={{color:'white', padding:50, textAlign:'center'}}>게임 종료됨</div>;

  const isGameEnded = match.stats.blue.nexusHp <= 0 || match.stats.red.nexusHp <= 0;
  
  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const getHeroName = (id: string) => heroes.find((h:any) => h.id === id)?.name || id;

  return (
    <div style={{ 
      position: 'fixed', inset: 0, background: '#0f0f0f', zIndex: 10000,
      display: 'flex', flexDirection: 'column'
    }}>
      
      {/* 1. 상단바 모듈 */}
      <SpectateHeader 
        score={match.score}
        timeStr={isGameEnded ? 'END' : formatTime(match.currentDuration)}
        isGameEnded={isGameEnded}
        isPlaying={gameState.isPlaying}
        gameSpeed={gameState.gameSpeed}
        onTogglePlay={togglePlay}
        onSetSpeed={setSpeed}
        onClose={onClose}
        isMobile={isMobile}
        mobileTab={mobileTab}
        setMobileTab={setMobileTab}
      />

      {/* 2. 메인 컨텐츠 */}
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        
        {/* [MAP] 맵 뷰 모듈 */}
        <SpectateMapView 
          match={match}
          isMobile={isMobile}
          mobileTab={mobileTab}
          selectedHeroId={selectedHeroId}
          onSelectHero={setSelectedHeroId}
          setMobileTab={setMobileTab}
        />

        {/* [LIST] 리스트 뷰 모듈 */}
        <SpectateListView 
          match={match}
          heroes={heroes}
          isMobile={isMobile}
          mobileTab={mobileTab}
          selectedHeroId={selectedHeroId}
          onSelectHero={setSelectedHeroId}
          gameSpeed={gameState.gameSpeed}
          formatTime={formatTime}
          getHeroName={getHeroName}
        />

      </div>
    </div>
  );
};
