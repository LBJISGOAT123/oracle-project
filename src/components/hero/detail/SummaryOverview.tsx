import React from 'react';
import { Hero } from '../../../types';
import { Trophy } from 'lucide-react';
import { HeroPolygonChart } from './HeroPolygonChart';
import { TimeWinRatePanel } from './TimeWinRatePanel';

interface Props {
  hero: Hero;
  isMobile: boolean;
}

const getScoreColor = (score: number) => {
  if (score >= 52) return '#ff4d4d'; 
  if (score >= 48) return '#2ecc71'; 
  return '#8b949e'; 
};

const PerformanceCard = ({ winRate, kdaRatio, pickRate, banRate }: any) => (
  <div style={{ background: '#1c1c1f', padding: '15px', borderRadius: '12px', border: '1px solid #333' }}>
    <h3 style={{ margin:'0 0 15px 0', fontSize:'14px', color:'#f1c40f', display:'flex', gap:'6px', alignItems:'center' }}>
      <Trophy size={14}/> 시즌 퍼포먼스 요약
    </h3>
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:'8px', textAlign:'center' }}>
      <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
        <div style={{ fontSize:'11px', color:'#888' }}>승률</div>
        <div style={{ fontSize:'18px', fontWeight:'900', color: getScoreColor(winRate) }}>{(winRate || 0).toFixed(1)}%</div>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:'4px', borderLeft:'1px solid #333' }}>
        <div style={{ fontSize:'11px', color:'#888' }}>KDA</div>
        <div style={{ fontSize:'18px', fontWeight:'900', color: parseFloat(kdaRatio || '0') >= 3 ? '#2ecc71' : '#fff' }}>{kdaRatio || '0.00'}</div>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:'4px', borderLeft:'1px solid #333' }}>
        <div style={{ fontSize:'11px', color:'#888' }}>픽률</div>
        <div style={{ fontSize:'18px', fontWeight:'900', color:'#fff' }}>{(pickRate || 0).toFixed(1)}%</div>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:'4px', borderLeft:'1px solid #333' }}>
        <div style={{ fontSize:'11px', color:'#da3633' }}>밴률</div>
        <div style={{ fontSize:'18px', fontWeight:'900', color:'#da3633' }}>{(banRate || 0).toFixed(1)}%</div>
      </div>
    </div>
  </div>
);

export const SummaryOverview: React.FC<Props> = ({ hero, isMobile }) => {
  // [안전장치] record가 없는 경우를 대비
  const record = hero.record || { totalMatches: 0, totalWins: 0 };
  const totalMatches = Math.max(1, record.totalMatches);
  const winRate = (record.totalWins / totalMatches) * 100;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', height:'100%' }}>
      
      <PerformanceCard 
        winRate={winRate} 
        kdaRatio={hero.kdaRatio} 
        pickRate={hero.pickRate} 
        banRate={hero.banRate} 
      />

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', 
        gap: '15px', 
        flex: 1 
      }}>
        <div style={{ background: '#1c1c1f', padding: '20px', borderRadius: '12px', border: '1px solid #333', minHeight: '200px' }}>
          <HeroPolygonChart hero={hero} />
        </div>

        <div style={{ background: '#1c1c1f', padding: '20px', borderRadius: '12px', border: '1px solid #333', minHeight: '200px' }}>
          <TimeWinRatePanel hero={hero} />
        </div>
      </div>

    </div>
  );
};
