// ==========================================
// FILE PATH: /src/components/battle/LiveGameListModal.tsx
// ==========================================

import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { X, Eye, Swords, Clock, User, ChevronDown, ChevronUp } from 'lucide-react';
import { LiveMatch, LivePlayer } from '../../types';

interface Props { onClose: () => void; onSpectate: (match: LiveMatch) => void; }

export const LiveGameListModal: React.FC<Props> = ({ onClose, onSpectate }) => {
  const { gameState, heroes } = useGameStore();
  const matches = gameState.liveMatches;

  // 모바일 여부 확인
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  // 선택된 매치 ID (모바일은 처음에 아무것도 선택 안 함 = null)
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      // PC로 전환되면 첫 번째 게임 자동 선택
      if (!mobile && !selectedMatchId && matches.length > 0) {
        setSelectedMatchId(matches[0].id);
      }
    };
    window.addEventListener('resize', handleResize);
    // 초기 로드 시 PC라면 첫 번째 선택
    if (!isMobile && matches.length > 0 && !selectedMatchId) {
      setSelectedMatchId(matches[0].id);
    }
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobile, matches, selectedMatchId]);

  const getHeroName = (id: string) => heroes.find(h => h.id === id)?.name || id;

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}분 ${String(s).padStart(2, '0')}초`;
  };

  // 게임 목록 아이템 (공통)
  const MatchListItem = ({ match, isSelected, onClick }: { match: LiveMatch, isSelected: boolean, onClick: () => void }) => (
    <div 
      onClick={onClick}
      style={{ 
        padding: '15px', 
        borderBottom: '1px solid #2c2c2f', 
        cursor: 'pointer',
        background: isSelected ? '#2a2a2e' : '#1c1c1f',
        borderLeft: isSelected ? '4px solid #58a6ff' : '4px solid transparent',
        transition: 'background 0.2s'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '11px', color: '#888' }}>
        <span>{match.avgTier}</span>
        <span style={{ display:'flex', alignItems:'center', gap:'4px', fontFamily:'monospace' }}>
          <Clock size={10}/> {formatDuration(match.currentDuration)}
        </span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display:'flex', gap:'8px', alignItems:'center', width:'40%' }}>
          <span style={{ color: '#58a6ff', fontSize: '15px', fontWeight:'900' }}>{match.score.blue}</span>
          <span style={{ fontSize:'10px', color:'#58a6ff55' }}>BLUE</span>
        </div>
        <div style={{ fontSize: '12px', color: '#555', fontWeight:'bold' }}>VS</div>
        <div style={{ display:'flex', gap:'8px', alignItems:'center', width:'40%', justifyContent:'flex-end' }}>
          <span style={{ fontSize:'10px', color:'#e8405755' }}>RED</span>
          <span style={{ color: '#e84057', fontSize: '15px', fontWeight:'900' }}>{match.score.red}</span>
        </div>
      </div>
      {/* 모바일일 때 펼침/접힘 아이콘 표시 */}
      {isMobile && (
        <div style={{ textAlign:'center', marginTop:'-10px', marginBottom:'-5px' }}>
          {isSelected ? <ChevronUp size={14} color="#555"/> : <ChevronDown size={14} color="#333"/>}
        </div>
      )}
    </div>
  );

  // 상세 정보 뷰 (공통 - 플레이어 목록 & 스코어보드)
  const MatchDetailView = ({ match }: { match: LiveMatch }) => (
    <div style={{ background: '#0d1117', paddingBottom: '20px', borderBottom: '1px solid #30363d' }}>

      {/* 상단: 관전 버튼 */}
      <div style={{ padding: '20px', textAlign: 'center', background: '#121212', borderBottom: '1px solid #333' }}>
        <button 
          onClick={() => onSpectate(match)}
          style={{ 
            padding: '10px 30px', borderRadius: '8px', 
            background: '#238636', color: '#fff', border: 'none', 
            fontSize: '14px', fontWeight: 'bold', cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            boxShadow: '0 4px 15px rgba(35,134,54,0.3)'
          }}
        >
          <Eye size={18} /> 실시간 관전 입장
        </button>
      </div>

      {/* 플레이어 목록 */}
      <div style={{ padding: '10px', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '10px' }}>

        {/* 블루팀 */}
        <div>
          <h4 style={{ color: '#58a6ff', margin: '10px 5px', fontSize:'11px', borderBottom: '2px solid #58a6ff', paddingBottom:'4px' }}>
            BLUE TEAM (단테)
          </h4>
          {match.blueTeam.map((p, i) => (
            <PlayerCard key={i} p={p} color="#58a6ff" heroName={getHeroName(p.heroId)} />
          ))}
        </div>

        {/* 레드팀 */}
        <div style={{ marginTop: isMobile ? '10px' : '0' }}>
          <h4 style={{ color: '#e84057', margin: '10px 5px', fontSize:'11px', borderBottom: '2px solid #e84057', paddingBottom:'4px', textAlign: isMobile ? 'left' : 'right' }}>
            RED TEAM (이즈마한)
          </h4>
          {match.redTeam.map((p, i) => (
            <PlayerCard key={i} p={p} color="#e84057" heroName={getHeroName(p.heroId)} alignRight={!isMobile} />
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: 'rgba(0,0,0,0.95)', zIndex: 9000,
      backdropFilter: 'blur(5px)',
      overflowY: 'auto', WebkitOverflowScrolling: 'touch',
      display: 'flex', justifyContent: 'center', 
      alignItems: isMobile ? 'flex-start' : 'center',
      padding: isMobile ? '0' : '20px'
    }}>

      <div className="panel" style={{ 
        width: isMobile ? '100%' : '1000px', 
        height: isMobile ? 'auto' : '80vh', 
        minHeight: isMobile ? '100vh' : 'auto',
        background: '#1c1c1f', 
        border: isMobile ? 'none' : '1px solid #30363d', 
        display: 'flex', flexDirection: 'column', 
        borderRadius: isMobile ? '0' : '12px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
        overflow: 'hidden'
      }}>

        {/* 헤더 */}
        <div style={{ 
          padding: '15px 20px', borderBottom: '1px solid #333', 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
          background:'#252528', position: isMobile ? 'sticky' : 'relative', top: 0, zIndex: 50 
        }}>
          <h3 style={{ margin: 0, color:'#fff', display:'flex', alignItems:'center', gap:'10px', fontSize:'16px' }}>
            <Swords size={20} /> 진행 중인 게임 ({matches.length})
          </h3>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#fff', cursor:'pointer' }}><X size={24}/></button>
        </div>

        {/* [모바일] 아코디언 방식 렌더링 */}
        {isMobile ? (
          <div style={{ flex: 1 }}>
            {matches.map(match => (
              <div key={match.id}>
                <MatchListItem 
                  match={match} 
                  isSelected={selectedMatchId === match.id} 
                  onClick={() => setSelectedMatchId(selectedMatchId === match.id ? null : match.id)} 
                />
                {/* 선택되면 바로 아래에 상세 정보 표시 (아코디언) */}
                {selectedMatchId === match.id && (
                  <MatchDetailView match={match} />
                )}
              </div>
            ))}
          </div>
        ) : (
          /* [PC] 좌우 분할 방식 렌더링 */
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            {/* 좌측 리스트 */}
            <div style={{ width: '320px', borderRight: '1px solid #333', overflowY: 'auto', background: '#161b22' }}>
              {matches.map(match => (
                <MatchListItem 
                  key={match.id} 
                  match={match} 
                  isSelected={selectedMatchId === match.id} 
                  onClick={() => setSelectedMatchId(match.id)} 
                />
              ))}
            </div>
            {/* 우측 상세 */}
            <div style={{ flex: 1, overflowY: 'auto', background: '#0d1117' }}>
              {selectedMatchId ? (
                <MatchDetailView match={matches.find(m => m.id === selectedMatchId)!} />
              ) : (
                <div style={{ padding: '50px', textAlign: 'center', color: '#666' }}>게임을 선택하세요.</div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

// 플레이어 카드 컴포넌트
const PlayerCard = ({ p, color, heroName, alignRight = false }: any) => (
  <div style={{ 
    display: 'flex', 
    flexDirection: alignRight ? 'row-reverse' : 'row',
    alignItems: 'center', 
    justifyContent: 'space-between',
    padding: '8px 10px', 
    marginBottom: '6px', 
    background: '#1c1c1f', 
    borderRadius: '6px', 
    borderLeft: alignRight ? 'none' : `3px solid ${color}`,
    borderRight: alignRight ? `3px solid ${color}` : 'none',
    boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexDirection: alignRight ? 'row-reverse' : 'row' }}>
      <div style={{ 
        width: '30px', height: '30px', background: '#252528', 
        borderRadius: '6px', display:'flex', alignItems:'center', justifyContent:'center', 
        border: `1px solid ${color}44`, fontSize:'16px'
      }}>
        🧙‍♂️
      </div>
      <div style={{ textAlign: alignRight ? 'right' : 'left' }}>
        <div style={{ color: '#fff', fontWeight:'bold', fontSize:'12px' }}>{heroName}</div>
        <div style={{ color: '#888', fontSize: '10px', display:'flex', alignItems:'center', gap:'3px', justifyContent: alignRight ? 'flex-end' : 'flex-start' }}>
          <User size={9}/> {p.name}
        </div>
      </div>
    </div>
    <div style={{ textAlign: alignRight ? 'left' : 'right' }}>
      <div style={{ color: '#ccc', fontWeight:'bold', fontSize:'12px', letterSpacing:'0.5px' }}>
        <span style={{color:'#fff'}}>{p.kills}</span>/<span style={{color:'#da3633'}}>{p.deaths}</span>/<span style={{color:'#fff'}}>{p.assists}</span>
      </div>
      <div style={{ color: '#e89d40', fontSize: '10px', fontWeight:'bold' }}>
        {(p.gold).toLocaleString()} G
      </div>
    </div>
  </div>
);