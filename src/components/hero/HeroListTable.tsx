// ==========================================
// FILE PATH: /src/components/hero/HeroListTable.tsx
// ==========================================

import React from 'react';
import { Hero } from '../../types';
// 👇 [수정] Skull을 아예 뺐습니다. (에러 원천 차단)
import { Target, Swords, Coins } from 'lucide-react'; 
import { GameIcon } from '../common/GameIcon';

interface Props {
  heroes: Hero[];
  isMobile?: boolean;
}

export const HeroListTable: React.FC<Props> = ({ heroes, isMobile = false }) => {
  const sortedHeroes = [...heroes].sort((a, b) => (a.rank || 999) - (b.rank || 999));

  if (isMobile) {
    return (
      <div style={{ overflowY: 'auto', flex: 1, padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px', paddingBottom: '80px' }}>
        {sortedHeroes.map((hero) => (
          <div key={hero.id} style={{ 
            background: '#161b22', border: '1px solid #30363d', borderRadius: '12px', padding: '12px 15px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            {/* 왼쪽: 순위, 아이콘, 이름 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flex: 1 }}>
              <div style={{ fontSize: '16px', fontWeight: '900', fontStyle: 'italic', color: hero.rank <= 3 ? '#e74c3c' : '#666', width: '20px', textAlign: 'center' }}>{hero.rank}</div>

              <GameIcon id={hero.id} size={42} fallback={<span style={{fontSize:'20px'}}>🧙‍♂️</span>} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '14px', color: '#fff' }}>{hero.name}</span>
                  <span className={`tier-badge tier-${hero.tier}`} style={{ fontSize: '9px', padding: '2px 5px', height: 'fit-content' }}>{hero.tier}티어</span>
                </div>
                <div style={{ fontSize: '11px', color: '#8b949e' }}>
                  <span style={{ color: hero.recentWinRate >= 50 ? '#ff6b6b' : '#8b949e', fontWeight: 'bold' }}>승률 {hero.recentWinRate.toFixed(1)}%</span>
                  <span style={{ margin: '0 4px', opacity: 0.3 }}>•</span>
                  <span>픽률 {hero.pickRate.toFixed(1)}%</span>
                </div>
              </div>
            </div>

            {/* 오른쪽: 스탯 정보 (Skull 아이콘 제거됨) */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px', minWidth: '80px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '12px', color: '#fff' }}>{hero.avgKda}</div>
              <div style={{ fontSize: '10px', color: '#e89d40', fontWeight:'bold' }}>{hero.avgGold} G</div>
              <div style={{ fontSize: '9px', color: '#888', display:'flex', gap:'6px', marginTop:'2px' }}>
                <span style={{ display:'flex', alignItems:'center', gap:'2px' }}><Target size={10}/> {hero.avgCs}</span>
                <span style={{ color: '#ff6b6b' }}>{hero.avgDpm}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

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
        {sortedHeroes.map((hero) => (
          <div key={hero.id} className="hero-row" style={{ display: 'grid', gridTemplateColumns: '40px 140px 100px 120px 140px 100px 80px 1fr', padding: '10px 12px', borderBottom: '1px solid #2c2c2f', alignItems: 'center', fontSize: '12px', color: '#ccc', textAlign: 'center', background: '#161b22' }}>
            <div style={{ fontWeight: '900', color: '#555', fontStyle: 'italic' }}>{hero.rank}</div>

            <div style={{ textAlign: 'left', paddingLeft: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <GameIcon id={hero.id} size={32} fallback={<span style={{fontSize:'16px'}}>🧙‍♂️</span>} />

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: 'bold', color: '#fff' }}>{hero.name}</span>
                <span className={`tier-badge tier-${hero.tier}`} style={{ marginLeft: 0, width: 'fit-content' }}>{hero.tier}티어</span>
              </div>
            </div>

            <div style={{ fontWeight: 'bold', color: hero.recentWinRate >= 50 ? '#ff6b6b' : '#4d94ff' }}>{hero.recentWinRate.toFixed(1)}%</div>
            <div style={{ fontSize: '11px', color: '#888' }}>
              <span style={{ color: '#fff' }}>{hero.pickRate.toFixed(1)}%</span> <span style={{ color: '#444' }}>|</span> <span style={{ color: '#da3633' }}>{hero.banRate.toFixed(1)}%</span>
            </div>
            <div>
              <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '11px' }}>{hero.avgKda}</span>
              <span style={{ display:'block', fontSize:'10px', color:'#666' }}>({hero.kdaRatio}:1)</span>
            </div>
            <div style={{ fontFamily: 'monospace', color: '#888' }}>{hero.avgCs}</div>
            <div style={{ fontFamily: 'monospace', color: '#da3633' }}>{hero.avgDpm}</div>
            <div style={{ fontFamily: 'monospace', color: '#f1c40f' }}>{hero.avgGold}</div>
          </div>
        ))}
      </div>
    </div>
  );
};