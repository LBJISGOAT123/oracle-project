// ==========================================
// FILE PATH: /src/components/hero/HeroListTable.tsx
// ==========================================

import React from 'react';
import { Hero, Tier } from '../../types';
import { Target, Swords, Coins, Skull, Shield } from 'lucide-react'; 
import { GameIcon } from '../common/GameIcon';

interface Props {
  heroes: Hero[];
  isMobile?: boolean;
  onHeroClick?: (hero: Hero) => void;
}

export const HeroListTable: React.FC<Props> = ({ heroes, isMobile = false, onHeroClick }) => {
  const sortedHeroes = [...heroes].sort((a, b) => (a.rank || 999) - (b.rank || 999));

  // [UI 헬퍼] 승률 색상
  const getWinRateColor = (rate: number) => {
    if (rate >= 52) return '#ff4d4d'; // OP (Red)
    if (rate >= 50) return '#3fb950'; // Good (Green)
    return '#8b949e'; // Normal (Gray)
  };

  // [UI 헬퍼] 티어별 고유 색상 및 스타일 반환
  const getTierStyle = (tier: Tier) => {
    switch (tier) {
      case 'OP': return { color: '#ff4d4d', border: '#ff4d4d', bg: 'rgba(255, 77, 77, 0.15)' }; // 빨강
      case '1': return { color: '#e89d40', border: '#e89d40', bg: 'rgba(232, 157, 64, 0.15)' }; // 주황/골드
      case '2': return { color: '#58a6ff', border: '#58a6ff', bg: 'rgba(88, 166, 255, 0.15)' }; // 파랑
      case '3': return { color: '#2ecc71', border: '#2ecc71', bg: 'rgba(46, 204, 113, 0.15)' }; // 초록
      case '4': return { color: '#95a5a6', border: '#95a5a6', bg: 'rgba(149, 165, 166, 0.15)' }; // 회색
      case '5': return { color: '#7f8c8d', border: '#7f8c8d', bg: 'rgba(127, 140, 141, 0.15)' }; // 똥색
      default: return { color: '#8b949e', border: '#30363d', bg: '#21262d' };
    }
  };

  // [모바일] 카드형 리스트 뷰
  if (isMobile) {
    return (
      <div style={{ overflowY: 'auto', flex: 1, padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px', paddingBottom: '80px', scrollbarWidth:'none' }}>
        {sortedHeroes.map((hero) => {
          const tierStyle = getTierStyle(hero.tier);

          return (
            <div 
              key={hero.id} 
              onClick={() => onHeroClick && onHeroClick(hero)}
              style={{ 
                background: '#161b22', border: '1px solid #30363d', borderRadius: '10px', 
                padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px',
                cursor: 'pointer', position: 'relative', overflow: 'hidden'
              }}
            >
              {/* 1. 상단: 기본 정보 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ fontSize: '14px', fontWeight: '900', fontStyle: 'italic', color: hero.rank <= 3 ? '#e89d40' : '#555', width: '24px', textAlign: 'center' }}>{hero.rank}</div>
                <GameIcon id={hero.id} size={48} shape="rounded" border="1px solid #444" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '15px', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{hero.name}</span>
                    {/* [수정] 티어 배지 스타일 적용 */}
                    <span style={{ 
                      fontSize: '10px', fontWeight: '800', 
                      color: tierStyle.color, 
                      border: `1px solid ${tierStyle.border}`, 
                      background: tierStyle.bg,
                      padding: '1px 5px', borderRadius: '4px', height: 'fit-content' 
                    }}>
                      {hero.tier}티어
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>{hero.role}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: getWinRateColor(hero.recentWinRate) }}>{hero.recentWinRate.toFixed(1)}%</div>
                  <div style={{ fontSize: '10px', color: '#666', marginTop:'2px' }}>픽 {hero.pickRate.toFixed(0)}% <span style={{color:'#444'}}>|</span> 밴 {hero.banRate.toFixed(0)}%</div>
                </div>
              </div>

              {/* 2. 하단: 상세 스탯 그리드 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1fr', gap: '4px', background: '#0d1117', borderRadius: '6px', padding: '8px 4px' }}>
                <div style={{ textAlign: 'center', borderRight: '1px solid #222' }}>
                  <div style={{ fontSize: '9px', color: '#666', marginBottom: '1px', display:'flex', alignItems:'center', justifyContent:'center', gap:'3px' }}><Skull size={9}/> KDA</div>
                  <div style={{ fontSize: '11px', fontWeight: 'bold', color: parseFloat(hero.kdaRatio) >= 3 ? '#e89d40' : '#ccc' }}>{hero.kdaRatio}</div>
                </div>
                <div style={{ textAlign: 'center', borderRight: '1px solid #222' }}>
                  <div style={{ fontSize: '9px', color: '#666', marginBottom: '1px', display:'flex', alignItems:'center', justifyContent:'center', gap:'3px' }}><Swords size={9}/> DPM</div>
                  <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#da3633' }}>{hero.avgDpm}</div>
                </div>
                <div style={{ textAlign: 'center', borderRight: '1px solid #222' }}>
                  <div style={{ fontSize: '9px', color: '#666', marginBottom: '1px', display:'flex', alignItems:'center', justifyContent:'center', gap:'3px' }}><Target size={9}/> CS</div>
                  <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#ccc' }}>{hero.avgCs}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '9px', color: '#666', marginBottom: '1px', display:'flex', alignItems:'center', justifyContent:'center', gap:'3px' }}><Coins size={9}/> GOLD</div>
                  <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#f1c40f' }}>{Number(hero.avgGold.replace(/,/g, '')) >= 1000 ? (Number(hero.avgGold.replace(/,/g, ''))/1000).toFixed(1) + 'k' : hero.avgGold}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // [데스크탑]
  return (
    <div style={{ overflowX: 'auto', flex: 1, overflowY: 'auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '40px 140px 100px 120px 140px 100px 80px 1fr', padding: '12px', background: '#0d1117', borderBottom: '1px solid #30363d', fontSize: '11px', color: '#8b949e', fontWeight: 'bold', textAlign: 'center', position: 'sticky', top: 0, zIndex: 10 }}>
        <div>순위</div>
        <div style={{ textAlign: 'left', paddingLeft: '10px' }}>챔피언</div>
        <div>승률</div>
        <div>픽률 / 밴률</div>
        <div>KDA (킬/뎃/어)</div>
        <div><Target size={10} style={{ display: 'inline' }} /> CS</div>
        <div><Swords size={10} style={{ display: 'inline' }} /> DPM</div>
        <div><Coins size={10} style={{ display: 'inline' }} /> GOLD</div>
      </div>

      <div className="hero-list-compact">
        {sortedHeroes.map((hero) => {
          const tierStyle = getTierStyle(hero.tier);
          return (
            <div 
              key={hero.id} 
              className="hero-row" 
              onClick={() => onHeroClick && onHeroClick(hero)} 
              style={{ display: 'grid', gridTemplateColumns: '40px 140px 100px 120px 140px 100px 80px 1fr', padding: '10px 12px', borderBottom: '1px solid #2c2c2f', alignItems: 'center', fontSize: '12px', color: '#ccc', textAlign: 'center', background: '#161b22', cursor: 'pointer' }}
            >
              <div style={{ fontWeight: '900', color: '#555', fontStyle: 'italic' }}>{hero.rank}</div>
              <div style={{ textAlign: 'left', paddingLeft: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <GameIcon id={hero.id} size={32} fallback={<span style={{fontSize:'16px'}}>🧙‍♂️</span>} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontWeight: 'bold', color: '#fff' }}>{hero.name}</span>
                  {/* [수정] 티어 배지 */}
                  <span style={{ fontSize: '9px', fontWeight: '800', color: tierStyle.color, border: `1px solid ${tierStyle.border}`, background: tierStyle.bg, padding: '1px 4px', borderRadius: '3px', width: 'fit-content' }}>{hero.tier}티어</span>
                </div>
              </div>
              <div style={{ fontWeight: 'bold', color: getWinRateColor(hero.recentWinRate) }}>{hero.recentWinRate.toFixed(1)}%</div>
              <div style={{ fontSize: '11px', color: '#888' }}><span style={{ color: '#fff' }}>{hero.pickRate.toFixed(1)}%</span> <span style={{ color: '#444' }}>|</span> <span style={{ color: '#da3633' }}>{hero.banRate.toFixed(1)}%</span></div>
              <div><span style={{ color: '#fff', fontWeight: 'bold', fontSize: '11px' }}>{hero.avgKda}</span><span style={{ display:'block', fontSize:'10px', color:'#666' }}>({hero.kdaRatio}:1)</span></div>
              <div style={{ fontFamily: 'monospace', color: '#888' }}>{hero.avgCs}</div>
              <div style={{ fontFamily: 'monospace', color: '#da3633' }}>{hero.avgDpm}</div>
              <div style={{ fontFamily: 'monospace', color: '#f1c40f' }}>{hero.avgGold}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};