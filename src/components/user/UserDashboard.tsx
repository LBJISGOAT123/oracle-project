import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { UserProfile } from '../../types';
import { Clock, Settings, ChevronRight } from 'lucide-react';
import { TierSettingsModal } from './TierSettingsModal';
import { TierUserListModal } from './TierUserListModal';

interface Props { onUserClick: (u: UserProfile) => void; }

export const UserDashboard: React.FC<Props> = ({ onUserClick }) => {
  const { gameState, heroes } = useGameStore();
  const { userStatus, topRankers } = gameState;
  const [showSettings, setShowSettings] = useState(false);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getHeroName = (id: string) => {
    const hero = heroes.find(h => h.id === id);
    return hero ? hero.name : id;
  };

  if (!userStatus) return <div>데이터 로딩 중...</div>;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '20px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="panel">
          <h3 style={{ margin: '0 0 15px 0', borderBottom: '1px solid #333', paddingBottom: '10px', fontSize:'16px' }}>📡 실시간 매칭 현황</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ textAlign: 'center', flex: 1, borderRight: '1px solid #333' }}>
              <div style={{ fontSize: '12px', color: '#8b949e' }}>게임 중 (Ingame)</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3fb950' }}>{userStatus.playingUsers.toLocaleString()}</div>
            </div>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ fontSize: '12px', color: '#8b949e' }}>매칭 대기 (Queue)</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#d29922' }}>{userStatus.queuingUsers.toLocaleString()}</div>
            </div>
          </div>
          <div style={{ background: '#0d1117', padding: '15px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
            <Clock size={16} color="#58a6ff" />
            <span style={{ color: '#8b949e', fontSize: '13px' }}>평균 매칭 시간:</span>
            <span style={{ fontWeight: 'bold', color: '#fff' }}>{userStatus.avgWaitTime}초</span>
          </div>
        </div>

        <div className="panel">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom: '1px solid #333', paddingBottom: '10px', marginBottom: '15px' }}>
            <h3 style={{ margin: 0, fontSize:'16px' }}>🏆 티어별 인구 분포</h3>
            <button onClick={() => setShowSettings(true)} style={{ background:'none', border:'none', color:'#8b949e', cursor:'pointer', display:'flex', alignItems:'center', gap:'5px', fontSize:'12px' }}>
              <Settings size={14}/> 설정
            </button>
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
            {userStatus.tierDistribution.map((tier) => (
              <div key={tier.name} onClick={() => setSelectedTier(tier.name)} style={{ cursor:'pointer', padding:'8px', borderRadius:'6px', background:'#0d1117', transition:'0.2s', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'10px', width: isMobile ? '80px' : '120px' }}>
                  <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:tier.color }}></div>
                  <span style={{ fontWeight:'bold', color:tier.color, fontSize:'13px' }}>{tier.name}</span>
                </div>
                <div style={{ flex:1, height:'6px', background:'#333', borderRadius:'3px', margin:'0 15px' }}>
                  <div style={{ width:`${tier.percent}%`, height:'100%', background:tier.color, borderRadius:'3px', minWidth:'2px' }}></div>
                </div>
                <div style={{ textAlign:'right', width: isMobile ? '80px' : '100px' }}>
                  <span style={{ fontWeight:'bold', display:'block', fontSize:'13px' }}>{tier.count.toLocaleString()}</span>
                  <span style={{ fontSize:'10px', color:'#666' }}>{tier.percent.toFixed(1)}%</span>
                </div>
                {!isMobile && <ChevronRight size={14} color="#555" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="panel">
        <h3 style={{ margin: '0 0 15px 0', borderBottom: '1px solid #333', paddingBottom: '10px', display: 'flex', justifyContent: 'space-between', fontSize:'16px' }}>
          <span>🥇 상위 랭커 (Top 50)</span>
          <span style={{ fontSize: '12px', color: '#8b949e' }}>실시간</span>
        </h3>

        <div style={{ height: '600px', overflowY: 'auto' }}>
          {isMobile ? (
            <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
              {topRankers.map((user, idx) => (
                <div key={user.id} onClick={() => onUserClick(user)} style={{ background:'#0d1117', padding:'10px', borderRadius:'6px', border:'1px solid #333', display:'flex', alignItems:'center', gap:'10px' }}>
                  <div style={{ fontSize:'16px', fontWeight:'bold', color: idx < 3 ? '#e74c3c' : '#777', width:'24px', textAlign:'center' }}>{idx + 1}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:'bold', color:'#fff', fontSize:'14px' }}>{user.name}</div>
                    <div style={{ fontSize:'12px', color:'#888' }}>
                      <span style={{ color: user.tier === '천상계' ? '#00bfff' : '#fff' }}>{user.tier}</span> ({user.score}LP)
                    </div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:'12px', color:'#ddd', fontWeight:'bold' }}>{getHeroName(user.mainHeroId)}</div>
                    <div style={{ fontSize:'12px', color: user.winRate > 55 ? '#3fb950' : '#8b949e' }}>{user.winRate.toFixed(1)}%</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead style={{ position: 'sticky', top: 0, background: '#161b22' }}>
                <tr style={{ color: '#8b949e', borderBottom: '1px solid #333', textAlign: 'left' }}>
                  <th style={{ padding: '8px', textAlign: 'center' }}>#</th>
                  <th>소환사명</th>
                  <th>티어 (LP)</th>
                  <th>모스트</th>
                  <th>승률</th>
                  <th>최근 5전</th>
                </tr>
              </thead>
              <tbody>
                {topRankers.map((user, idx) => (
                  <tr key={user.id} style={{ borderBottom: '1px solid #222', height: '40px', cursor:'pointer' }} onClick={() => onUserClick(user)}>
                    <td style={{ textAlign: 'center', fontWeight: 'bold', color: idx < 3 ? '#e74c3c' : '#fff' }}>{idx + 1}</td>
                    <td style={{ fontWeight: 'bold', color: '#fff' }}>{user.name}</td>
                    <td>
                      <span style={{ color: user.tier === '천상계' ? '#00bfff' : user.tier === '마스터' ? '#9b59b6' : '#fff' }}>{user.tier}</span>
                      <span style={{ fontSize: '11px', color: '#777', marginLeft: '4px' }}>({user.score}LP)</span>
                    </td>
                    <td style={{ color: '#ddd', fontWeight:'bold' }}>{getHeroName(user.mainHeroId)}</td>
                    <td style={{ color: user.winRate > 55 ? '#3fb950' : '#8b949e' }}>{user.winRate.toFixed(1)}%</td>
                    <td>
                      <div style={{ display: 'flex', gap: '2px' }}>
                        {user.history.slice(0, 5).map((h, i) => (
                          <div key={i} style={{ width: '16px', height: '16px', borderRadius: '2px', background: h.result === 'WIN' ? '#3fb950' : '#da3633', fontSize: '10px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {h.result === 'WIN' ? 'W' : 'L'}
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      {showSettings && <TierSettingsModal onClose={() => setShowSettings(false)} />}
      {selectedTier && <TierUserListModal tierName={selectedTier} onClose={() => setSelectedTier(null)} onUserClick={(u) => { onUserClick(u); setSelectedTier(null); }} />}
    </div>
  );
};
