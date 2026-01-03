// ==========================================
// FILE PATH: /src/components/battle/spectate/InGameScreen.tsx
// ==========================================
import React, { useState } from 'react';
import { X, Play, Pause, ChevronLeft, Terminal } from 'lucide-react';
import { GameIcon } from '../../common/GameIcon';
import { useGameStore } from '../../../store/useGameStore';

// 분리된 UI 컴포넌트들
import { SpeedButton, PlayerCard, ObjectStatBox, BanCard, NeutralObjPanel } from './SpectateUI';
import { GlobalLogPanel } from './GlobalLogPanel';
import { PersonalLogView } from './PersonalLogView';
import { UserDetailView } from './UserDetailView';

export const InGameScreen: React.FC<any> = ({ match, onClose }) => {
  const { heroes, gameState, setSpeed, togglePlay } = useGameStore();

  // UI 상태 관리
  const [selectedHeroId, setSelectedHeroId] = useState<string | null>(null);
  const [viewingItem, setViewingItem] = useState<any>(null);
  const [viewingBanHero, setViewingBanHero] = useState<any>(null);

  // 헬퍼 함수 및 변수
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

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#050505' }}>

      {/* 1. 상단 헤더 (점수, 시간, 컨트롤러) */}
      <div style={{ flexShrink: 0, background: '#121214', borderBottom: '1px solid #222', padding: '8px 12px', zIndex: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom:'6px' }}>
          <div style={{ display:'flex', gap:'15px', alignItems:'center', flex:1, justifyContent:'center' }}>
             <span style={{ color: '#58a6ff', fontWeight: '900', fontSize:'24px' }}>{match.score.blue}</span>
             <div style={{ background:'#000', padding:'4px 12px', borderRadius:'6px', border:'1px solid #333', color:'#fff', fontSize:'14px', fontFamily:'monospace', fontWeight:'bold' }}>
               {isGameEnded ? '종료됨' : formatTime(match.currentDuration)}
             </div>
             <span style={{ color: '#e84057', fontWeight: '900', fontSize:'24px' }}>{match.score.red}</span>
          </div>
          <button onClick={onClose} style={{ position:'absolute', right:'10px', top:'10px', background:'none', border:'none', color:'#888', cursor:'pointer' }}><X size={24}/></button>
        </div>
        <div style={{ display:'flex', justifyContent:'center', gap:'6px' }}>
           <button onClick={togglePlay} style={{ width:'60px', height:'26px', borderRadius:'4px', background: gameState.isPlaying ? '#3f1515' : '#153f1f', color: gameState.isPlaying ? '#ff6b6b' : '#3fb950', border:'1px solid #333', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
              {gameState.isPlaying ? <Pause size={14}/> : <Play size={14}/>}
           </button>
           {[1, 10, 30, 60].map(s => <SpeedButton key={s} label={`${s}배`} speed={s} currentSpeed={gameState.gameSpeed} setSpeed={setSpeed} />)}
        </div>
      </div>

      {/* 2. 메인 컨텐츠 영역 (스크롤 가능) */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom:'20px' }}>

        {/* (A) 밴 목록 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', background: '#0a0a0c', borderBottom: '1px solid #222' }}>
           <div style={{ display: 'flex', gap: '5px' }}>{match.bans.blue.map((id:string, i:number) => <BanCard key={i} heroId={id} heroes={heroes} onClick={setViewingBanHero} />)}</div>
           <div style={{ display: 'flex', gap: '5px' }}>{match.bans.red.map((id:string, i:number) => <BanCard key={i} heroId={id} heroes={heroes} onClick={setViewingBanHero} />)}</div>
        </div>

        {/* (B) 플레이어 목록 (5vs5) */}
        <div style={{ display:'grid', gridTemplateColumns: '1fr 1fr', gap:'8px', padding:'8px', background:'#0a0a0c' }}>
           <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
              {match.blueTeam.map((p:any, i:number) => <PlayerCard key={i} p={p} isSelected={selectedHeroId === p.heroId} onClick={() => setSelectedHeroId(p.heroId)} heroName={getHeroName(p.heroId)} teamColor="#58a6ff" />)}
           </div>
           <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
              {match.redTeam.map((p:any, i:number) => <PlayerCard key={i} p={p} isSelected={selectedHeroId === p.heroId} onClick={() => setSelectedHeroId(p.heroId)} heroName={getHeroName(p.heroId)} teamColor="#e84057" />)}
           </div>
        </div>

        {/* (C) 타워 및 억제기 상태 */}
        <div style={{ display:'flex', gap:'6px', padding:'8px', background:'#0a0a0c' }}>
           <ObjectStatBox stats={match.stats.blue} color="#58a6ff" side="BLUE" />
           <ObjectStatBox stats={match.stats.red} color="#e84057" side="RED" />
        </div>

        {/* (D) 중립 오브젝트 (거신병/주시자) - 복구됨 */}
        <NeutralObjPanel 
          colossus={match.objectives?.colossus} 
          watcher={match.objectives?.watcher} 
          currentTime={match.currentDuration} 
        />

        {/* (E) 하단 로그 및 상세 정보 (조건부 렌더링) */}
        {selectedPlayer ? (
            <div style={{ display:'flex', flexDirection:'column', background:'#0a0a0c', borderTop:'1px solid #333', paddingBottom:'40px' }}>
              <div onClick={() => { setSelectedHeroId(null); setViewingItem(null); }} style={{ padding:'10px', background:'#21262d', color:'#fff', fontWeight:'bold', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', borderBottom:'1px solid #333', fontSize:'12px' }}>
                <ChevronLeft size={14} /> 전체 전투 로그로 돌아가기
              </div>

              {/* 유저 상세 정보 (아이템, 스탯 등) */}
              <UserDetailView player={selectedPlayer} heroName={getHeroName(selectedPlayer.heroId)} viewingItem={viewingItem} setViewingItem={setViewingItem} />

              {/* 개인 로그 (킬/데스 등) */}
              <PersonalLogView logs={match.logs} heroName={getHeroName(selectedPlayer.heroId)} summonerName={selectedPlayer.name} formatTime={formatTime} />
            </div>
         ) : (
            <>
               <div style={{ padding:'6px 12px', background:'#121214', borderBottom: '1px solid #222', borderTop: '1px solid #222', display: 'flex', alignItems: 'center', gap: '6px', marginTop:'10px' }}>
                  <Terminal size={14} color="#666"/><span style={{ fontSize:'11px', color:'#8b949e', fontWeight:'bold' }}>BATTLE LOG</span>
               </div>

               {/* 전체 로그 패널 */}
               <GlobalLogPanel logs={match.logs} gameSpeed={gameState.gameSpeed} formatTime={formatTime} />
            </>
         )}
      </div>

      {/* (F) 밴 영웅 크게 보기 모달 */}
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