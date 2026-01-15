// ==========================================
// FILE PATH: /src/components/hero/detail/TimeWinRatePanel.tsx
// ==========================================
import React from 'react';
import { Hero } from '../../../types';
import { Clock } from 'lucide-react';

interface Props { hero: Hero; }

export const TimeWinRatePanel: React.FC<Props> = ({ hero }) => {
  
  const getPowerCurve = (role: string) => {
    switch(role) {
      case '추적자': return { early: 65, mid: 50, late: 35 };
      case '신살자': return { early: 30, mid: 50, late: 70 };
      case '선지자': return { early: 40, mid: 60, late: 50 };
      case '수호기사': return { early: 45, mid: 55, late: 60 };
      default: return { early: 50, mid: 50, late: 50 };
    }
  };

  const curve = getPowerCurve(hero.role);
  // [Fix] 승률이 0이거나 NaN이면 50으로 간주
  const baseWinRate = (hero.recentWinRate && !isNaN(hero.recentWinRate)) ? hero.recentWinRate : 50;
  const factor = baseWinRate / 50; 
  
  const stats = [
    { label: '0~15분', value: curve.early * factor, color: '#2ecc71' },
    { label: '15~30분', value: curve.mid * factor, color: '#f1c40f' },
    { label: '30분+', value: curve.late * factor, color: '#e74c3c' }
  ];

  // [Fix] 안전한 키워드 생성
  const getKeywords = () => {
    const tags = [];
    if (baseWinRate >= 52) tags.push({ text: 'OP 챔피언', color: '#ff4d4d' });
    
    const kda = parseFloat(hero.kdaRatio || '0');
    if (!isNaN(kda) && kda >= 4.0) tags.push({ text: '생존왕', color: '#58a6ff' });
    
    const dpm = parseFloat((hero.avgDpm || '0').replace(/,/g,''));
    if (!isNaN(dpm) && dpm > 2000) tags.push({ text: '폭딜러', color: '#da3633' });
    
    if (tags.length === 0) tags.push({ text: '밸런스형', color: '#ccc' });
    return tags;
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', gap:'15px' }}>
      
      <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' }}>
        {getKeywords().map((tag, i) => (
          <span key={i} style={{ 
            fontSize:'11px', fontWeight:'bold', color: tag.color, 
            background: `${tag.color}15`, border: `1px solid ${tag.color}44`,
            padding:'2px 8px', borderRadius:'12px'
          }}>
            #{tag.text}
          </span>
        ))}
      </div>

      <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center' }}>
        <div style={{ fontSize:'12px', color:'#ccc', marginBottom:'10px', display:'flex', alignItems:'center', gap:'6px' }}>
          <Clock size={12}/> 시간대별 승률 추이
        </div>
        <div style={{ display:'flex', alignItems:'flex-end', height:'80px', gap:'15px', borderBottom:'1px solid #333', paddingBottom:'5px' }}>
          {stats.map((s, i) => {
            // [Fix] 높이 값 안전 보정 (NaN 방지)
            const safeValue = isNaN(s.value) ? 50 : s.value;
            const displayHeight = Math.max(10, Math.min(100, safeValue));

            return (
              <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:'4px' }}>
                <div style={{ fontSize:'11px', fontWeight:'bold', color: safeValue >= 50 ? s.color : '#666' }}>
                  {safeValue.toFixed(1)}%
                </div>
                <div style={{ width:'100%', background:'#333', borderRadius:'4px 4px 0 0', height:'100%', position:'relative', overflow:'hidden' }}>
                  <div style={{ 
                    position:'absolute', bottom:0, width:'100%', 
                    height: `${displayHeight}%`, 
                    background: safeValue >= 50 ? s.color : '#555',
                    transition: 'height 0.5s'
                  }} />
                </div>
                <div style={{ fontSize:'10px', color:'#888' }}>{s.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
