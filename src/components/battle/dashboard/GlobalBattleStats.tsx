import React from 'react';
import { Activity } from 'lucide-react';

export const GlobalBattleStats = ({ stats }: any) => {
  const total = stats.totalMatches || 1;
  const redWinRate = ((stats.izmanWins / total) * 100).toFixed(1);
  const blueWinRate = ((stats.danteWins / total) * 100).toFixed(1);
  return (
    <div style={{ background: '#161b22', padding: '20px', borderRadius: '16px', border: '1px solid #30363d', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px', fontSize:'12px', color:'#8b949e', fontWeight:'bold' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'6px' }}><Activity size={14}/> 시뮬레이션 집계</div>
        <div>총 {total.toLocaleString()} 매치 분석됨</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ color: '#ff4d4d', fontWeight: '900', fontSize: '18px' }}>{redWinRate}%</span>
        <span style={{ color: '#555', fontSize: '12px', fontWeight: 'bold' }}>WIN RATE</span>
        <span style={{ color: '#4d94ff', fontWeight: '900', fontSize: '18px' }}>{blueWinRate}%</span>
      </div>
      <div style={{ width: '100%', height: '12px', background: '#21262d', borderRadius: '6px', overflow: 'hidden', display: 'flex', marginBottom:'20px' }}>
        <div style={{ width: \`\${redWinRate}%\`, background: 'linear-gradient(90deg, #8a1c1c, #ff4d4d)', height: '100%' }}></div>
        <div style={{ width: '2px', background: '#000' }}></div>
        <div style={{ flex: 1, background: 'linear-gradient(90deg, #4d94ff, #1c4b8a)', height: '100%' }}></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1px 1fr', gap: '10px', alignItems: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'space-around' }}>
          <StatBox label="평균 KDA" value={stats.izmanAvgKills} color="#ff4d4d" align="center" />
          <StatBox label="승리" value={stats.izmanWins} color="#ff4d4d" align="center" />
        </div>
        <div style={{ width: '1px', height: '30px', background: '#30363d' }}></div>
        <div style={{ display: 'flex', justifyContent: 'space-around' }}>
          <StatBox label="승리" value={stats.danteWins} color="#4d94ff" align="center" />
          <StatBox label="평균 KDA" value={stats.danteAvgKills} color="#4d94ff" align="center" />
        </div>
      </div>
    </div>
  );
};

const StatBox = ({ label, value, color, align }: any) => (
  <div style={{ textAlign: align || 'left' }}>
    <div style={{ fontSize: '10px', color: '#8b949e', marginBottom: '2px' }}>{label}</div>
    <div style={{ fontSize: '16px', fontWeight: 'bold', color: color || '#fff', fontFamily: 'JetBrains Mono' }}>{value}</div>
  </div>
);
