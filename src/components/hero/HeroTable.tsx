// ==========================================
// FILE PATH: /src/components/hero/HeroTable.tsx
// ==========================================

import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { Hero } from '../../types';
import { 
  Swords, Shield, Zap, Crosshair, Skull, 
  Target, Coins, Trophy, Activity, AlertCircle 
} from 'lucide-react';

interface Props { onHeroClick: (hero: Hero) => void; }

// --- Helper Functions & Components ---

const RoleIcon = ({ role, size = 14, color = "#ccc" }: { role: string, size?: number, color?: string }) => {
  switch(role) {
    case '집행관': return <Swords size={size} color={color} />;
    case '수호기사': return <Shield size={size} color={color} />;
    case '선지자': return <Zap size={size} color={color} />;
    case '신살자': return <Crosshair size={size} color={color} />;
    case '추적자': return <Skull size={size} color={color} />;
    default: return <span>?</span>;
  }
};

const formatNumber = (numStr: string | number) => {
  if (!numStr) return '0';
  const num = typeof numStr === 'string' ? parseInt(numStr.replace(/,/g, '')) : numStr;
  if (isNaN(num)) return '0';
  return num.toLocaleString();
};

const getTierBg = (tier: string) => tier === 'OP' ? '#5383e8' : 'transparent';
const getTierBorder = (tier: string) => {
  if (tier === 'OP') return '#5383e8';
  if (tier === '1') return '#e84057';
  if (tier === '2') return '#e89d40';
  if (tier === '3') return '#59c7ba';
  return '#555';
};
const getTierColor = (tier: string) => {
  if (tier === 'OP') return '#5383e8';
  if (tier === '1') return '#e84057';
  if (tier === '2') return '#e89d40';
  if (tier === '3') return '#59c7ba';
  return '#888';
};
const getWinRateColor = (rate: number) => rate >= 52 ? '#5383e8' : rate <= 48 ? '#e84057' : '#fff';


// --- Main Component ---

export const HeroTable: React.FC<Props> = ({ onHeroClick }) => {
  const { heroes } = useGameStore();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!heroes || heroes.length === 0) {
    return (
      <div style={{ padding:'40px', textAlign:'center', color:'#666', background:'#1c1c1f', borderRadius:'8px' }}>
        <Activity size={32} style={{ marginBottom:'10px', opacity:0.5 }}/>
        <br/>데이터를 분석 중입니다...
      </div>
    );
  }

  // =========================================================
  // [Mobile View] 카드 리스트 형태
  // =========================================================
  if (isMobile) {
    return (
      <div style={{ paddingBottom: '20px' }}>
        {heroes.map((hero) => (
          <div 
            key={hero.id}
            onClick={() => onHeroClick(hero)}
            style={{
              background: '#1c1c1f',
              border: '1px solid #333',
              borderRadius: '12px',
              padding: '15px',
              marginBottom: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
            }}
          >
            {/* 상단: 랭크 + 기본정보 + 티어 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ 
                  width: '36px', height: '36px', background: '#252528', borderRadius: '8px', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '1px solid #444', fontWeight: 'bold', color: '#fff'
                }}>
                  {hero.rank}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '16px', color: '#fff' }}>{hero.name}</span>
                    <span style={{ fontSize: '12px', color: '#888' }}>{hero.role}</span>
                  </div>
                  <div style={{ display:'flex', gap:'5px', fontSize:'11px', color:'#666', marginTop:'2px' }}>
                    <RoleIcon role={hero.role} size={12} color="#666" />
                    <span>{hero.skills?.passive?.name || '기본 공격'}</span>
                  </div>
                </div>
              </div>

              <div style={{ 
                padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '800',
                background: getTierBg(hero.tier), 
                color: hero.tier === 'OP' ? '#fff' : getTierColor(hero.tier),
                border: `1px solid ${getTierBorder(hero.tier)}`
              }}>
                {hero.tier} 티어
              </div>
            </div>

            {/* 하단: 주요 스탯 Grid */}
            <div style={{ 
              display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', 
              background: '#121212', borderRadius: '8px', padding: '10px', gap: '5px'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: '#666' }}>승률</div>
                <div style={{ fontWeight: 'bold', color: getWinRateColor(hero.recentWinRate || 0) }}>
                  {(hero.recentWinRate || 0).toFixed(1)}%
                </div>
              </div>
              <div style={{ textAlign: 'center', borderLeft: '1px solid #333', borderRight: '1px solid #333' }}>
                <div style={{ fontSize: '11px', color: '#666' }}>픽률</div>
                <div style={{ fontWeight: 'bold', color: '#fff' }}>
                  {(hero.pickRate || 0).toFixed(1)}%
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: '#666' }}>KDA</div>
                <div style={{ fontWeight: 'bold', color: parseFloat(hero.kdaRatio) >= 4 ? '#5383e8' : '#ccc' }}>
                  {hero.kdaRatio}
                </div>
              </div>
            </div>

          </div>
        ))}
      </div>
    );
  }

  // =========================================================
  // [Desktop View] 기존 테이블 형태
  // =========================================================
  return (
    <div className="panel" style={{ overflowX: 'auto', background: '#1c1c1f', border: '1px solid #2c2c2f', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
      <h3 style={{ margin: '0', padding: '15px 20px', fontSize: '15px', color: '#fff', borderLeft: '4px solid #5383e8', background: '#252528', borderBottom: '1px solid #2c2c2f' }}>
        📊 챔피언 분석 (Ranked Statistics)
      </h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', whiteSpace: 'nowrap' }}>
        <thead>
          <tr style={{ color: '#9aa4af', borderBottom: '1px solid #2c2c2f', textAlign: 'right', height: '45px', background: '#1c1c1f' }}>
            <th style={{ width: '60px', textAlign: 'center' }}>순위</th>
            <th style={{ textAlign: 'left', paddingLeft: '20px' }}>챔피언</th>
            <th style={{ width: '100px' }}>승률</th>
            <th style={{ width: '140px' }}>픽률 / 밴률</th>
            <th style={{ width: '200px' }}>KDA (평점)</th>
            <th style={{ width: '160px' }}>CS / 골드</th>
            <th style={{ width: '180px', paddingRight: '20px' }}>가한 피해 / 받은 피해</th>
          </tr>
        </thead>
        <tbody>
          {heroes.map((hero) => (
            <tr 
              key={hero.id} 
              onClick={() => onHeroClick(hero)}
              style={{ borderBottom: '1px solid #2c2c2f', cursor: 'pointer', height: '50px', transition: 'background 0.1s' }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#2a2a2e'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <td style={{ textAlign: 'center', color: '#777' }}>
                <span style={{ fontSize: '14px', color: '#fff', fontWeight: 'bold', marginRight: '4px' }}>{hero.rank || '-'}</span>
              </td>

              <td style={{ textAlign: 'left', paddingLeft: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '32px', height: '32px', background: '#333', borderRadius: '6px', display:'flex', alignItems:'center', justifyContent:'center', border: '1px solid #444' }}>
                     <RoleIcon role={hero.role} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '14px', color: '#eee' }}>{hero.name}</span>
                    <span style={{ fontSize: '12px', color: '#666' }}>{hero.role}</span>
                    <span style={{ 
                      marginLeft: '6px', padding: '1px 6px', borderRadius: '3px', fontWeight: '800', fontSize: '10px',
                      background: getTierBg(hero.tier), color: '#fff', border: `1px solid ${getTierBorder(hero.tier)}`
                    }}>
                      {hero.tier || 'unranked'}
                    </span>
                  </div>
                </div>
              </td>

              <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                <span style={{ color: getWinRateColor(hero.recentWinRate || 0) }}>
                  {(hero.recentWinRate || 0).toFixed(2)}%
                </span>
              </td>

              <td style={{ textAlign: 'right' }}>
                <span style={{ color: '#ccc' }}>{(hero.pickRate || 0).toFixed(1)}%</span>
                <span style={{ color: '#555', margin: '0 6px' }}>/</span>
                <span style={{ color: '#e84057', fontSize: '12px' }}>{(hero.banRate || 0).toFixed(1)}%</span>
              </td>

              <td style={{ textAlign: 'right' }}>
                <span style={{ color: '#8b949e', fontSize: '12px', marginRight: '8px' }}>({hero.avgKda || '0/0/0'})</span>
                <span style={{ fontWeight: 'bold', color: parseFloat(hero.kdaRatio || '0') >= 4 ? '#5383e8' : '#fff' }}>
                  {hero.kdaRatio || '0.00'}:1
                </span>
              </td>

              <td style={{ textAlign: 'right' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '15px' }}>
                  <span style={{ color: '#aaa', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Target size={12}/> {hero.avgCs || 0}
                  </span>
                  <span style={{ color: '#e89d40', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Coins size={12}/> {formatNumber(hero.avgGold || '0')}
                  </span>
                </div>
              </td>

              <td style={{ textAlign: 'right', paddingRight: '20px' }}>
                <span style={{ color: '#e84057' }}>{formatNumber(hero.avgDpm || '0')}</span>
                <span style={{ color: '#555', margin: '0 6px' }}>/</span>
                <span style={{ color: '#8b949e' }}>{formatNumber(hero.avgDpg || '0')}</span>
              </td>

            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};