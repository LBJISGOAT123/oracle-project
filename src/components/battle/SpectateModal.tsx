// ==========================================
// FILE PATH: /src/components/battle/SpectateModal.tsx
// ==========================================

import React, { Component, ErrorInfo, useState } from 'react';
import { X, Terminal, ChevronLeft, Pause, Play, Skull, Eye, AlertTriangle, Ban, Activity } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';
import { GameIcon } from '../common/GameIcon';
import { LiveMatch, Hero } from '../../types';

// [1] 안전장치
class ErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean, errorMsg: string }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, errorMsg: "" };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, errorMsg: error.toString() };
  }
  componentDidCatch(error: any, errorInfo: ErrorInfo) {
    console.error("Spectate Error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', color: '#ff6b6b', textAlign: 'center', background:'#111', height:'100%', display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center' }}>
          <AlertTriangle size={40} style={{ marginBottom: '20px' }} />
          <h3>화면 로드 실패</h3>
          <button onClick={() => window.location.reload()} style={{ padding:'10px 20px', background:'#333', color:'#fff', border:'1px solid #555', borderRadius:'4px', cursor:'pointer' }}>새로고침</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ----------------------------------------------------------------------
// [2] 하위 컴포넌트들
// ----------------------------------------------------------------------

const SpeedButton = ({ label, speed, currentSpeed, setSpeed }: any) => (
  <button onClick={() => setSpeed(speed)} style={{ flex: 1, padding: '4px 0', background: currentSpeed === speed ? '#58a6ff' : '#1c1c1f', border: `1px solid ${currentSpeed === speed ? '#58a6ff' : '#333'}`, borderRadius: '4px', color: currentSpeed === speed ? '#000' : '#888', fontSize: '10px', fontWeight: '800', cursor: 'pointer', height: '24px', minWidth:'30px' }}>{label}</button>
);

const BanCard = ({ heroId, heroes, isActive }: any) => {
  const hero = heroes.find((h:Hero) => h.id === heroId);
  const name = hero ? hero.name : "금지";

  return (
    <div style={{ 
      display:'flex', flexDirection:'column', alignItems:'center', width:'36px', margin:'2px',
      opacity: (isActive || heroId) ? 1 : 0.3,
      transform: isActive ? 'scale(1.1)' : 'scale(1)',
      transition: 'all 0.3s'
    }}>
      <div style={{ 
        position: 'relative', width: '32px', height: '32px', borderRadius: '4px', overflow: 'hidden', 
        background:'#111', 
        border: isActive ? '2px solid #ff4d4d' : '1px solid #444',
        boxShadow: isActive ? '0 0 10px rgba(255, 77, 77, 0.5)' : 'none'
      }}>
        {heroId ? (
          <>
            <div style={{ filter: 'grayscale(100%) brightness(0.4)' }}><GameIcon id={heroId} size={32} shape="square" /></div>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: '2px solid #da3633', boxSizing:'border-box', opacity:0.8 }}></div>
            <div style={{ position: 'absolute', top: '50%', left: '50%', width: '140%', height: '4px', backgroundColor: '#da3633', transform: 'translate(-50%, -50%) rotate(45deg)', boxShadow:'0 0 5px #000' }} />
          </>
        ) : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center' }}><Ban size={16} color={isActive ? "#ff4d4d" : "#333"}/></div>}
      </div>
      {heroId && <span style={{ color:'#da3633', fontSize:'8px', fontWeight:'bold', marginTop:'2px', whiteSpace:'nowrap', letterSpacing:'-0.5px' }}>{name}</span>}
    </div>
  );
};

const PlayerCard = ({ p, isSelected, onClick, heroName, teamColor }: any) => {
  const maxHp = p.maxHp || 1;
  const currentHp = p.currentHp || 0;
  const hpPercent = Math.max(0, Math.min(100, (currentHp / maxHp) * 100));
  const isDead = currentHp <= 0;

  return (
    <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 8px', background: isSelected ? `${teamColor}15` : '#161b22', borderRadius: '4px', border: isSelected ? `1px solid ${teamColor}` : '1px solid #30363d', marginBottom: '4px', cursor: 'pointer', height: '36px', opacity: isDead ? 0.6 : 1, filter: isDead ? 'grayscale(0.8)' : 'none', position: 'relative', overflow:'hidden' }}>
      <div style={{ position: 'relative', display:'flex', alignItems:'center', gap:'8px', zIndex:2 }}>
        <GameIcon id={p.heroId} size={28} shape="rounded" />
        <div>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#fff', lineHeight:'1.2' }}>{heroName}</div>
          <div style={{ fontSize: '9px', color: '#8b949e' }}>{p.name}</div>
        </div>
      </div>
      <div style={{ textAlign: 'right', zIndex:2 }}>
        <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#fff' }}>{p.kills}/{p.deaths}/{p.assists}</div>
        <div style={{ fontSize: '9px', color: '#8b949e' }}>{(p.gold/1000).toFixed(1)}k</div>
      </div>
      <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '3px', background: 'rgba(0,0,0,0.3)' }}>
        <div style={{ width: `${hpPercent}%`, height: '100%', background: hpPercent < 30 ? '#da3633' : teamColor, transition: 'width 0.3s' }} />
      </div>
    </div>
  );
};

const ObjectStatBox = ({ stats, color, side }: any) => {
  if (!stats) return null;
  const hpPercent = (stats.nexusHp / stats.maxNexusHp) * 100;
  return (
    <div style={{ background: '#121214', border: `1px solid ${color}22`, borderRadius: '6px', padding: '8px', flex: 1 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ fontSize:'10px', color: color, fontWeight:'900' }}>{side}</div>
        <div style={{ width:'60px', height:'4px', background:'#222', borderRadius:'2px', overflow:'hidden' }}>
           <div style={{ width:`${hpPercent}%`, height:'100%', background: hpPercent < 30 ? '#da3633' : color }} />
        </div>
      </div>
    </div>
  );
};

const NeutralObjBar = ({ obj, label, color, icon }: any) => {
  if (!obj) return null;
  const isAlive = obj.status === 'ALIVE';
  const percent = isAlive ? (obj.hp / obj.maxHp) * 100 : 0;
  return (
    <div style={{ flex: 1, background: '#121214', padding: '6px 10px', borderRadius: '4px', border: '1px solid #333' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', fontSize: '9px', fontWeight: 'bold' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: color }}>{icon} {label}</div>
        <span style={{ color: isAlive ? '#fff' : '#666' }}>{isAlive ? 'ALIVE' : 'RESPAWN'}</span>
      </div>
      <div style={{ width: '100%', height: '3px', background: '#000', borderRadius: '1px', overflow: 'hidden' }}>
         <div style={{ width: `${percent}%`, height: '100%', background: isAlive ? color : '#333', transition: 'width 0.3s' }} />
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------
// [3] 화면 컴포넌트
// ----------------------------------------------------------------------

// [A] 드래프트 화면
const DraftView: React.FC<{ match: LiveMatch, onClose: () => void, heroes: Hero[], setSpeed: any, gameState: any }> = ({ match, onClose, heroes, setSpeed, gameState }) => {
  const { blueTeam, redTeam, draft, bans } = match;
  const timer = Math.ceil(draft?.timer || 0);
  const turn = draft?.turnIndex || 0;
  
  const isBanPhase = turn < 10;
  const phaseLabel = isBanPhase ? '챔피언 금지 진행 중...' : '챔피언 선택 진행 중...';

  const blueBans = [...(bans?.blue || [])];
  const redBans = [...(bans?.red || [])];
  while(blueBans.length < 5) blueBans.push('');
  while(redBans.length < 5) redBans.push('');

  // 픽 순서 (0:Blue, 1:Red)
  const PICK_ORDER = [
    {team: 0, slot: 0}, {team: 1, slot: 0}, {team: 1, slot: 1}, {team: 0, slot: 1}, 
    {team: 0, slot: 2}, {team: 1, slot: 2}, {team: 1, slot: 3}, {team: 0, slot: 3}, 
    {team: 0, slot: 4}, {team: 1, slot: 4}
  ];

  let activeTeam = -1; // 0:Blue, 1:Red
  let activeSlot = -1; // 0~4

  if (!isBanPhase && (turn - 10) < PICK_ORDER.length) {
    const order = PICK_ORDER[turn - 10];
    activeTeam = order.team;
    activeSlot = order.slot;
  }

  // 밴 턴 계산 (0~9)
  const activeBanSlot = isBanPhase ? Math.floor(turn / 2) : -1;
  const activeBanTeam = isBanPhase ? (turn % 2) : -1;

  const getHeroName = (id: string) => heroes.find(h => h.id === id)?.name || '';

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', alignItems:'center', background:'#0d1117', overflowY:'auto' }}>
      
      {/* 상단바 (배속 버튼 추가) */}
      <div style={{ width:'100%', padding:'15px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ display:'flex', gap:'6px' }}>
           <SpeedButton label="1x" speed={1} currentSpeed={gameState.gameSpeed} setSpeed={setSpeed} />
           <SpeedButton label="3x" speed={3} currentSpeed={gameState.gameSpeed} setSpeed={setSpeed} />
           <SpeedButton label="5x" speed={5} currentSpeed={gameState.gameSpeed} setSpeed={setSpeed} />
           <SpeedButton label="Max" speed={600} currentSpeed={gameState.gameSpeed} setSpeed={setSpeed} />
        </div>
        <button onClick={onClose} style={{ background:'none', border:'none', color:'#fff', cursor:'pointer' }}><X size={28}/></button>
      </div>
      
      <div style={{ textAlign:'center', marginBottom:'20px' }}>
        <h2 style={{ color:'#fff', fontSize:'24px', margin:'0 0 10px 0' }}>DRAFT PHASE</h2>
        <div style={{ color:'#e84057', fontSize:'14px', marginBottom:'5px' }}>{phaseLabel}</div>
        <div style={{ fontSize:'36px', fontWeight:'900', color: timer <= 10 ? '#e74c3c' : '#fff' }}>{timer}</div>
      </div>

      {/* 밴 현황 (모바일 줄바꿈 적용) */}
      <div style={{ display:'flex', justifyContent:'space-between', width:'90%', maxWidth:'600px', marginBottom:'30px' }}>
        <div style={{ display:'flex', flexWrap:'wrap', gap:'4px', width:'48%', justifyContent:'flex-start' }}>
          {blueBans.map((id, i) => (
            <BanCard key={i} heroId={id} heroes={heroes} isActive={isBanPhase && activeBanTeam === 0 && activeBanSlot === i} />
          ))}
        </div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:'4px', width:'48%', justifyContent:'flex-end' }}>
          {redBans.map((id, i) => (
            <BanCard key={i} heroId={id} heroes={heroes} isActive={isBanPhase && activeBanTeam === 1 && activeBanSlot === i} />
          ))}
        </div>
      </div>

      {/* 픽 현황 (이름 표시 & 주체 강조) */}
      <div style={{ display:'flex', width:'100%', maxWidth:'800px', justifyContent:'space-between', padding:'0 20px', paddingBottom:'40px' }}>
        
        {/* 블루팀 픽 */}
        <div style={{ width:'48%' }}>
          <h3 style={{ color:'#58a6ff', borderBottom:'2px solid #58a6ff', paddingBottom:'5px', fontSize:'16px' }}>BLUE TEAM</h3>
          {blueTeam.map((p:any, i:number) => {
            const isPicking = (!isBanPhase && activeTeam === 0 && activeSlot === i);
            const isBanning = (isBanPhase && activeBanTeam === 0 && activeBanSlot === i);
            const isActive = isPicking || isBanning;
            
            const glowColor = isBanning ? 'rgba(255, 77, 77, 0.4)' : 'rgba(88, 166, 255, 0.4)';
            const borderColor = isActive ? (isBanning ? '#ff4d4d' : '#58a6ff') : 'transparent';

            return (
              <div key={i} style={{ 
                marginBottom:'8px', display:'flex', alignItems:'center', gap:'10px', 
                background: isActive ? `linear-gradient(90deg, ${glowColor}, transparent)` : '#161b22', 
                border: `1px solid ${borderColor}`,
                padding:'8px', borderRadius:'6px',
                transition: 'all 0.3s',
                boxShadow: isActive ? `0 0 15px ${glowColor}` : 'none',
                transform: isActive ? 'scale(1.02)' : 'scale(1)'
              }}>
                <GameIcon id={p.heroId} size={40} shape="square" />
                <div style={{ color: p.heroId ? '#fff' : '#555' }}>
                  <div style={{ fontSize:'12px', fontWeight:'bold' }}>{p.name}</div>
                  <div style={{ fontSize:'10px', color:'#888' }}>{p.lane}</div>
                  {p.heroId && <div style={{ fontSize:'11px', color:'#58a6ff', fontWeight:'bold', marginTop:'2px' }}>{getHeroName(p.heroId)}</div>}
                  {isBanning && <div style={{ fontSize:'9px', color:'#ff4d4d', fontWeight:'bold' }}>금지 중...</div>}
                  {isPicking && <div style={{ fontSize:'9px', color:'#fff', fontWeight:'bold' }}>선택 중...</div>}
                </div>
              </div>
            );
          })}
        </div>

        {/* 레드팀 픽 */}
        <div style={{ width:'48%' }}>
          <h3 style={{ color:'#e84057', borderBottom:'2px solid #e84057', paddingBottom:'5px', textAlign:'right', fontSize:'16px' }}>RED TEAM</h3>
          {redTeam.map((p:any, i:number) => {
            const isPicking = (!isBanPhase && activeTeam === 1 && activeSlot === i);
            const isBanning = (isBanPhase && activeBanTeam === 1 && activeBanSlot === i);
            const isActive = isPicking || isBanning;

            const glowColor = isBanning ? 'rgba(255, 77, 77, 0.4)' : 'rgba(232, 64, 87, 0.4)';
            const borderColor = isActive ? (isBanning ? '#ff4d4d' : '#e84057') : 'transparent';

            return (
              <div key={i} style={{ 
                marginBottom:'8px', display:'flex', flexDirection:'row-reverse', alignItems:'center', gap:'10px', 
                background: isActive ? `linear-gradient(90deg, transparent, ${glowColor})` : '#161b22', 
                border: `1px solid ${borderColor}`,
                padding:'8px', borderRadius:'6px',
                transition: 'all 0.3s',
                boxShadow: isActive ? `0 0 15px ${glowColor}` : 'none',
                transform: isActive ? 'scale(1.02)' : 'scale(1)'
              }}>
                <GameIcon id={p.heroId} size={40} shape="square" />
                <div style={{ textAlign:'right', color: p.heroId ? '#fff' : '#555' }}>
                  <div style={{ fontSize:'12px', fontWeight:'bold' }}>{p.name}</div>
                  <div style={{ fontSize:'10px', color:'#888' }}>{p.lane}</div>
                  {p.heroId && <div style={{ fontSize:'11px', color:'#e84057', fontWeight:'bold', marginTop:'2px' }}>{getHeroName(p.heroId)}</div>}
                  {isBanning && <div style={{ fontSize:'9px', color:'#ff4d4d', fontWeight:'bold' }}>금지 중...</div>}
                  {isPicking && <div style={{ fontSize:'9px', color:'#fff', fontWeight:'bold' }}>선택 중...</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// [B] 게임 화면 (기존 유지)
const GameView: React.FC<{ match: LiveMatch, onClose: () => void, heroes: Hero[], gameState: any, setSpeed: any, togglePlay: any }> = ({ match, onClose, heroes, gameState, setSpeed, togglePlay }) => {
  const [selectedHeroId, setSelectedHeroId] = useState<string | null>(null);
  const [viewingItem, setViewingItem] = useState<any | null>(null);
  const [viewingBanHero, setViewingBanHero] = useState<any>(null);

  const isGameEnded = match.currentDuration > match.duration || (match.stats?.blue?.nexusHp <= 0 || match.stats?.red?.nexusHp <= 0);
  const formatTime = (seconds: number) => {
    const m = Math.floor((seconds || 0) / 60); const s = Math.floor((seconds || 0) % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };
  const getHeroName = (id: string) => heroes.find((h:Hero) => h.id === id)?.name || id;

  const blueTeam = match.blueTeam || [];
  const redTeam = match.redTeam || [];
  const blueBans = match.bans?.blue || [];
  const redBans = match.bans?.red || [];

  let selectedPlayer = null;
  if (selectedHeroId) selectedPlayer = [...blueTeam, ...redTeam].find(p => p.heroId === selectedHeroId);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#050505' }}>
      <div style={{ flexShrink: 0, background: '#121214', borderBottom: '1px solid #222', padding: '8px 12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom:'6px' }}>
          <div style={{ display:'flex', gap:'15px', alignItems:'center', flex:1, justifyContent:'center' }}>
             <span style={{ color: '#58a6ff', fontWeight: '900', fontSize:'24px' }}>{match.score?.blue || 0}</span>
             <div style={{ background:'#000', padding:'4px 12px', borderRadius:'6px', border:'1px solid #333', color:'#fff', fontSize:'14px', fontFamily:'monospace', fontWeight:'bold' }}>
               {isGameEnded ? '종료됨' : formatTime(match.currentDuration)}
             </div>
             <span style={{ color: '#e84057', fontWeight: '900', fontSize:'24px' }}>{match.score?.red || 0}</span>
          </div>
          <button onClick={onClose} style={{ position:'absolute', right:'10px', top:'10px', background:'none', border:'none', color:'#888', cursor:'pointer' }}><X size={24}/></button>
        </div>
        <div style={{ display:'flex', justifyContent:'center', gap:'6px' }}>
           <button onClick={togglePlay} style={{ width:'60px', height:'26px', borderRadius:'4px', background: gameState.isPlaying ? '#3f1515' : '#153f1f', color: gameState.isPlaying ? '#ff6b6b' : '#3fb950', border:'1px solid #333', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
              {gameState.isPlaying ? <Pause size={14}/> : <Play size={14}/>}
           </button>
           <SpeedButton label="1x" speed={1} currentSpeed={gameState.gameSpeed} setSpeed={setSpeed} />
           <SpeedButton label="3x" speed={3} currentSpeed={gameState.gameSpeed} setSpeed={setSpeed} />
           <SpeedButton label="5x" speed={5} currentSpeed={gameState.gameSpeed} setSpeed={setSpeed} />
           <SpeedButton label="Max" speed={600} currentSpeed={gameState.gameSpeed} setSpeed={setSpeed} />
        </div>
      </div>

      <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'space-between', padding: '6px 12px', background: '#0a0a0c', borderBottom: '1px solid #222' }}>
         <div style={{ display: 'flex', gap: '5px' }}>
            <span style={{ fontSize:'9px', color:'#58a6ff', fontWeight:'bold', marginRight:'4px' }}>BAN</span>
            {blueBans.map((id: string, i: number) => <BanCard key={i} heroId={id} heroes={heroes} onClick={(hid:any) => setViewingBanHero(heroes.find((h:Hero)=>h.id===hid))} />)}
         </div>
         <div style={{ display: 'flex', gap: '5px' }}>
            {redBans.map((id: string, i: number) => <BanCard key={i} heroId={id} heroes={heroes} onClick={(hid:any) => setViewingBanHero(heroes.find((h:Hero)=>h.id===hid))} />)}
            <span style={{ fontSize:'9px', color:'#e84057', fontWeight:'bold', marginLeft:'4px' }}>BAN</span>
         </div>
      </div>

      <div style={{ flexShrink: 0, display:'grid', gridTemplateColumns: '1fr 1fr', gap:'8px', padding:'8px', background:'#0a0a0c' }}>
         <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
            {blueTeam.map((p: any, i: number) => <PlayerCard key={i} p={p} isSelected={selectedHeroId === p.heroId} onClick={() => setSelectedHeroId(p.heroId)} heroName={getHeroName(p.heroId)} teamColor="#58a6ff" />)}
         </div>
         <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
            {redTeam.map((p: any, i: number) => <PlayerCard key={i} p={p} isSelected={selectedHeroId === p.heroId} onClick={() => setSelectedHeroId(p.heroId)} heroName={getHeroName(p.heroId)} teamColor="#e84057" />)}
         </div>
      </div>

      <div style={{ flexShrink: 0, display:'flex', gap:'6px', padding:'8px', background:'#0a0a0c', borderTop:'1px solid #222' }}>
         <ObjectStatBox stats={match.stats.blue} color="#58a6ff" side="BLUE" />
         <ObjectStatBox stats={match.stats.red} color="#e84057" side="RED" />
      </div>
      
      <div style={{ flex: 1, overflowY: 'auto', background: '#000', display:'flex', flexDirection:'column' }}>
         {selectedPlayer && selectedPlayer.heroId ? (
            <div style={{ display:'flex', flexDirection:'column', background:'#0a0a0c', borderTop:'1px solid #333', paddingBottom:'40px' }}>
              <div onClick={() => { setSelectedHeroId(null); setViewingItem(null); }} style={{ padding:'10px', background:'#21262d', color:'#fff', fontWeight:'bold', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', borderBottom:'1px solid #333', fontSize:'12px' }}>
                <ChevronLeft size={14} /> 전체 전투 로그로 돌아가기
              </div>
              <UserDetailView player={selectedPlayer} heroName={getHeroName(selectedPlayer.heroId)} viewingItem={viewingItem} setViewingItem={setViewingItem} />
              <PersonalLogView logs={match.logs || []} heroName={getHeroName(selectedPlayer.heroId)} summonerName={selectedPlayer.name} formatTime={formatTime} />
            </div>
         ) : (
            <>
               <div style={{ padding:'6px 12px', background:'#121214', borderBottom: '1px solid #222', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Terminal size={14} color="#666"/><span style={{ fontSize:'11px', color:'#8b949e', fontWeight:'bold' }}>BATTLE LOG</span>
               </div>
               <GlobalLogPanel logs={match.logs || []} formatTime={formatTime} />
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

export const SpectateModal: React.FC<any> = ({ match: initialMatch, onClose }) => {
  const { heroes, gameState, setSpeed, togglePlay } = useGameStore();
  const liveMatch = gameState.liveMatches.find(m => m.id === initialMatch.id);
  const match = liveMatch || initialMatch;

  if (!match) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#050505', zIndex: 30000, display:'flex', justifyContent:'center', alignItems:'center', color:'#888' }}>
        <p>게임을 찾을 수 없습니다.</p>
        <button onClick={onClose} style={{ marginLeft:'10px', padding:'5px 10px' }}>닫기</button>
      </div>
    );
  }

  // [핵심] key 속성 추가로 Error #310 완전 방지
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#050505', zIndex: 30000 }}>
      <ErrorBoundary>
        {match.status === 'DRAFTING' ? (
          <DraftView key="draft" match={match} onClose={onClose} heroes={heroes} setSpeed={setSpeed} gameState={gameState} />
        ) : (
          <GameView key="game" match={match} onClose={onClose} heroes={heroes} gameState={gameState} setSpeed={setSpeed} togglePlay={togglePlay} />
        )}
      </ErrorBoundary>
    </div>
  );
};
