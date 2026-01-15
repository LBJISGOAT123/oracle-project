import React from 'react';
import { Hero, Tier } from '../../types';
import { Target, Swords, Coins, Skull, Shield } from 'lucide-react'; 
import { GameIcon } from '../common/GameIcon';

interface Props {
  heroes: Hero[];
  isMobile?: boolean;
  onHeroClick?: (hero: Hero) => void;
}

const getWinRateColor = (rate: number) => {
  if (rate >= 52) return '#ff4d4d'; 
  if (rate >= 50) return '#3fb950'; 
  return '#8b949e'; 
};

const getTierStyle = (tier: Tier) => {
  switch (tier) {
    case 'OP': return { color: '#ff4d4d', border: '#ff4d4d', bg: 'rgba(255, 77, 77, 0.15)' };
    case '1': return { color: '#e89d40', border: '#e89d40', bg: 'rgba(232, 157, 64, 0.15)' };
    case '2': return { color: '#58a6ff', border: '#58a6ff', bg: 'rgba(88, 166, 255, 0.15)' };
    case '3': return { color: '#2ecc71', border: '#2ecc71', bg: 'rgba(46, 204, 113, 0.15)' };
    case '4': return { color: '#95a5a6', border: '#95a5a6', bg: 'rgba(149, 165, 166, 0.15)' };
    case '5': return { color: '#7f8c8d', border: '#7f8c8d', bg: 'rgba(127, 140, 141, 0.15)' };
    default: return { color: '#8b949e', border: '#30363d', bg: '#21262d' };
  }
};

// [핵심] 행(Row)을 별도 컴포넌트로 분리하고 메모이제이션(React.memo) 처리
// 리스트 전체가 다시 그려질 때 개별 행들은 건드리지 않게 하여 삭제 오류 방지
const HeroRow = React.memo(({ hero, isMobile, onClick }: { hero: Hero, isMobile: boolean, onClick: (h: Hero) => void }) => {
  const tierStyle = getTierStyle(hero.tier);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // [핵심] 클릭 이벤트와 렌더링 사이클 분리
    requestAnimationFrame(() => onClick(hero));
  };

  if (isMobile) {
    return (
      <div 
        onClick={handleClick}
        style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: '10px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px', cursor: 'pointer' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ fontSize: '14px', fontWeight: '900', fontStyle: 'italic', color: hero.rank <= 3 ? '#e89d40' : '#555', width: '24px', textAlign: 'center' }}>
            <span>{hero.rank}</span>
          </div>
          <GameIcon id={hero.id} size={48} shape="rounded" border="1px solid #444" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontWeight: 'bold', fontSize: '15px', color: '#fff' }}>{hero.name}</span>
              <span style={{ fontSize: '10px', fontWeight: '800', color: tierStyle.color, border: `1px solid ${tierStyle.border}`, background: tierStyle.bg, padding: '1px 5px', borderRadius: '4px' }}>
                {hero.tier}<span>티어</span>
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#888', marginTop: '4px', display:'flex', alignItems:'center', gap:'6px' }}>
              <span style={{ fontWeight:'bold', color:'#ccc' }}>{hero.role}</span>
              <span style={{ width:'1px', height:'10px', background:'#444' }}></span>
              <span style={{ fontFamily:'monospace', color:'#aaa' }}>{hero.avgKda}</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: getWinRateColor(hero.recentWinRate) }}>
              {hero.recentWinRate.toFixed(1)}<span>%</span>
            </div>
            <div style={{ fontSize: '10px', color: '#666', marginTop:'2px' }}>
              <span>픽</span> {hero.pickRate.toFixed(0)}<span>%</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      onClick={handleClick} 
      style={{ 
        display: 'grid', gridTemplateColumns: '50px 200px 100px 140px 120px 100px 100px 1fr', 
        padding: '10px', borderBottom: '1px solid #2c2c2f', alignItems: 'center', 
        fontSize: '13px', color: '#ccc', textAlign: 'center', background: '#161b22', cursor: 'pointer'
      }}
    >
      <div style={{ fontWeight: '900', color: '#555', fontStyle: 'italic' }}>
        <span>{hero.rank}</span>
      </div>
      
      <div style={{ textAlign: 'left', paddingLeft: '10px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <GameIcon id={hero.id} size={32} />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 'bold', color: '#fff' }}>{hero.name}</span>
          <div style={{ display:'flex', gap:'4px', alignItems:'center', marginTop:'2px' }}>
            <span style={{ fontSize: '10px', color: '#888' }}>{hero.role}</span>
            <span style={{ fontSize: '9px', fontWeight: '800', color: tierStyle.color, border: `1px solid ${tierStyle.border}`, background: tierStyle.bg, padding: '0 4px', borderRadius: '3px' }}>
              {hero.tier}
            </span>
          </div>
        </div>
      </div>

      <div style={{ fontWeight: 'bold', color: getWinRateColor(hero.recentWinRate) }}>
        {hero.recentWinRate.toFixed(1)}<span>%</span>
      </div>
      
      <div style={{ fontSize: '12px', color: '#888' }}>
        <span style={{ color: '#fff' }}>{hero.pickRate.toFixed(1)}%</span>
        <span style={{ color: '#444', margin: '0 4px' }}>/</span>
        <span style={{ color: '#da3633' }}>{hero.banRate.toFixed(1)}%</span>
      </div>

      <div>
        <span style={{ color: '#fff', fontWeight: 'bold' }}>{hero.avgKda}</span>
        <span style={{ display:'block', fontSize:'10px', color:'#666' }}>({hero.kdaRatio}:1)</span>
      </div>

      <div style={{ fontFamily: 'monospace', color: '#aaa' }}><span>{hero.avgCs}</span></div>
      <div style={{ fontFamily: 'monospace', color: '#da3633' }}><span>{hero.avgDpm}</span></div>
      <div style={{ fontFamily: 'monospace', color: '#f1c40f' }}><span>{hero.avgGold}</span></div>
    </div>
  );
});

export const HeroListTable: React.FC<Props> = ({ heroes, isMobile = false, onHeroClick }) => {
  const sortedHeroes = [...heroes].sort((a, b) => (a.rank || 999) - (b.rank || 999));

  return (
    <div style={{ overflowX: 'auto', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
      {!isMobile && (
        <div style={{ display: 'grid', gridTemplateColumns: '50px 200px 100px 140px 120px 100px 100px 1fr', padding: '12px 10px', background: '#0d1117', borderBottom: '1px solid #30363d', fontSize: '12px', color: '#8b949e', fontWeight: 'bold', textAlign: 'center', position: 'sticky', top: 0, zIndex: 10 }}>
          <span>순위</span>
          <div style={{ textAlign: 'left', paddingLeft: '10px' }}><span>챔피언</span></div>
          <span>승률</span>
          <span>픽률 / 밴률</span>
          <span>KDA</span>
          <span>CS</span>
          <span>DPM</span>
          <span>GOLD</span>
        </div>
      )}

      <div style={isMobile ? { padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px', paddingBottom: '80px' } : {}}>
        {sortedHeroes.map((hero) => (
          <HeroRow 
            key={hero.id} 
            hero={hero} 
            isMobile={!!isMobile} 
            onClick={onHeroClick || (() => {})} 
          />
        ))}
      </div>
    </div>
  );
};
