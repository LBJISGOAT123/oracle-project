// ==========================================
// FILE PATH: /src/components/battle/spectate/InGameScreen.tsx
// ==========================================
import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../../../store/useGameStore';
import { SpectateHeader } from './views/SpectateHeader';
import { SpectateMapView } from './views/SpectateMapView';
import { SpectateListView } from './views/SpectateListView';
import { HeroDetailPopup } from './modals/HeroDetailPopup';

export const InGameScreen: React.FC<any> = ({ match: initialMatch, onClose }) => {
  const match = useGameStore(state => state.gameState.liveMatches.find(m => m.id === initialMatch.id));
  const { heroes, gameState, setSpeed, togglePlay, setAnnouncement } = useGameStore();

  const [selectedHeroId, setSelectedHeroId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [mobileTab, setMobileTab] = useState<'LIST' | 'MAP'>('MAP');

  const lastLogTimeRef = useRef<number>(match ? match.currentDuration : 0);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    setSpeed(1); 
    setAnnouncement(null);
    return () => {
        window.removeEventListener('resize', handleResize);
        setAnnouncement(null);
    };
  }, []);

  useEffect(() => {
    if (!match) return;

    const newLogs = match.logs.filter(log => 
        log.time > lastLogTimeRef.current && 
        (log.type === 'COLOSSUS' || log.type === 'WATCHER')
    );

    if (newLogs.length > 0) {
        const latestLog = newLogs[newLogs.length - 1];
        lastLogTimeRef.current = latestLog.time;

        const isBlue = latestLog.team === 'BLUE';
        const teamName = isBlue ? '단테' : '이즈마한';
        const color = isBlue ? '#58a6ff' : '#e84057';
        
        let title = '';
        let subtext = '';

        if (latestLog.type === 'COLOSSUS') {
            title = '거신병 해킹 성공!';
            subtext = `${teamName} 진영이 거신병을 해킹하여 소환했습니다.`;
        } else if (latestLog.type === 'WATCHER') {
            title = '심연의 주시자 처치!';
            subtext = `${teamName} 진영이 주시자를 처형하고 공허의 힘을 얻었습니다.`;
        }

        setAnnouncement({
            type: 'OBJECTIVE',
            title,
            subtext,
            color: latestLog.type === 'WATCHER' ? '#f1c40f' : color,
            duration: 5.0,
            createdAt: Date.now()
        });
    } else {
        if (match.currentDuration > lastLogTimeRef.current) {
            lastLogTimeRef.current = match.currentDuration;
        }
    }
  }, [match?.logs.length, match?.currentDuration]);

  if (!match) return <div style={{color:'white', padding:50, textAlign:'center'}}>게임 종료됨</div>;

  const isGameEnded = match.stats.blue.nexusHp <= 0 || match.stats.red.nexusHp <= 0;
  
  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const getHeroName = (id: string) => heroes.find((h:any) => h.id === id)?.name || id;

  const selectedPlayer = selectedHeroId 
    ? [...match.blueTeam, ...match.redTeam].find(p => p.heroId === selectedHeroId) 
    : null;
  
  const selectedHeroData = selectedPlayer 
    ? heroes.find(h => h.id === selectedPlayer.heroId) 
    : null;

  return (
    <div style={{ 
      position: 'fixed', inset: 0, background: '#0f0f0f', zIndex: 10000,
      display: 'flex', flexDirection: 'column', overflow: 'hidden'
    }}>
      
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

      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row', // [변경] 데스크탑은 가로 배치
        overflow: 'hidden', 
        position:'relative' 
      }}>
        
        {/* [좌측] 리스트 뷰 (데스크탑에서는 고정폭, 모바일에서는 탭에 따라 표시) */}
        <div style={{
          width: isMobile ? '100%' : '420px',
          height: '100%',
          flexShrink: 0,
          borderRight: isMobile ? 'none' : '1px solid #333',
          display: isMobile ? (mobileTab === 'LIST' ? 'block' : 'none') : 'block',
          overflow: 'hidden'
        }}>
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

        {/* [우측] 맵 뷰 (남은 공간 채움) */}
        <div style={{
          flex: 1,
          height: '100%',
          position: 'relative',
          display: isMobile ? (mobileTab === 'MAP' ? 'flex' : 'none') : 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          <SpectateMapView 
            match={match}
            isMobile={isMobile}
            mobileTab={mobileTab}
            selectedHeroId={null} 
            onSelectHero={(id) => setSelectedHeroId(id)}
            setMobileTab={setMobileTab}
          />
        </div>

      </div>

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
