// ==========================================
// FILE PATH: /src/components/shop/ItemStatsView.tsx
// ==========================================

import React, { useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { Item } from '../../types';
import { Trophy, Target, Activity, ArrowUp, ArrowDown } from 'lucide-react';

export const ItemStatsView: React.FC = () => {
  const { shopItems, gameState } = useGameStore();

  // [수정] 기존 세이브 파일에 itemStats가 없을 경우를 대비해 빈 객체({}) 할당
  const itemStats = gameState.itemStats || {};
  const godStats = gameState.godStats || { totalMatches: 0 };

  const [sortKey, setSortKey] = useState<'winRate' | 'pickRate' | 'kda'>('pickRate');

  // 전체 게임 수 (픽률 계산용)
  const totalPlayerGames = Math.max(1, godStats.totalMatches * 10);

  // 데이터 가공
  const statsList = shopItems.map(item => {
    // itemStats가 비어있어도 안전하게 기본값 사용
    const stat = itemStats[item.id] || { totalPicks: 0, totalWins: 0, totalKills: 0, totalDeaths: 0, totalAssists: 0 };

    const pickRate = (stat.totalPicks / totalPlayerGames) * 100;
    const winRate = stat.totalPicks > 0 ? (stat.totalWins / stat.totalPicks) * 100 : 0;
    const kills = stat.totalPicks > 0 ? stat.totalKills / stat.totalPicks : 0;
    const deaths = stat.totalPicks > 0 ? stat.totalDeaths / stat.totalPicks : 0;
    const assists = stat.totalPicks > 0 ? stat.totalAssists / stat.totalPicks : 0;
    const kda = deaths === 0 ? (kills + assists) : (kills + assists) / deaths;

    return {
      ...item,
      stat,
      displayPickRate: pickRate,
      displayWinRate: winRate,
      displayKda: kda,
      avgKdaStr: `${kills.toFixed(1)} / ${deaths.toFixed(1)} / ${assists.toFixed(1)}`
    };
  });

  // 정렬
  const sortedList = [...statsList].sort((a, b) => {
    if (sortKey === 'winRate') return b.displayWinRate - a.displayWinRate;
    if (sortKey === 'kda') return b.displayKda - a.displayKda;
    return b.displayPickRate - a.displayPickRate; // default: pickRate
  });

  const getWinRateColor = (rate: number) => {
    if (rate >= 55) return '#ff4d4d'; // OP
    if (rate >= 50) return '#3fb950'; // Good
    return '#8b949e'; // Bad
  };

  return (
    <div style={{ padding: '0 5px' }}>
      {/* 정렬 버튼 */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', justifyContent: 'flex-end' }}>
        {[
          { key: 'pickRate', label: '채택률 순' },
          { key: 'winRate', label: '승률 순' },
          { key: 'kda', label: '평점(KDA) 순' }
        ].map((btn) => (
          <button
            key={btn.key}
            onClick={() => setSortKey(btn.key as any)}
            style={{
              background: sortKey === btn.key ? '#30363d' : 'transparent',
              color: sortKey === btn.key ? '#fff' : '#888',
              border: '1px solid #30363d', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold',
              display:'flex', alignItems:'center', gap:'4px'
            }}
          >
            {btn.label} {sortKey === btn.key && <ArrowDown size={12}/>}
          </button>
        ))}
      </div>

      {/* 테이블 헤더 */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1.5fr', padding: '10px', background: '#21262d', borderRadius: '8px 8px 0 0', fontSize: '11px', color: '#8b949e', fontWeight: 'bold' }}>
        <div>아이템 명</div>
        <div style={{ textAlign: 'center' }}>채택률</div>
        <div style={{ textAlign: 'center' }}>승률</div>
        <div style={{ textAlign: 'right', paddingRight:'10px' }}>평균 KDA</div>
      </div>

      {/* 리스트 */}
      <div style={{ border: '1px solid #30363d', borderTop: 'none', borderRadius: '0 0 8px 8px', background: '#161b22' }}>
        {sortedList.map((item, idx) => (
          <div key={item.id} style={{ 
            display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1.5fr', 
            padding: '12px 10px', borderBottom: '1px solid #2c2c2f', alignItems: 'center' 
          }}>
            {/* 1. 아이템 정보 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ fontSize: '12px', color: '#555', width: '20px', textAlign: 'center' }}>{idx + 1}</div>
              <div>
                <div style={{ color: item.type === 'POWER' ? '#9b59b6' : '#fff', fontWeight: 'bold', fontSize: '13px' }}>
                  {item.name}
                </div>
                <div style={{ fontSize: '10px', color: '#666' }}>{item.cost} G</div>
              </div>
            </div>

            {/* 2. 채택률 */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#fff', fontSize: '13px', fontWeight: 'bold' }}>{item.displayPickRate.toFixed(1)}%</div>
              <div style={{ fontSize: '10px', color: '#555' }}>{item.stat.totalPicks.toLocaleString()}회</div>
            </div>

            {/* 3. 승률 */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: getWinRateColor(item.displayWinRate), fontSize: '13px', fontWeight: 'bold' }}>
                {item.displayWinRate.toFixed(1)}%
              </div>
            </div>

            {/* 4. KDA */}
            <div style={{ textAlign: 'right', paddingRight:'10px' }}>
              <div style={{ color: item.displayKda >= 3 ? '#e89d40' : '#ccc', fontWeight: 'bold', fontSize: '13px' }}>
                {item.displayKda.toFixed(2)}:1
              </div>
              <div style={{ fontSize: '10px', color: '#666' }}>{item.avgKdaStr}</div>
            </div>
          </div>
        ))}

        {sortedList.length === 0 && (
          <div style={{ padding: '40px', textAlign: 'center', color: '#555' }}>데이터가 없습니다.</div>
        )}
      </div>
    </div>
  );
};