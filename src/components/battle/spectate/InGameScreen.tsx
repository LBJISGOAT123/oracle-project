import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Pause, ChevronLeft, Terminal, Map as MapIcon, List } from 'lucide-react';
import { useGameStore } from '../../../store/useGameStore';
import { SpeedButton, PlayerCard, ObjectStatBox, BanCard, NeutralObjPanel } from './SpectateUI';
import { GlobalLogPanel } from './GlobalLogPanel';
import { PersonalLogView } from './PersonalLogView';
import { UserDetailView } from './UserDetailView';
import { SpectateMap } from '../SpectateMap';
import { TowerRender, NexusRender, MonsterRender } from './map/MapObjects';
import { UnitRender } from './map/UnitRender';
import { lerpPosition } from '../../../engine/spectate/SpectateEngine';

export const InGameScreen: React.FC<any> = ({ match: initialMatch, onClose }) => {
  const match = useGameStore(state => state.gameState.liveMatches.find(m => m.id === initialMatch.id));
  const { heroes, gameState, setSpeed, togglePlay } = useGameStore();

  const [selectedHeroId, setSelectedHeroId] = useState<string | null>(null);
  const [viewingItem, setViewingItem] = useState<any>(null);
  const [viewingBanHero, setViewingBanHero] = useState<any>(null);
  
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [mobileTab, setMobileTab] = useState<'LIST' | 'MAP'>('LIST');

  const visualStateRef = useRef<Record<string, {x: number, y: number}>>({});
  const requestRef = useRef<number>();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    setSpeed(1); 
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const animate = () => {
      if (!match) return;
      const allPlayers = [...match.blueTeam, ...match.redTeam];
      allPlayers.forEach(p => {
        if (!visualStateRef.current[p.heroId]) visualStateRef.current[p.heroId] = { x: p.x, y: p.y };
        const el = document.getElementById(`unit-${p.heroId}`);
        if (el) {
          el.style.left = `${p.x}%`;
          el.style.top = `${p.y}%`;
        }
      });
      requestRef.current = requestAnimationFrame(animate);
    };
    requestRef.current = requestAnimationFrame(animate);
    return () => { if(requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [match]);

  if (!match) return <div style={{color:'white', padding:50, textAlign:'center'}}>게임 종료됨</div>;

  const isGameEnded = match.stats.blue.nexusHp <= 0 || match.stats.red.nexusHp <= 0;
  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };
  const getHeroName = (id: string) => heroes.find((h:any) => h.id === id)?.name || id;
  const selectedPlayer = selectedHeroId ? [...match.blueTeam, ...match.redTeam].find(p => p.heroId === selectedHeroId) : null;

  return (
    <div style={{ 
      position: 'fixed', inset: 0, background: '#0f0f0f', zIndex: 10000,
      display: 'flex', flexDirection: 'column'
    }}>
      
      {/* 1. 상단바 */}
      <div style={{ flexShrink: 0, background: '#1a1a1a', borderBottom: '1px solid #333', padding: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom:'8px' }}>
          <div style={{ display:'flex', gap:'20px', alignItems:'center', flex:1, justifyContent:'center' }}>
             <span style={{ color: '#58a6ff', fontWeight: '900', fontSize:'22px', minWidth:'30px', textAlign:'right' }}>{match.score.blue}</span>
             <div style={{ background:'#000', padding:'4px 12px', borderRadius:'20px', border:'1px solid #444', color:'#fff', fontSize:'14px', fontFamily:'monospace', fontWeight:'bold' }}>
               {isGameEnded ? 'END' : formatTime(match.currentDuration)}
             </div>
             <span style={{ color: '#e84057', fontWeight: '900', fontSize:'22px', minWidth:'30px', textAlign:'left' }}>{match.score.red}</span>
          </div>
          <button onClick={onClose} style={{ position:'absolute', right:'10px', top:'10px', background:'none', border:'none', color:'#888', cursor:'pointer' }}><X size={24}/></button>
        </div>
        
        <div style={{ display:'flex', justifyContent:'center', gap:'8px' }}>
           <button onClick={togglePlay} style={{ width:'50px', height:'30px', borderRadius:'4px', background: gameState.isPlaying ? '#ff7675' : '#55efc4', color:'#000', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
              {gameState.isPlaying ? <Pause size={16}/> : <Play size={16}/>}
           </button>
           {[1, 10, 60].map(s => <SpeedButton key={s} label={`${s}배`} speed={s} currentSpeed={gameState.gameSpeed} setSpeed={setSpeed} />)}
        </div>
        
        {isMobile && (
          <div style={{ display:'flex', marginTop:'10px', borderTop:'1px solid #333', paddingTop:'8px' }}>
            <button onClick={()=>setMobileTab('LIST')} style={{ flex:1, padding:'8px', background: mobileTab==='LIST'?'#333':'transparent', border:'none', color: mobileTab==='LIST'?'#fff':'#777', fontWeight:'bold', borderBottom: mobileTab==='LIST'?'2px solid #fff':'none' }}>📋 선수 정보</button>
            <button onClick={()=>setMobileTab('MAP')} style={{ flex:1, padding:'8px', background: mobileTab==='MAP'?'#333':'transparent', border:'none', color: mobileTab==='MAP'?'#fff':'#777', fontWeight:'bold', borderBottom: mobileTab==='MAP'?'2px solid #fff':'none' }}>🗺️ 실시간 맵</button>
          </div>
        )}
      </div>

      {/* 2. 메인 컨텐츠 (스크롤) */}
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        
        {/* [MAP] */}
        <div style={{ 
            height: '100%', position: 'relative', overflow: 'hidden', background: '#000',
            display: (isMobile && mobileTab !== 'MAP') ? 'none' : 'block'
        }}>
          <SpectateMap />
          {['TOP', 'MID', 'BOT'].map(lane => (
            [1, 2, 3].map(tier => (
              <React.Fragment key={`${lane}-${tier}`}>
                <TowerRender side="BLUE" lane={lane} tier={tier} stats={match.stats} />
                <TowerRender side="RED" lane={lane} tier={tier} stats={match.stats} />
              </React.Fragment>
            ))
          ))}
          <NexusRender side="BLUE" stats={match.stats} />
          <NexusRender side="RED" stats={match.stats} />
          <MonsterRender type="colossus" objectives={match.objectives} />
          <MonsterRender type="watcher" objectives={match.objectives} />
          {[...match.blueTeam, ...match.redTeam].map(p => (
            <UnitRender key={p.heroId} player={p} isBlue={match.blueTeam.includes(p)} isSelected={selectedHeroId === p.heroId} onClick={() => { setSelectedHeroId(p.heroId); if(isMobile) setMobileTab('LIST'); }} />
          ))}
        </div>

        {/* [LIST] (레이아웃 수정: 100% 채우기, 짤림 방지) */}
        <div style={{ 
          background: '#121212', 
          display: (isMobile && mobileTab !== 'LIST') ? 'none' : 'block',
          paddingBottom: '50px',
          width: '100%',
          overflowX: 'hidden' // 가로 스크롤 방지
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', borderBottom: '1px solid #222', background:'#1a1a1a' }}>
               <div style={{ display: 'flex', gap: '4px' }}>{(match.bans.blue || []).map((id:string, i:number) => <BanCard key={i} heroId={id} heroes={heroes} onClick={setViewingBanHero} />)}</div>
               <div style={{ display: 'flex', gap: '4px' }}>{(match.bans.red || []).map((id:string, i:number) => <BanCard key={i} heroId={id} heroes={heroes} onClick={setViewingBanHero} />)}</div>
            </div>

            {/* 좌우 2분할 리스트 */}
            <div style={{ padding: '8px', display:'flex', gap:'6px', alignItems:'flex-start' }}>
               <div style={{ flex:1, display:'flex', flexDirection:'column', gap:'4px', minWidth:0 }}>
                 <div style={{ fontSize:'11px', fontWeight:'bold', color:'#58a6ff', textAlign:'center', marginBottom:'2px' }}>BLUE TEAM</div>
                 {match.blueTeam.map((p:any, i:number) => <PlayerCard key={i} p={p} isSelected={selectedHeroId === p.heroId} onClick={() => setSelectedHeroId(p.heroId)} heroName={getHeroName(p.heroId)} teamColor="#58a6ff" />)}
               </div>

               <div style={{ flex:1, display:'flex', flexDirection:'column', gap:'4px', minWidth:0 }}>
                 <div style={{ fontSize:'11px', fontWeight:'bold', color:'#e84057', textAlign:'center', marginBottom:'2px' }}>RED TEAM</div>
                 {match.redTeam.map((p:any, i:number) => <PlayerCard key={i} p={p} isSelected={selectedHeroId === p.heroId} onClick={() => setSelectedHeroId(p.heroId)} heroName={getHeroName(p.heroId)} teamColor="#e84057" />)}
               </div>
            </div>

            {/* 하단 정보 */}
            <div style={{ padding:'0 8px 20px 8px' }}>
                <div style={{ padding:'8px 0', display:'flex', gap:'6px' }}>
                   <ObjectStatBox stats={match.stats.blue} color="#58a6ff" side="BLUE" godName="단테" />
                   <ObjectStatBox stats={match.stats.red} color="#e84057" side="RED" godName="이즈마한" />
                </div>
                <NeutralObjPanel colossus={match.objectives?.colossus} watcher={match.objectives?.watcher} />
                
                <div style={{ height:'300px', border:'1px solid #333', marginTop:'10px', borderRadius:'8px', overflow:'hidden', display:'flex', flexDirection:'column' }}>
                    {selectedPlayer ? (
                        <div style={{ height:'100%', overflowY:'auto' }}>
                            <div onClick={() => { setSelectedHeroId(null); setViewingItem(null); }} style={{ padding:'8px', background:'#222', textAlign:'center', cursor:'pointer', fontSize:'12px', color:'#ccc', borderBottom:'1px solid #333' }}><ChevronLeft size={12}/> 목록으로 돌아가기</div>
                            <UserDetailView player={selectedPlayer} heroName={getHeroName(selectedPlayer.heroId)} viewingItem={viewingItem} setViewingItem={setViewingItem} />
                            <PersonalLogView logs={match.logs} heroName={getHeroName(selectedPlayer.heroId)} summonerName={selectedPlayer.name} formatTime={formatTime} />
                        </div>
                    ) : (
                        <>
                           <div style={{ padding:'8px', background:'#161b22', fontSize:'11px', color:'#888', display:'flex', gap:'6px', borderBottom:'1px solid #222' }}><Terminal size={12}/> 실시간 로그</div>
                           <GlobalLogPanel logs={match.logs} gameSpeed={gameState.gameSpeed} formatTime={formatTime} />
                        </>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
