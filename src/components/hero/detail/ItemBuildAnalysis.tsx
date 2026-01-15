// ==========================================
// FILE PATH: /src/components/hero/detail/ItemBuildAnalysis.tsx
// ==========================================
import React, { useMemo } from 'react';
import { useGameStore } from '../../../store/useGameStore';
import { Hero } from '../../../types';
import { GameIcon } from '../../common/GameIcon';
import { ShoppingBag, TrendingUp, AlertCircle } from 'lucide-react';

interface Props {
  hero: Hero;
}

export const ItemBuildAnalysis: React.FC<Props> = ({ hero }) => {
  const { gameState, shopItems } = useGameStore();
  const { itemStats, godStats } = gameState;

  // 전체 게임 수 (픽률 계산용)
  const totalGames = Math.max(1, godStats.totalMatches * 10); // 10명이니까 *10

  // 1. 해당 영웅에게 적합한 아이템 필터링 및 통계 계산
  const heroItems = useMemo(() => {
    // 역할군별 추천 아이템 타입 필터링
    const isAD = hero.stats.ad > hero.stats.ap;
    const isTank = hero.role === '수호기사';
    const isMage = hero.stats.ap > hero.stats.ad;

    return shopItems.map(item => {
      // 통계 데이터 가져오기
      const stat = itemStats[item.id] || { totalPicks: 0, totalWins: 0 };
      const pickRate = (stat.totalPicks / totalGames) * 100;
      const winRate = stat.totalPicks > 0 ? (stat.totalWins / stat.totalPicks) * 100 : 0;

      // 추천 점수 (단순 필터링용)
      let relevance = 0;
      if (item.type === 'BOOTS') relevance += 50;
      if (item.type === 'POWER') relevance += 100;
      if (isAD && (item.ad > 0 || item.crit > 0)) relevance += 20;
      if (isMage && (item.ap > 0 || item.mp > 0)) relevance += 20;
      if (isTank && (item.hp > 0 || item.armor > 0)) relevance += 20;

      return { item, pickRate, winRate, relevance };
    })
    .filter(d => d.relevance > 0 && d.pickRate > 0.1) // 관련성 있고 한 번이라도 쓰인 템만
    .sort((a, b) => b.pickRate - a.pickRate) // 픽률 순 정렬
    .slice(0, 8); // 상위 8개만 표시
  }, [hero, shopItems, itemStats, totalGames]);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* 상단 요약 */}
      <div style={{ display: 'flex', gap: '15px' }}>
        <div style={{ flex: 1, background: '#1c1c1f', padding: '15px', borderRadius: '12px', border: '1px solid #333' }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShoppingBag size={14} color="#f1c40f"/> 핵심 빌드 추천
          </h4>
          <div style={{ fontSize: '11px', color: '#888', lineHeight: '1.5' }}>
            최근 {godStats.totalMatches.toLocaleString()}경기 데이터를 기반으로 분석된 
            <span style={{ color: '#f1c40f', fontWeight: 'bold' }}> {hero.name}</span>의 승률 높은 아이템입니다.
          </div>
        </div>
        <div style={{ flex: 1, background: '#1c1c1f', padding: '15px', borderRadius: '12px', border: '1px solid #333' }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertCircle size={14} color="#58a6ff"/> 빌드 팁
          </h4>
          <div style={{ fontSize: '11px', color: '#888', lineHeight: '1.5' }}>
            상대 조합에 따라 <span style={{ color: '#58a6ff' }}>방어구</span>나 <span style={{ color: '#58a6ff' }}>관통 아이템</span>을 
            유동적으로 섞는 것이 승률 상승의 지름길입니다.
          </div>
        </div>
      </div>

      {/* 아이템 리스트 테이블 */}
      <div style={{ flex: 1, background: '#161b22', borderRadius: '12px', border: '1px solid #30363d', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '50px 1fr 100px 100px', padding: '12px 15px', background: '#21262d', borderBottom: '1px solid #30363d', fontSize: '11px', fontWeight: 'bold', color: '#8b949e' }}>
          <div style={{ textAlign: 'center' }}>순위</div>
          <div>아이템 정보</div>
          <div style={{ textAlign: 'center' }}>채용률</div>
          <div style={{ textAlign: 'center' }}>승률</div>
        </div>

        <div style={{ overflowY: 'auto', flex: 1 }}>
          {heroItems.map((data, idx) => (
            <div key={data.item.id} style={{ display: 'grid', gridTemplateColumns: '50px 1fr 100px 100px', padding: '10px 15px', borderBottom: '1px solid #2c2c2f', alignItems: 'center', background: '#161b22' }}>
              <div style={{ textAlign: 'center', fontWeight: 'bold', color: idx < 3 ? '#e89d40' : '#555', fontSize: '14px' }}>
                {idx + 1}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <GameIcon id={data.item.id} size={36} shape="rounded" border="1px solid #444" />
                <div>
                  <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '13px' }}>{data.item.name}</div>
                  <div style={{ color: '#f1c40f', fontSize: '11px', fontFamily: 'monospace' }}>{data.item.cost} G</div>
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '13px' }}>{data.pickRate.toFixed(1)}%</div>
                <div style={{ height: '4px', width: '60%', background: '#333', margin: '4px auto', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(100, data.pickRate)}%`, height: '100%', background: '#58a6ff' }} />
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: data.winRate >= 50 ? '#ff4d4d' : '#888', fontWeight: 'bold', fontSize: '13px' }}>{data.winRate.toFixed(1)}%</div>
                <div style={{ height: '4px', width: '60%', background: '#333', margin: '4px auto', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ width: `${data.winRate}%`, height: '100%', background: data.winRate >= 50 ? '#ff4d4d' : '#888' }} />
                </div>
              </div>
            </div>
          ))}
          
          {heroItems.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', color: '#555', fontSize: '13px' }}>
              충분한 데이터가 수집되지 않았습니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
