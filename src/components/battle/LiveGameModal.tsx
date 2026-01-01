// src/components/battle/LiveGameListModal.tsx
import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { X, Eye, Swords, Clock, User } from 'lucide-react';
import { LiveMatch } from '../../types';

interface Props {
  onClose: () => void;
  onSpectate: (match: LiveMatch) => void;
}

export const LiveGameListModal: React.FC<Props> = ({ onClose, onSpectate }) => {
  const { gameState, heroes } = useGameStore();
  const matches = gameState.liveMatches;

  // 현재 선택된 게임 (기본값: 첫 번째 게임)
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);

  // 데이터가 로드되면 첫 번째 게임 자동 선택
  useEffect(() => {
    if (matches.length > 0 && !selectedMatchId) {
      setSelectedMatchId(matches[0].id);
    }
  }, [matches]);

  // 선택된 매치 데이터 찾기
  const selectedMatch = matches.find(m => m.id === selectedMatchId) || matches[0];

  const getHeroName = (id: string) => heroes.find(h => h.id === id)?.name || '?';

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9000,
      backdropFilter: 'blur(5px)'
    }}>
      <div className="panel" style={{ width: '1000px', height: '80vh', background: '#1c1c1f', border: '1px solid #30363d', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 50px rgba(0,0,0,0.8)', overflow: 'hidden' }}>
        
        {/* 1. 헤더 */}
        <div style={{ padding: '15px 20px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background:'#252528' }}>
          <h3 style={{ margin: 0, color:'#fff', display:'flex', alignItems:'center', gap:'10px' }}>
            <Swords size={20} /> 실시간 진행 중인 게임 ({matches.length})
          </h3>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#fff', cursor:'pointer' }}><X size={24}/></button>
        </div>

        {/* 2. 메인 컨텐츠 (좌우 분할) */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          
          {/* [좌측] 게임 목록 리스트 */}
          <div style={{ width: '300px', borderRight: '1px solid #333', overflowY: 'auto', background: '#161b22' }}>
            {matches.map((match) => (
              <div 
                key={match.id}
                onClick={() => setSelectedMatchId(match.id)}
                style={{ 
                  padding: '15px', borderBottom: '1px solid #2c2c2f', cursor: 'pointer',
                  background: selectedMatchId === match.id ? '#2a2a2e' : 'transparent',
                  borderLeft: selectedMatchId === match.id ? '4px solid #58a6ff' : '4px solid transparent'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '12px', color: '#888' }}>
                  <span>{match.avgTier} 평균</span>
                  <span style={{ display:'flex', alignItems:'center', gap:'4px' }}><Clock size={10}/> {Math.floor(match.currentDuration)}분</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 'bold' }}>
                  <span style={{ color: '#58a6ff', fontSize: '16px' }}>{match.score.blue}</span>
                  <span style={{ color: '#555', fontSize: '12px' }}>VS</span>
                  <span style={{ color: '#e84057', fontSize: '16px' }}>{match.score.red}</span>
                </div>
              </div>
            ))}
          </div>

          {/* [우측] 상세 상황판 & 관전 버튼 */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#0d1117' }}>
            
            {selectedMatch ? (
              <>
                {/* 상단 스코어보드 */}
                <div style={{ padding: '30px', textAlign: 'center', borderBottom: '1px solid #333', background: '#121212' }}>
                  <div style={{ fontSize: '14px', color: '#888', marginBottom: '10px' }}>경기 시간 {Math.floor(selectedMatch.currentDuration)}:00</div>
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '40px' }}>
                    <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#58a6ff' }}>{selectedMatch.score.blue}</div>
                    <div style={{ fontSize: '20px', color: '#555', fontWeight: 'bold' }}>VS</div>
                    <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#e84057' }}>{selectedMatch.score.red}</div>
                  </div>
                  
                  {/* [핵심] 관전 버튼 */}
                  <button 
                    onClick={() => onSpectate(selectedMatch)}
                    style={{ 
                      marginTop: '20px', padding: '12px 40px', borderRadius: '8px', 
                      background: '#238636', color: '#fff', border: 'none', 
                      fontSize: '16px', fontWeight: 'bold', cursor: 'pointer',
                      display: 'inline-flex', alignItems: 'center', gap: '8px',
                      boxShadow: '0 4px 15px rgba(35, 134, 54, 0.4)'
                    }}
                  >
                    <Eye size={20} /> 실시간 관전 입장
                  </button>
                </div>

                {/* 플레이어 명단 (블루팀 vs 레드팀) */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  
                  {/* 블루팀 */}
                  <div>
                    <h4 style={{ color: '#58a6ff', margin: '0 0 15px 0', borderBottom: '2px solid #58a6ff', paddingBottom: '5px' }}>BLUE TEAM</h4>
                    {selectedMatch.blueTeam.map((p, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', marginBottom: '5px', background: '#1c1c1f', borderRadius: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '30px', height: '30px', background: '#333', borderRadius: '50%', display:'flex', alignItems:'center', justifyContent:'center', border:'1px solid #58a6ff' }}>🧙‍♂️</div>
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff' }}>{getHeroName(p.heroId)}</div>
                            <div style={{ fontSize: '11px', color: '#888' }}>{p.name}</div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#ccc' }}>{p.kills}/{p.deaths}/{p.assists}</div>
                          <div style={{ fontSize: '11px', color: '#e89d40' }}>{p.gold.toLocaleString()} G</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* 레드팀 */}
                  <div>
                    <h4 style={{ color: '#e84057', margin: '0 0 15px 0', borderBottom: '2px solid #e84057', paddingBottom: '5px', textAlign: 'right' }}>RED TEAM</h4>
                    {selectedMatch.redTeam.map((p, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', marginBottom: '5px', background: '#1c1c1f', borderRadius: '4px', flexDirection: 'row-reverse' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexDirection: 'row-reverse' }}>
                          <div style={{ width: '30px', height: '30px', background: '#333', borderRadius: '50%', display:'flex', alignItems:'center', justifyContent:'center', border:'1px solid #e84057' }}>🧙‍♂️</div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff' }}>{getHeroName(p.heroId)}</div>
                            <div style={{ fontSize: '11px', color: '#888' }}>{p.name}</div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#ccc' }}>{p.kills}/{p.deaths}/{p.assists}</div>
                          <div style={{ fontSize: '11px', color: '#e89d40' }}>{p.gold.toLocaleString()} G</div>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#666' }}>
                진행 중인 게임을 선택하세요.
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};