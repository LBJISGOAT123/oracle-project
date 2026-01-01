// ==========================================
// FILE PATH: /src/components/battle/SpectateModal.tsx
// ==========================================

import React, { Component, ErrorInfo, useState, useEffect, useRef } from 'react';
import { X, Terminal, ChevronLeft, Pause, Play, Skull, Eye, AlertTriangle, Swords, Ban, Circle } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';
import { GameIcon } from '../common/GameIcon';
import { LiveMatch, Hero } from '../../types';

// [1] 안전장치: 에러 바운더리 (관전 중 에러가 나도 앱 전체가 꺼지지 않게 함)
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
          <h3>관전 화면을 불러오는 중 문제가 발생했습니다.</h3>
          <p style={{ fontSize: '12px', color: '#888', marginBottom:'20px' }}>{this.state.errorMsg}</p>
          <button onClick={() => window.location.reload()} style={{ padding:'10px 20px', background:'#333', color:'#fff', border:'1px solid #555', borderRadius:'4px', cursor:'pointer' }}>
            새로고침
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// [2] 작은 컴포넌트들 (파일 내부 정의로 의존성 문제 해결)
const SpeedButton = ({ label, speed, currentSpeed, setSpeed }: any) => (
  <button onClick={() => setSpeed(speed)} style={{ flex: 1, padding: '4px 0', background: currentSpeed === speed ? '#58a6ff' : '#1c1c1f', border: `1px solid ${currentSpeed === speed ? '#58a6ff' : '#333'}`, borderRadius: '4px', color: currentSpeed === speed ? '#000' : '#888', fontSize: '10px', fontWeight: '800', cursor: 'pointer', height: '24px' }}>
    {label}
  </button>
);

const BanCard = ({ heroId, heroes, onClick }: any) => {
  const hero = heroes.find((h:Hero) => h.id === heroId);
  return (
    <div onClick={() => heroId && onClick(heroId)} style={{ position: 'relative', width: '24px', height: '24px', borderRadius: '3px', overflow: 'hidden', background:'#111', border:'1px solid #333', cursor:'pointer' }}>
      {heroId ? (
        <>
          <div style={{ filter: 'grayscale(100%) brightness(0.5)' }}><GameIcon id={heroId} size={24} shape="square" /></div>
          <div style={{ position: 'absolute', top: '50%', left: '50%', width: '140%', height: '2px', backgroundColor: '#da3633', transform: 'translate(-50%, -50%) rotate(45deg)' }} />
        </>
      ) : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center' }}><Ban size={12} color="#333"/></div>}
    </div>
  );
};

const PlayerCard = ({ p, isSelected, onClick, heroName, teamColor }: any) => {
  const maxHp = p.maxHp || 1;
  const currentHp = p.currentHp || 0;
  const hpPercent = (currentHp / maxHp) * 100;
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
        <span style={{ color: isAlive ? '#fff' : '#666' }}>{isAlive ? 'ALIVE' : 'RESPAWNING'}</span>
      </div>
      <div style={{ width: '100%', height: '3px', background: '#000', borderRadius: '1px', overflow: 'hidden' }}>
         <div style={{ width: `${percent}%`, height: '100%', background: isAlive ? color : '#333', transition: 'width 0.3s' }} />
      </div>
    </div>
  );
};

const GlobalLogPanel = ({ logs, formatTime }: any) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const visibleLogs = logs.slice().reverse().slice(0, 50); // 최신 50개만 표시

  return (
    <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '10px', background: '#050505', display:'flex', flexDirection:'column', gap:'6px' }}>
      {visibleLogs.map((log: any, i: number) => {
        let badgeColor = '#888'; let badgeText = 'INFO';
        if (log.type === 'KILL') { badgeColor = '#ff4d4d'; badgeText = 'KILL'; }
        else if (log.type === 'TOWER') { badgeColor = '#e89d40'; badgeText = 'OBJ'; }
        else if (log.type === 'START') { badgeColor = '#f1c40f'; badgeText = 'SYS'; }
        return (
          <div key={i} style={{ display: 'flex', gap: '8px', padding: '2px 0', borderBottom: '1px solid #1a1a1c', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '10px', color: '#555', fontFamily: 'monospace', minWidth: '35px' }}>{formatTime(log.time)}</span>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '8px', fontWeight: '900', color: badgeColor, background: `${badgeColor}15`, padding: '0px 4px', borderRadius: '2px', border: `1px solid ${badgeColor}33`, minWidth:'28px', textAlign:'center' }}>{badgeText}</span>
              <span style={{ fontSize: '11px', color: '#ccc', lineHeight: '1.4' }}>{log.message}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// [3] 메인 컨텐츠
const SpectateContent: React.FC<any> = ({ match: initialMatch, onClose }) => {
  const { heroes, gameState, setSpeed, togglePlay } = useGameStore();
  
  // 실시간 매치 데이터 동기화
  const liveMatch = gameState.liveMatches.find(m => m.id === initialMatch.id);
  const match = liveMatch || initialMatch;

  // 게임이 없으면 종료 처리
  if (!match) {
    return <div style={{padding:'20px', color:'#fff'}}>게임이 종료되었습니다. <button onClick={onClose}>닫기</button></div>;
  }

  // [수정] 드래프트 상태 체크 로직 강화
  const isDrafting = match.status === 'DRAFTING';

  // ----------------------------------------------------------------
  // A. 드래프트 화면 (밴픽)
  // ----------------------------------------------------------------
  if (isDrafting) {
    const { blueTeam, redTeam, draft } = match;
    const timer = Math.ceil(draft?.timer || 0);
    const turn = draft?.turnIndex || 0;
    const phaseLabel = turn < 10 ? '챔피언 금지 진행 중...' : '챔피언 선택 진행 중...';

    return (
      <div style={{ height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'#0d1117' }}>
        <button onClick={onClose} style={{ position:'absolute', right:'20px', top:'20px', background:'none', border:'none', color:'#fff', cursor:'pointer' }}><X size={30}/></button>
        
        <div style={{ marginBottom:'40px', textAlign:'center' }}>
          <h2 style={{ color:'#fff', fontSize:'24px', margin:'0 0 10px 0' }}>DRAFT PHASE</h2>
          <div style={{ color:'#e84057', fontSize:'14px', marginBottom:'5px' }}>{phaseLabel}</div>
          <div style={{ fontSize:'32px', fontWeight:'900', color:'#fff' }}>{timer}</div>
        </div>

        <div style={{ display:'flex', width:'100%', maxWidth:'800px', justifyContent:'space-between', padding:'0 20px' }}>
          {/* 블루팀 */}
          <div style={{ width:'45%' }}>
            <h3 style={{ color:'#58a6ff', borderBottom:'2px solid #58a6ff', paddingBottom:'5px' }}>BLUE TEAM</h3>
            {blueTeam.map((p:any, i:number) => (
              <div key={i} style={{ marginBottom:'8px', display:'flex', alignItems:'center', gap:'10px', background:'#161b22', padding:'8px', borderRadius:'6px' }}>
                <GameIcon id={p.heroId} size={40} shape="square" />
                <div style={{ color: p.heroId ? '#fff' : '#555' }}>
                  <div style={{ fontSize:'12px', fontWeight:'bold' }}>{p.name}</div>
                  <div style={{ fontSize:'10px', color:'#888' }}>{p.lane}</div>
                </div>
              </div>
            ))}
          </div>

          {/* 레드팀 */}
          <div style={{ width:'45%' }}>
            <h3 style={{ color:'#e84057', borderBottom:'2px solid #e84057', paddingBottom:'5px', textAlign:'right' }}>RED TEAM</h3>
            {redTeam.map((p:any, i:number) => (
              <div key={i} style={{ marginBottom:'8px', display:'flex', flexDirection:'row-reverse', alignItems:'center', gap:'10px', background:'#161b22', padding:'8px', borderRadius:'6px' }}>
                <GameIcon id={p.heroId} size={40} shape="square" />
                <div style={{ textAlign:'right', color: p.heroId ? '#fff' : '#555' }}>
                  <div style={{ fontSize:'12px', fontWeight:'bold' }}>{p.name}</div>
                  <div style={{ fontSize:'10px', color:'#888' }}>{p.lane}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------------
  // B. 인게임 관전 화면
  // ----------------------------------------------------------------
  const isGameEnded = !liveMatch;
  const [selectedHeroId, setSelectedHeroId] = useState<string | null>(null);
  const [viewingBanHero, setViewingBanHero] = useState<any>(null);

  const getHeroName = (id: string) => {
    if (!id) return '-';
    return heroes.find((h:Hero) => h.id === id)?.name || id;
  };
  
  const formatTime = (seconds: number) => {
    const m = Math.floor((seconds || 0) / 60); 
    const s = Math.floor((seconds || 0) % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const blueBans = match.bans?.blue || [];
  const redBans = match.bans?.red || [];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#050505' }}>
      
      {/* 1. 상단 바 */}
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
           <SpeedButton label="1m" speed={60} currentSpeed={gameState.gameSpeed} setSpeed={setSpeed} />
           <SpeedButton label="10m" speed={600} currentSpeed={gameState.gameSpeed} setSpeed={setSpeed} />
        </div>
      </div>

      {/* 2. 밴 정보 */}
      <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'space-between', padding: '6px 12px', background: '#0a0a0c', borderBottom: '1px solid #222' }}>
         <div style={{ display: 'flex', gap: '3px' }}>
            <span style={{ fontSize:'9px', color:'#58a6ff', fontWeight:'bold', marginRight:'4px' }}>BAN</span>
            {blueBans.map((id: string, i: number) => <BanCard key={i} heroId={id} heroes={heroes} onClick={(hid: any) => setViewingBanHero(heroes.find((h:Hero)=>h.id===hid))} />)}
         </div>
         <div style={{ display: 'flex', gap: '3px' }}>
            {redBans.map((id: string, i: number) => <BanCard key={i} heroId={id} heroes={heroes} onClick={(hid: any) => setViewingBanHero(heroes.find((h:Hero)=>h.id===hid))} />)}
            <span style={{ fontSize:'9px', color:'#e84057', fontWeight:'bold', marginLeft:'4px' }}>BAN</span>
         </div>
      </div>

      {/* 3. 팀 리스트 */}
      <div style={{ flexShrink: 0, display:'grid', gridTemplateColumns: '1fr 1fr', gap:'8px', padding:'8px', background:'#0a0a0c' }}>
         <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
            {match.blueTeam.map((p: any, i: number) => (
              <PlayerCard key={i} p={p} isSelected={selectedHeroId === p.heroId} onClick={() => setSelectedHeroId(p.heroId)} heroName={getHeroName(p.heroId)} teamColor="#58a6ff" />
            ))}
         </div>
         <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
            {match.redTeam.map((p: any, i: number) => (
              <PlayerCard key={i} p={p} isSelected={selectedHeroId === p.heroId} onClick={() => setSelectedHeroId(p.heroId)} heroName={getHeroName(p.heroId)} teamColor="#e84057" />
            ))}
         </div>
      </div>

      {/* 4. 전장 정보 (오브젝트) */}
      <div style={{ flexShrink: 0, display:'flex', gap:'6px', padding:'8px', background:'#0a0a0c', borderTop:'1px solid #222' }}>
         <ObjectStatBox stats={match.stats?.blue} color="#58a6ff" side="BLUE" />
         <ObjectStatBox stats={match.stats?.red} color="#e84057" side="RED" />
      </div>
      
      {match.objectives && (
        <div style={{ flexShrink: 0, display:'flex', gap:'6px', padding:'6px 8px', background:'#08080a', borderBottom:'1px solid #222' }}>
            <NeutralObjBar obj={match.objectives.colossus} label="거신병" color="#7ee787" icon={<Skull size={10}/>} />
            <NeutralObjBar obj={match.objectives.watcher} label="주시자" color="#a371f7" icon={<Eye size={10}/>} />
        </div>
      )}

      {/* 5. 로그 영역 */}
      <div style={{ flex: 1, overflowY: 'auto', background: '#000', display:'flex', flexDirection:'column' }}>
         <div style={{ padding:'6px 12px', background:'#121214', borderBottom: '1px solid #222', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Terminal size={14} color="#666"/><span style={{ fontSize:'11px', color:'#8b949e', fontWeight:'bold' }}>BATTLE LOG</span>
         </div>
         <GlobalLogPanel logs={match.logs || []} formatTime={formatTime} />
      </div>

      {/* 밴 정보 팝업 */}
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

// [4] 최종 내보내기 (ErrorBoundary 적용)
export const SpectateModal: React.FC<any> = (props) => {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#050505', zIndex: 30000 }}>
      <ErrorBoundary>
        <SpectateContent {...props} />
      </ErrorBoundary>
    </div>
  );
};
