// ==========================================
// FILE PATH: /src/components/battle/SpectateModal.tsx
// ==========================================
import React, { useState } from 'react';
import { X, Terminal, ChevronLeft, Pause, Play, Skull, Eye } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';
import { GameIcon } from '../common/GameIcon';

import { GlobalLogPanel } from './spectate/GlobalLogPanel';
import { PersonalLogView } from './spectate/PersonalLogView';
import { UserDetailView } from './spectate/UserDetailView';
import { SpeedButton, BanCard, PlayerCard, ObjectStatBox, NeutralObjBar, DraftScreen } from './spectate/SmallComponents';

export const SpectateModal: React.FC<any> = ({ match: initialMatch, onClose }) => {
  const { heroes, gameState, setSpeed, togglePlay } = useGameStore(); 
  
  // [안전 장치 1] 실시간 매치 데이터 동기화 (없으면 초기 데이터 사용)
  const liveMatch = gameState.liveMatches.find(m => m.id === initialMatch.id);
  const match = liveMatch || initialMatch || {}; 
  const isGameEnded = !liveMatch;

  const [selectedHeroId, setSelectedHeroId] = useState<string | null>(null);
  const [viewingItem, setViewingItem] = useState<any | null>(null);
  const [viewingBanHero, setViewingBanHero] = useState<any>(null);

  // [핵심 수정] 밴픽(DRAFTING) 상태면 DraftScreen 표시 (데이터 누락 방어)
  if (match.status === 'DRAFTING') {
    return <DraftScreen match={match} heroes={heroes} onClose={onClose} />;
  }

  // --- 인게임(PLAYING) 로직 ---

  const getHeroName = (id: string) => {
    if (!id) return "선택 중..."; 
    return heroes.find(h => h.id === id)?.name || id;
  };
  
  const formatTime = (seconds: number) => {
    const m = Math.floor((seconds || 0) / 60); 
    const s = Math.floor((seconds || 0) % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const blueTeam = match.blueTeam || [];
  const redTeam = match.redTeam || [];
  const allPlayers = [...blueTeam, ...redTeam];
  const selectedPlayer = allPlayers.find(p => p.heroId === selectedHeroId);

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#050505', zIndex: 30000, overflowY: 'auto' }}>

      {/* 1. 상단 바 */}
      <div style={{ position:'sticky', top:0, zIndex:100, background: '#121214', borderBottom: '1px solid #222', padding: '8px 12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom:'6px' }}>
          <div style={{ display:'flex', gap:'15px', alignItems:'center', flex:1, justifyContent:'center' }}>
             <span style={{ color: '#58a6ff', fontWeight: '900', fontSize:'22px' }}>{match.score?.blue || 0}</span>
             <div style={{ background:'#000', padding:'4px 12px', borderRadius:'6px', border:'1px solid #333', color:'#fff', fontSize:'14px', fontFamily:'monospace', fontWeight:'bold' }}>
               {isGameEnded ? '종료됨' : formatTime(match.currentDuration)}
             </div>
             <span style={{ color: '#e84057', fontWeight: '900', fontSize:'22px' }}>{match.score?.red || 0}</span>
          </div>
          <button onClick={onClose} style={{ position:'absolute', right:'10px', top:'10px', background:'none', border:'none', color:'#888', cursor:'pointer' }}><X size={24}/></button>
        </div>
        <div style={{ display:'flex', justifyContent:'center', gap:'6px' }}>
           <button onClick={togglePlay} style={{ width:'60px', height:'26px', borderRadius:'4px', background: gameState.isPlaying ? '#3f1515' : '#153f1f', color: gameState.isPlaying ? '#ff6b6b' : '#3fb950', border:'1px solid #333', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
              {gameState.isPlaying ? <Pause size={14}/> : <Play size={14}/>}
           </button>
           <SpeedButton label="1x" speed={1} currentSpeed={gameState.gameSpeed} setSpeed={setSpeed} />
           <SpeedButton label="1m" speed={60} currentSpeed={gameState.gameSpeed} setSpeed={setSpeed} />
           <SpeedButton label="10m" speed={600} currentSpeed={gameState.gameSpeed} setSpeed={setSpeed} />
        </div>
      </div>

      {/* 2. 밴 정보 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', background: '#0a0a0c', borderBottom: '1px solid #222' }}>
         <div style={{ display: 'flex', gap: '3px' }}>
            <span style={{ fontSize:'9px', color:'#58a6ff', fontWeight:'bold', marginRight:'4px' }}>BAN</span>
            {(match.bans?.blue || []).map((id: string, i: number) => <BanCard key={i} heroId={id} heroes={heroes} onClick={(hid: any) => setViewingBanHero(heroes.find(h=>h.id===hid))} />)}
         </div>
         <div style={{ display: 'flex', gap: '3px' }}>
            {(match.bans?.red || []).map((id: string, i: number) => <BanCard key={i} heroId={id} heroes={heroes} onClick={(hid: any) => setViewingBanHero(heroes.find(h=>h.id===hid))} />)}
            <span style={{ fontSize:'9px', color:'#e84057', fontWeight:'bold', marginLeft:'4px' }}>BAN</span>
         </div>
      </div>

      {/* 3. 팀 리스트 */}
      <div style={{ display:'grid', gridTemplateColumns: '1fr 1fr', gap:'8px', padding:'8px', background:'#0a0a0c' }}>
         <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
            {blueTeam.map((p: any, i: number) => (
              <PlayerCard key={i} p={p} isSelected={selectedHeroId === p.heroId} onClick={() => { if(p.heroId) { setSelectedHeroId(selectedHeroId === p.heroId ? null : p.heroId); setViewingItem(null); } }} heroName={getHeroName(p.heroId)} teamColor="#58a6ff" />
            ))}
         </div>
         <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
            {redTeam.map((p: any, i: number) => (
              <PlayerCard key={i} p={p} isSelected={selectedHeroId === p.heroId} onClick={() => { if(p.heroId) { setSelectedHeroId(selectedHeroId === p.heroId ? null : p.heroId); setViewingItem(null); } }} heroName={getHeroName(p.heroId)} teamColor="#e84057" />
            ))}
         </div>
      </div>

      {/* 4. 전장 정보 */}
      {match.stats && (
        <div style={{ display:'flex', gap:'6px', padding:'8px', background:'#0a0a0c', borderTop:'1px solid #222' }}>
           <ObjectStatBox stats={match.stats.blue} color="#58a6ff" side="BLUE" />
           <ObjectStatBox stats={match.stats.red} color="#e84057" side="RED" />
        </div>
      )}
      
      {match.objectives && (
        <div style={{ display:'flex', gap:'6px', padding:'6px 8px', background:'#08080a', borderBottom:'1px solid #222' }}>
            <NeutralObjBar obj={match.objectives.colossus} label="거신병" color="#7ee787" icon={<Skull size={10}/>} />
            <NeutralObjBar obj={match.objectives.watcher} label="주시자" color="#a371f7" icon={<Eye size={10}/>} />
        </div>
      )}

      {/* 5. 상세 인터랙티브 영역 */}
      <div style={{ background: '#000', flex:1, minHeight:'300px' }}>
         {selectedPlayer && selectedPlayer.heroId ? (
            <div style={{ display:'flex', flexDirection:'column', background:'#0a0a0c', borderTop:'1px solid #333', paddingBottom:'40px' }}>
              <div onClick={() => { setSelectedHeroId(null); setViewingItem(null); }} style={{ padding:'10px', background:'#21262d', color:'#fff', fontWeight:'bold', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', borderBottom:'1px solid #333', fontSize:'12px' }}>
                <ChevronLeft size={14} /> 전체 전투 로그로 돌아가기
              </div>

              <UserDetailView player={selectedPlayer} heroName={getHeroName(selectedPlayer.heroId)} viewingItem={viewingItem} setViewingItem={setViewingItem} />

              <div style={{ display:'flex', gap:'6px', justifyContent:'center', marginBottom:'20px' }}>
                {[0,1,2,3,4,5].map(i => (
                  <div key={i} onClick={() => selectedPlayer.items[i] && setViewingItem(selectedPlayer.items[i])} style={{ width:'42px', height:'42px', background:'#0d1117', border:'1px solid #333', borderRadius:'4px', cursor:'pointer', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    {selectedPlayer.items[i] && <GameIcon id={selectedPlayer.items[i].id} size={40} shape="square" />}
                  </div>
                ))}
              </div>

              <PersonalLogView logs={match.logs || []} heroName={getHeroName(selectedPlayer.heroId)} summonerName={selectedPlayer.name} formatTime={formatTime} />
            </div>
         ) : (
            <>
               <div style={{ padding:'6px 12px', background:'#121214', borderBottom: '1px solid #222', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Terminal size={14} color="#666"/><span style={{ fontSize:'11px', color:'#8b949e', fontWeight:'bold' }}>BATTLE LOG</span>
               </div>
               <GlobalLogPanel logs={match.logs || []} gameSpeed={gameState.gameSpeed} formatTime={formatTime} />
            </>
         )}
      </div>

      {viewingBanHero && (
        <div onClick={() => setViewingBanHero(null)} style={{ position:'fixed', inset:0, zIndex:50000, background:'rgba(0,0,0,0.8)', display:'flex', justifyContent:'center', alignItems:'center' }}>
           <div style={{ background:'#1c1c1f', padding:'15px', borderRadius:'8px', border:'1px solid #444', textAlign:'center' }}>
              <GameIcon id={viewingBanHero.id} size={60} />
              <div style={{ marginTop:'10px', fontWeight:'bold', color:'#da3633' }}>BANNED: {viewingBanHero.name}</div>
           </div>
        </div>
      )}
    </div>
  );
};
