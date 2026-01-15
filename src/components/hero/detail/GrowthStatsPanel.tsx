import React from 'react';
import { Hero } from '../../../types';
import { TrendingUp, Coins, Activity, Target, Shield } from 'lucide-react';

interface Props {
  hero: Hero;
  isMobile: boolean;
}

const StatBox = ({ label, value, icon, color, subText }: any) => (
  <div style={{ 
    background: '#252528', padding: '12px', borderRadius: '8px', 
    border: '1px solid #333', display: 'flex', flexDirection: 'column', gap: '4px' 
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#aaa', fontWeight: 'bold' }}>
      {icon} {label}
    </div>
    <div style={{ fontSize: '16px', fontWeight: '900', color: color, fontFamily: 'monospace' }}>
      {value}
    </div>
    {subText && <div style={{ fontSize: '10px', color: '#666' }}>{subText}</div>}
  </div>
);

export const GrowthStatsPanel: React.FC<Props> = ({ hero, isMobile }) => {
  // [안전장치] record가 없으면 기본값 사용
  const record = hero.record || { totalMatches: 0, totalDeaths: 0 };
  
  const totalMatches = Math.max(1, record.totalMatches);
  const parseStat = (val: any) => {
    if (!val) return 0;
    const parsed = parseFloat(String(val).replace(/,/g, ''));
    return isNaN(parsed) ? 0 : parsed;
  };

  const gpm = parseStat(hero.avgGold);
  const cspm = parseStat(hero.avgCs);
  const dpm = parseStat(hero.avgDpm);
  
  const goldEfficiency = gpm > 0 ? ((dpm / gpm) * 100).toFixed(0) : '0';
  const avgDeaths = (record.totalDeaths || 0) / totalMatches;
  const survivalScore = Math.max(0, 100 - (avgDeaths * 8));

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#2ecc71';
    if (score >= 50) return '#f1c40f';
    return '#da3633';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', height: '100%' }}>
      <h4 style={{ color: '#fff', margin: '0', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <TrendingUp size={14} color="#2ecc71"/> 성장 지표 분석
      </h4>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr', 
        gap: '10px' 
      }}>
        <StatBox 
          label="GPM" 
          value={Math.floor(gpm).toLocaleString()} 
          icon={<Coins size={12}/>} 
          color="#f1c40f"
          subText="분당 골드" 
        />
        <StatBox 
          label="CSPM" 
          value={cspm.toFixed(1)} 
          icon={<Target size={12}/>} 
          color="#ccc" 
          subText="분당 CS"
        />
        <StatBox 
          label="생존 점수" 
          value={survivalScore.toFixed(0)} 
          icon={<Shield size={12}/>} 
          color={getScoreColor(survivalScore)} 
          subText={`평균 ${avgDeaths.toFixed(1)}데스`}
        />
        <StatBox 
          label="골드 효율" 
          value={`${goldEfficiency}%`} 
          icon={<Activity size={12}/>} 
          color="#58a6ff" 
          subText="DPM/GPM"
        />
      </div>
      
      <div style={{ background: '#252528', padding: '10px', borderRadius: '8px', fontSize: '11px', color: '#888', lineHeight: '1.4', border:'1px dashed #444' }}>
        * <strong>생존 점수</strong>가 높을수록 안정적인 성장을 의미하며, <strong>골드 효율</strong>이 높을수록 적은 돈으로 높은 딜을 뿜어냅니다.
      </div>
    </div>
  );
};
