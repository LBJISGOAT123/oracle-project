// ==========================================
// FILE PATH: /src/components/battle/LiveGameListModal.tsx
// ==========================================

import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { X, Eye, Swords, Clock, User, ChevronDown, ChevronUp, Target } from 'lucide-react';
import { LiveMatch } from '../../types';
import { GameIcon } from '../common/GameIcon';

interface Props { onClose: () => void; onSpectate: (match: LiveMatch) => void; }

export const LiveGameListModal: React.FC<Props> = ({ onClose, onSpectate }) => {
  const { gameState, heroes } = useGameStore();
  const matches = gameState.liveMatches;

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile && !selectedMatchId && matches.length > 0) {
        setSelectedMatchId(matches[0].id);
      }
    };
    window.addEventListener('resize', handleResize);
    if (!isMobile && matches.length > 0 && !selectedMatchId) {
      setSelectedMatchId(matches[0].id);
    }
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobile, matches, selectedMatchId]);

  const getHeroName = (id: string) => heroes.find(h => h.id === id)?.name || id;

  const formatDuration = (seconds: number) => {
    const totalSeconds = Math.floor(seconds); 
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}분 ${String(s).padStart(2, '0')}초`;
  };

  const MatchListItem = ({ match, isSelected, onClick }: { match: LiveMatch, isSelected: boolean, onClick: () => void }) => (
    <div 
      onClick={onClick}
      style={{ 
        padding: '12px 15px', 
        borderBottom: '1px solid #2c2c2f', 
        cursor: 'pointer',
        background: isSelected ? '#2a2a2e' : '#1c1c1f',
        borderLeft: isSelected ? '4px solid #58a6ff' : '4px solid transparent',
        transition: 'background 0.2s'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '11px', color: '#888' }}>
        <span style={{ fontWeight:'bold', color:'#ccc' }}>{match.avgTier}</span>
        <span style={{ display:'flex', alignItems:'center', gap:'4px', fontFamily:'monospace' }}>
          <Clock size={10}/> {formatDuration(match.currentDuration)}
        </span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display:'flex', gap:'8px', alignItems:'center', width:'40%' }}>
          <span style={{ color: '#58a6ff', fontSize: '16px', fontWeight:'900' }}>{match.score.blue}</span>
          <span style={{ fontSize:'10px', color:'#58a6ff55', fontWeight:'bold' }}>BLUE</span>
        </div>
        <div style={{ fontSize: '11px', color: '#555', fontWeight:'bold' }}>VS</div>
        <div style={{ display:'flex', gap:'8px', alignItems:'center', width:'40%', justifyContent:'flex-end' }}>
          <span style={{ fontSize:'10px', color:'#e8405755', fontWeight:'bold' }}>RED</span>
          <span style={{ color: '#e84057', fontSize: '16px', fontWeight:'900' }}>{match.score.red}</span>
        </div>
      </div>
      {isMobile && (
        <div style={{ textAlign:'center', marginTop:'-5px', opacity:0.5 }}>
          {isSelected ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
        </div>
      )}
    </div>
  );

  const MatchDetailView = ({ match }: { match: LiveMatch | undefined }) => {
    if (!match) {
        return (
            <div style={{ padding: '50px', textAlign: 'center', color: '#666', fontSize:'13px' }}>
                선택된 게임이 종료되었거나 정보를 불러올 수 없습니다.
            </div>
        );
    }

    return (
      <div style={{ background: '#0d1117', height:'100%', display:'flex', flexDirection:'column' }}>
        <div style={{ padding: '15px', textAlign: 'center', background: '#161b22', borderBottom: '1px solid #333', flexShrink:0 }}>
          <button 
            onClick={() => onSpectate(match)}
            style={{ 
              padding: '10px 40px', borderRadius: '8px', 
              background: '#238636', color: '#fff', border: 'none', 
              fontSize: '14px', fontWeight: 'bold', cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              boxShadow: '0 4px 15px rgba(35,134,54,0.3)',
              transition: '0.2s'
            }}
          >
            <Eye size={18} /> 실시간 관전 입장
          </button>
        </div>

        <div style={{ padding: '15px', overflowY:'auto', flex:1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '15px' }}>
            <div>
              <h4 style={{ color: '#58a6ff', margin: '0 0 10px 0', fontSize:'12px', borderBottom: '2px solid #58a6ff', paddingBottom:'6px', display:'flex', justifyContent:'space-between' }}>
                <span>BLUE TEAM (단테)</span>
                <span style={{ color:'#fff' }}>{match.score.blue}</span>
              </h4>
              {match.blueTeam && match.blueTeam.map((p, i) => (
                <PlayerCard key={i} p={p} color="#58a6ff" heroName={getHeroName(p.heroId)} />
              ))}
            </div>

            <div style={{ marginTop: isMobile ? '20px' : '0' }}>
              <h4 style={{ color: '#e84057', margin: '0 0 10px 0', fontSize:'12px', borderBottom: '2px solid #e84057', paddingBottom:'6px', textAlign: isMobile ? 'left' : 'right', display:'flex', flexDirection: isMobile ? 'row' : 'row-reverse', justifyContent:'space-between' }}>
                <span>RED TEAM (이즈마한)</span>
                <span style={{ color:'#fff' }}>{match.score.red}</span>
              </h4>
              {match.redTeam && match.redTeam.map((p, i) => (
                <PlayerCard key={i} p={p} color="#e84057" heroName={getHeroName(p.heroId)} alignRight={!isMobile} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 9000,
      backdropFilter: 'blur(5px)',
      display: 'flex', justifyContent: 'center', 
      alignItems: 'center',
      padding: isMobile ? '0' : '40px'
    }}>

      <div className="panel" style={{ 
        width: isMobile ? '100%' : '1100px', 
        height: isMobile ? '100%' : '85vh', 
        background: '#1c1c1f', 
        border: isMobile ? 'none' : '1px solid #30363d', 
        display: 'flex', flexDirection: 'column', 
        borderRadius: isMobile ? '0' : '16px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.9)',
        overflow: 'hidden'
      }}>

        <div style={{ 
          padding: '15px 20px', borderBottom: '1px solid #333', 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
          background:'#252528', zIndex: 50 
        }}>
          <h3 style={{ margin: 0, color:'#fff', display:'flex', alignItems:'center', gap:'10px', fontSize:'16px' }}>
            <Swords size={20} color="#f1c40f"/> 진행 중인 게임 ({matches.length})
          </h3>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#ccc', cursor:'pointer' }}><X size={24}/></button>
        </div>

        {isMobile ? (
          <div style={{ flex: 1, overflowY:'auto' }}>
            {matches.map(match => (
              <div key={match.id}>
                <MatchListItem 
                  match={match} 
                  isSelected={selectedMatchId === match.id} 
                  onClick={() => setSelectedMatchId(selectedMatchId === match.id ? null : match.id)} 
                />
                {selectedMatchId === match.id && (
                  <div style={{ height:'500px', borderBottom:'1px solid #333' }}>
                    <MatchDetailView match={match} />
                  </div>
                )}
              </div>
            ))}
            {matches.length === 0 && <div style={{padding:'40px', textAlign:'center', color:'#555'}}>진행 중인 게임이 없습니다.</div>}
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            <div style={{ width: '300px', borderRight: '1px solid #333', overflowY: 'auto', background: '#161b22' }}>
              {matches.map(match => (
                <MatchListItem 
                  key={match.id} 
                  match={match} 
                  isSelected={selectedMatchId === match.id} 
                  onClick={() => setSelectedMatchId(match.id)} 
                />
              ))}
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <MatchDetailView match={matches.find(m => m.id === selectedMatchId)} />
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

// [수정] PlayerCard: KDA, 골드, CS, 딜량 표시
const PlayerCard = ({ p, color, heroName, alignRight = false }: any) => {
  const isDead = p.currentHp <= 0;

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: alignRight ? 'row-reverse' : 'row',
      alignItems: 'center', 
      justifyContent: 'space-between',
      padding: '8px 12px', 
      marginBottom: '6px', 
      background: '#1c1c1f', 
      borderRadius: '6px', 
      borderLeft: alignRight ? 'none' : `3px solid ${color}`,
      borderRight: alignRight ? `3px solid ${color}` : 'none',
      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
      opacity: isDead ? 0.6 : 1,
      filter: isDead ? 'grayscale(0.8)' : 'none'
    }}>
      {/* 1. 영웅 정보 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexDirection: alignRight ? 'row-reverse' : 'row' }}>
        <div style={{ position:'relative' }}>
          <GameIcon id={p.heroId} size={38} shape="rounded" border={`1px solid ${color}44`} />
          <div style={{ position:'absolute', bottom:-3, right:-3, background:'#0d1117', color:'#fff', fontSize:'10px', fontWeight:'bold', padding:'0 3px', borderRadius:'3px', border:'1px solid #333' }}>
            {p.level}
          </div>
        </div>

        <div style={{ textAlign: alignRight ? 'right' : 'left' }}>
          <div style={{ color: '#fff', fontWeight:'bold', fontSize:'13px', lineHeight:'1.2' }}>{heroName}</div>
          <div style={{ color: '#8b949e', fontSize:'11px', display:'flex', alignItems:'center', gap:'3px', justifyContent: alignRight ? 'flex-end' : 'flex-start' }}>
            <User size={10}/> {p.name}
          </div>
        </div>
      </div>

      {/* 2. 상세 스탯 (KDA / 골드 / CS / 딜량) */}
      <div style={{ textAlign: alignRight ? 'left' : 'right', display:'flex', flexDirection:'column', alignItems: alignRight ? 'flex-start' : 'flex-end', gap:'2px' }}>

        {/* KDA */}
        <div style={{ color: '#fff', fontWeight:'bold', fontSize:'13px', fontFamily:'monospace', letterSpacing:'-0.5px' }}>
          {p.kills}/<span style={{color:'#da3633'}}>{p.deaths}</span>/{p.assists}
        </div>

        {/* 골드 & CS */}
        <div style={{ fontSize: '10px', fontWeight:'bold', display:'flex', gap:'6px' }}>
          <span style={{ color: '#e89d40' }}>{(p.gold / 1000).toFixed(1)}k</span>
          <span style={{ color: '#444' }}>|</span>
          <span style={{ color: '#ccc' }}>{p.cs} CS</span>
        </div>

        {/* 딜량 (빨간색) */}
        <div style={{ fontSize: '9px', fontWeight:'bold', color: '#ff6b6b', display:'flex', alignItems:'center', gap:'3px' }}>
          <Swords size={9}/> {(p.totalDamageDealt || 0).toLocaleString()}
        </div>

      </div>
    </div>
  );
};