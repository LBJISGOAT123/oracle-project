// ==========================================
// FILE PATH: /src/components/battle/spectate/InGameScreen.tsx
// ==========================================
import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../../store/useGameStore';
import { SpectateHeader } from './views/SpectateHeader';
import { SpectateMapView } from './views/SpectateMapView';
import { SpectateListView } from './views/SpectateListView';
import { HeroDetailPopup } from './modals/HeroDetailPopup'; // 신규 팝업 import

export const InGameScreen: React.FC<any> = ({ match: initialMatch, onClose }) => {
  const match = useGameStore(state => state.gameState.liveMatches.find(m => m.id === initialMatch.id));
  const { heroes, gameState, setSpeed, togglePlay } = useGameStore();

  // selectedHeroId는 이제 팝업을 띄우는 용도로도 사용됩니다.
  const [selectedHeroId, setSelectedHeroId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [mobileTab, setMobileTab] = useState<'LIST' | 'MAP'>('MAP'); // 기본값을 맵으로 변경 (요청사항 흐름상 자연스러움)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    setSpeed(1); 
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

  // 선택된 플레이어 객체 찾기
  const selectedPlayer = selectedHeroId 
    ? [...match.blueTeam, ...match.redTeam].find(p => p.heroId === selectedHeroId) 
    : null;
  
  const selectedHeroData = selectedPlayer 
    ? heroes.find(h => h.id === selectedPlayer.heroId) 
    : null;

  return (
    <div style={{ 
      position: 'fixed', inset: 0, background: '#0f0f0f', zIndex: 10000,
      display: 'flex', flexDirection: 'column'
    }}>
      
      {/* 1. 상단바 */}
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
      <div style={{ flex: 1, overflowY: 'hidden', position:'relative' }}>
        
        {/* [MAP] 맵 뷰 (하단에 오브젝트 정보 포함됨) */}
        <SpectateMapView 
          match={match}
          isMobile={isMobile}
          mobileTab={mobileTab}
          selectedHeroId={null} // 맵에서는 하이라이트만 하고, 클릭 시 팝업 띄움
          onSelectHero={(id) => setSelectedHeroId(id)}
          setMobileTab={setMobileTab}
        />

        {/* [LIST] 리스트 뷰 */}
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

      {/* 3. 영웅 상세 팝업 (모듈화됨) */}
      {selectedPlayer && selectedHeroData && (
        <HeroDetailPopup 
          player={selectedPlayer}
          hero={selectedHeroData}
          onClose={() => setSelectedHeroId(null)}
        />
      )}

    </div>
  );
};
