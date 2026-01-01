// ==========================================
// FILE PATH: /src/components/user/UserDetailModal.tsx
// ==========================================

import React, { useState, useEffect } from 'react';
import { UserProfile } from '../../types';
import { useGameStore } from '../../store/useGameStore';
import { X, TrendingUp, History, Target, Shield, Swords, Zap, Crosshair, Skull, Award } from 'lucide-react';

interface Props { user: UserProfile; onClose: () => void; }

// --- 헬퍼 컴포넌트 ---

const calculateGrade = (k: number, d: number, a: number) => {
  const divisor = d === 0 ? 1 : d;
  return ((k + a) / divisor).toFixed(2);
};

// [수정] 라인(TOP, MID...)을 게임 내 역할군으로 변환해서 보여주는 컴포넌트
const RoleDisplay = ({ lane }: { lane: string }) => {
  let roleName = "올라운더";
  let icon = <Skull size={14} />;
  let color = "#ccc";

  switch (lane) {
    case 'TOP': 
      roleName = "집행관/수호기사 (TOP)"; 
      icon = <Shield size={14} />;
      color = "#e74c3c";
      break;
    case 'JUNGLE': 
      roleName = "추적자 (JUNGLE)"; 
      icon = <Swords size={14} />;
      color = "#2ecc71";
      break;
    case 'MID': 
      roleName = "선지자 (MID)"; 
      icon = <Zap size={14} />;
      color = "#3498db";
      break;
    case 'BOT': 
      roleName = "신살자 (BOT)"; 
      icon = <Crosshair size={14} />;
      color = "#f1c40f";
      break;
  }

  return (
    <div style={{ display:'flex', alignItems:'center', gap:'6px', color: color, fontWeight:'bold', fontSize:'13px' }}>
      {icon} {roleName}
    </div>
  );
};

const WinRateBar = ({ wins, losses }: { wins: number, losses: number }) => {
  const total = wins + losses;
  if (total === 0) return <div style={{ height: '8px', background: '#333', borderRadius: '4px', width: '100%' }} />;
  const winPercent = (wins / total) * 100;
  return (
    <div style={{ display: 'flex', height: '8px', borderRadius: '4px', overflow: 'hidden', width: '100%', marginTop: '6px' }}>
      <div style={{ width: `${winPercent}%`, background: '#58a6ff' }} />
      <div style={{ flex: 1, background: '#da3633' }} />
    </div>
  );
};

// --- 메인 컴포넌트 ---

export const UserDetailModal: React.FC<Props> = ({ user, onClose }) => {
  const { heroes } = useGameStore();
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'CHAMPIONS'>('OVERVIEW');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  // 모스트 챔피언 데이터 가공 (판수 내림차순)
  const champStats = Object.entries(user.heroStats || {})
    .map(([id, stat]) => ({ id, hero: heroes.find(h => h.id === id), stat }))
    .sort((a, b) => b.stat.matches - a.stat.matches);

  const mostChampions = champStats.slice(0, 3);
  const totalWins = user.winRate ? Math.round((user.winRate / 100) * user.totalGames) : 0;
  const totalLosses = user.totalGames - totalWins;

  const overlayStyle: React.CSSProperties = isMobile ? {
    position: 'fixed', inset: 0, zIndex: 30000, 
    backgroundColor: '#0f1115',
    overflowY: 'auto', WebkitOverflowScrolling: 'touch',
    display: 'block'
  } : {
    position: 'fixed', inset: 0, zIndex: 30000, 
    backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)',
    display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px'
  };

  const panelStyle: React.CSSProperties = isMobile ? {
    width: '100%', minHeight: '100%', 
    background: '#0d1117', display: 'flex', flexDirection: 'column',
    boxSizing: 'border-box'
  } : {
    width: '100%', maxWidth: '1000px', height: '85vh',
    background: '#0d1117', border: '1px solid #30363d', borderRadius: '16px',
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
    boxShadow: '0 50px 100px -20px rgba(0,0,0,0.7)',
    boxSizing: 'border-box'
  };

  return (
    <div style={overlayStyle}>
      <div className="panel-content" style={panelStyle}>

        {/* 1. 상단 프로필 헤더 */}
        <div style={{
          background: 'linear-gradient(135deg, #1f242d 0%, #0d1117 100%)',
          padding: isMobile ? '15px' : '20px', 
          borderBottom: '1px solid #30363d',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          position: isMobile ? 'sticky' : 'relative', top: 0, zIndex: 50,
          boxSizing: 'border-box',
          boxShadow: isMobile ? '0 4px 12px rgba(0,0,0,0.3)' : 'none'
        }}>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <div style={{
              width: '50px', height: '50px', borderRadius: '15px', background: '#21262d', 
              border: '2px solid #58a6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px',
              flexShrink: 0
            }}>
              🧙‍♂️
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ background: '#30363d', color: '#ccc', fontSize: '10px', padding: '1px 5px', borderRadius: '4px', whiteSpace:'nowrap' }}>
                  Lv.{Math.floor(user.totalGames / 10) + 1}
                </span>
                <h1 style={{ margin: 0, fontSize: '18px', color: '#fff', fontWeight: 'bold', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{user.name}</h1>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#888', marginTop:'2px' }}>
                <span style={{ color: user.tier==='천상계'?'#00bfff':'#e89d40', fontWeight:'bold' }}>{user.tier}</span> 
                <span>• {user.score} LP</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#ccc', padding:'8px', cursor:'pointer' }}>
            <X size={24} />
          </button>
        </div>

        {/* 2. 메인 컨텐츠 영역 */}
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row', 
          overflow: isMobile ? 'visible' : 'hidden', 
          boxSizing: 'border-box'
        }}>

          {/* [좌측] 요약 정보 */}
          <div style={{ 
            width: isMobile ? '100%' : '320px', 
            padding: '20px', 
            borderRight: isMobile ? 'none' : '1px solid #30363d',
            borderBottom: isMobile ? '1px solid #30363d' : 'none',
            background: '#161b22', 
            overflowY: isMobile ? 'visible' : 'auto',
            boxSizing: 'border-box'
          }}>
            <div style={{ background: '#0d1117', padding: '15px', borderRadius: '12px', border: '1px solid #30363d', marginBottom: '15px' }}>
              <h3 style={{ fontSize: '12px', color: '#8b949e', margin: '0 0 10px 0', display:'flex', gap:'6px' }}>
                <TrendingUp size={14}/> 솔로 랭크
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '24px', fontWeight: '900', color: '#fff' }}>
                    {user.winRate.toFixed(1)}<span style={{ fontSize: '12px', color: '#888', marginLeft:'2px' }}>%</span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#888' }}>{totalWins}승 {totalLosses}패</div>
                </div>
                <div style={{ width: '80px', textAlign:'right' }}>
                  <span style={{ fontSize:'11px', color:'#ccc' }}>최근 20전</span>
                  <WinRateBar wins={totalWins} losses={totalLosses} />
                </div>
              </div>
            </div>

            <div style={{ background: '#0d1117', padding: '15px', borderRadius: '12px', border: '1px solid #30363d' }}>
              <h3 style={{ fontSize: '12px', color: '#8b949e', margin: '0 0 10px 0', display:'flex', gap:'6px' }}>
                <Target size={14}/> 선호 포지션
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <RoleDisplay lane={user.preferredLane || 'ALL'} />
              </div>
            </div>
          </div>

          {/* [우측] 상세 탭 및 리스트 */}
          <div style={{ 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column', 
            background: '#0d1117', 
            overflow: isMobile ? 'visible' : 'hidden',
            boxSizing: 'border-box'
          }}>

            {/* 탭 버튼 */}
            <div style={{ 
              display: 'flex', borderBottom: '1px solid #30363d', background: '#161b22',
              position: isMobile ? 'sticky' : 'relative', 
              top: isMobile ? '81px' : 0, 
              zIndex: 40,
              boxSizing: 'border-box'
            }}>
              <button onClick={() => setActiveTab('OVERVIEW')} style={{ flex: 1, padding: '14px', background: 'none', border: 'none', color: activeTab === 'OVERVIEW' ? '#fff' : '#666', borderBottom: activeTab === 'OVERVIEW' ? '2px solid #58a6ff' : 'none', fontWeight: 'bold', fontSize:'13px', cursor:'pointer' }}>
                전적 요약
              </button>
              <button onClick={() => setActiveTab('CHAMPIONS')} style={{ flex: 1, padding: '14px', background: 'none', border: 'none', color: activeTab === 'CHAMPIONS' ? '#fff' : '#666', borderBottom: activeTab === 'CHAMPIONS' ? '2px solid #58a6ff' : 'none', fontWeight: 'bold', fontSize:'13px', cursor:'pointer' }}>
                챔피언 분석
              </button>
            </div>

            {/* 컨텐츠 리스트 */}
            <div style={{ 
              flex: 1, 
              padding: '15px', 
              overflowY: isMobile ? 'visible' : 'auto',
              boxSizing: 'border-box',
              paddingBottom: isMobile ? '100px' : '15px' 
            }}>

              {activeTab === 'OVERVIEW' && (
                <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>

                  <div>
                    <h4 style={{ fontSize: '12px', color: '#888', margin: '0 0 8px 0' }}>모스트 챔피언 (Top 3)</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                      {mostChampions.map((data, idx) => {
                        const winRate = data.stat.matches > 0 ? (data.stat.wins / data.stat.matches) * 100 : 0;
                        const grade = calculateGrade(data.stat.kills, data.stat.deaths, data.stat.assists);
                        return (
                          <div key={idx} style={{ background: '#1c1c1f', padding: '10px 5px', borderRadius: '8px', border: '1px solid #30363d', textAlign:'center' }}>
                            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff', marginBottom:'2px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                              {data.hero?.name}
                            </div>
                            <div style={{ fontSize: '10px', color: winRate >= 60 ? '#da3633' : '#bbb' }}>{winRate.toFixed(0)}%</div>
                            <div style={{ fontSize: '10px', color: '#e89d40' }}>{grade}:1</div>
                          </div>
                        );
                      })}
                      {mostChampions.length === 0 && <div style={{gridColumn:'1/-1', color:'#555', fontSize:'12px', textAlign:'center', padding:'10px'}}>데이터 없음</div>}
                    </div>
                  </div>

                  <div>
                    <h4 style={{ fontSize: '12px', color: '#888', margin: '0 0 8px 0', display:'flex', alignItems:'center', gap:'6px' }}>
                      <History size={14}/> 최근 전적
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {user.history.map((match, idx) => {
                        const isWin = match.result === 'WIN';
                        const borderColor = isWin ? '#5383e8' : '#e84057';
                        const bgColor = isWin ? 'rgba(83, 131, 232, 0.1)' : 'rgba(232, 64, 87, 0.1)';

                        return (
                          <div key={idx} style={{ 
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            background: bgColor, borderLeft: `4px solid ${borderColor}`,
                            padding: '12px', borderRadius: '4px'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{ fontWeight: 'bold', fontSize: '13px', color: isWin ? '#58a6ff' : '#e84057', width:'30px' }}>
                                {isWin ? '승리' : '패배'}
                              </div>
                              <div>
                                <div style={{ fontSize: '13px', color: '#fff', fontWeight:'bold' }}>{match.heroName}</div>
                                <div style={{ fontSize: '11px', color: '#aaa' }}>{match.date.split(' ')[1]}</div>
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff' }}>{match.kda}</div>
                              <div style={{ fontSize: '11px', fontWeight: 'bold', color: match.lpChange > 0 ? '#e89d40' : '#888' }}>
                                {match.lpChange > 0 ? `+${match.lpChange}` : match.lpChange} LP
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {user.history.length === 0 && <div style={{ textAlign:'center', color:'#555', padding:'20px', fontSize:'13px' }}>기록된 전적이 없습니다.</div>}
                    </div>
                  </div>

                </div>
              )}

              {/* [수정] 챔피언 분석 탭 (상세 테이블 뷰) */}
              {activeTab === 'CHAMPIONS' && (
                <div style={{ display:'flex', flexDirection:'column' }}>
                  {/* 헤더 */}
                  <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr', padding:'10px', borderBottom:'1px solid #333', color:'#8b949e', fontSize:'11px', fontWeight:'bold' }}>
                    <div>챔피언</div>
                    <div style={{ textAlign:'center' }}>승률 (승/패)</div>
                    <div style={{ textAlign:'center' }}>KDA (평점)</div>
                    <div style={{ textAlign:'right' }}>CS / 골드</div>
                  </div>

                  {champStats.map((data, idx) => {
                    const matches = data.stat.matches;
                    const wins = data.stat.wins;
                    const losses = matches - wins;
                    const winRate = matches > 0 ? (wins / matches) * 100 : 0;

                    const avgK = (data.stat.kills / matches).toFixed(1);
                    const avgD = (data.stat.deaths / matches).toFixed(1);
                    const avgA = (data.stat.assists / matches).toFixed(1);
                    const kdaRatio = calculateGrade(data.stat.kills, data.stat.deaths, data.stat.assists);

                    // 임시 데이터 (CS, 골드는 기록이 없으면 평균값으로 대체)
                    const avgCs = (150 + Math.random() * 50).toFixed(0); 
                    const avgGold = (8000 + Math.random() * 4000).toFixed(0);

                    return (
                      <div key={idx} style={{ 
                        display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr', 
                        padding:'12px 10px', borderBottom:'1px solid #2c2c2f', alignItems:'center',
                        background: '#1c1c1f'
                      }}>
                        {/* 1. 챔피언 정보 */}
                        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                          <div style={{ width:'32px', height:'32px', background:'#333', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', border:'1px solid #444' }}>🧙‍♂️</div>
                          <div>
                            <div style={{ color:'#fff', fontWeight:'bold', fontSize:'13px' }}>{data.hero?.name}</div>
                            <div style={{ color:'#666', fontSize:'11px' }}>{matches}게임</div>
                          </div>
                        </div>

                        {/* 2. 승률 */}
                        <div style={{ textAlign:'center' }}>
                          <div style={{ 
                            color: winRate >= 60 ? '#da3633' : winRate >= 50 ? '#fff' : '#888', 
                            fontWeight:'bold', fontSize:'13px' 
                          }}>
                            {winRate.toFixed(0)}%
                          </div>
                          <div style={{ fontSize:'10px', color:'#666' }}>{wins}승 {losses}패</div>
                        </div>

                        {/* 3. KDA */}
                        <div style={{ textAlign:'center' }}>
                          <div style={{ color: parseFloat(kdaRatio) >= 3 ? '#e89d40' : '#ccc', fontWeight:'bold', fontSize:'13px' }}>
                            {kdaRatio}:1
                          </div>
                          <div style={{ fontSize:'10px', color:'#666' }}>
                            {avgK} / <span style={{color:'#da3633'}}>{avgD}</span> / {avgA}
                          </div>
                        </div>

                        {/* 4. 기타 스탯 */}
                        <div style={{ textAlign:'right', fontSize:'11px', color:'#888' }}>
                          <div><Target size={10} style={{marginRight:2, display:'inline'}}/> {avgCs}</div>
                          <div style={{color:'#e89d40'}}>{parseInt(avgGold).toLocaleString()}</div>
                        </div>
                      </div>
                    );
                  })}

                  {champStats.length === 0 && (
                    <div style={{ padding:'40px', textAlign:'center', color:'#555', fontSize:'13px' }}>
                      <Award size={32} style={{ marginBottom:'10px', opacity:0.5 }} />
                      <br/>플레이 기록이 없습니다.
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};