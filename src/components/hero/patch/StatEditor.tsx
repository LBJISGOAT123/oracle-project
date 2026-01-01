// ==========================================
// FILE PATH: /src/components/hero/patch/StatEditor.tsx
// ==========================================
import React from 'react';

const STAT_CONFIG: any = {
  baseAtk: { min: 0, max: 500, step: 1, color: '#f1c40f', label: '기본 공격력' },
  ad: { min: 0, max: 1000, step: 5, color: '#e67e22', label: '추가 AD' },
  ap: { min: 0, max: 1000, step: 10, color: '#9b59b6', label: '주문력(AP)' },
  crit: { min: 0, max: 100, step: 1, color: '#e74c3c', label: '치명타율(%)' },
  // [사거리 추가]
  range: { min: 100, max: 800, step: 25, color: '#58a6ff', label: '공격 사거리' },
  hp: { min: 100, max: 10000, step: 50, color: '#2ecc71', label: '체력(HP)' },
  armor: { min: 0, max: 500, step: 2, color: '#3498db', label: '방어력' },
  speed: { min: 100, max: 1000, step: 5, color: '#95a5a6', label: '이동 속도' }
};

interface Props {
  fields: string[];
  stats: any;
  onChange: (field: string, value: number) => void;
}

export const StatEditor: React.FC<Props> = ({ fields, stats, onChange }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
      {fields.map(f => {
        const conf = STAT_CONFIG[f];
        if (!conf) return null;
        return (
          <div key={f} style={{ background: '#161b22', padding: '20px', borderRadius: '12px', border: '1px solid #30363d' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', fontSize: '14px', fontWeight: 'bold' }}>
              <label style={{ color: '#ccc' }}>{conf.label}</label>
              <span style={{ color: conf.color, fontSize:'16px' }}>{stats[f]}</span>
            </div>

            {/* 원본 슬라이더 스타일 보존 */}
            <input 
              type="range" min={conf.min} max={conf.max} step={conf.step}
              value={stats[f]} onChange={e => onChange(f, Number(e.target.value))}
              style={{ 
                width: '100%', 
                accentColor: conf.color, 
                cursor: 'pointer',
                height: '6px',
                background: '#0d1117',
                borderRadius: '3px'
              }}
            />

            {/* 원본 미세 조정 버튼 보존 */}
            <div style={{ display:'flex', justifyContent:'flex-end', gap:'10px', marginTop:'10px' }}>
              <button 
                onClick={() => onChange(f, Math.max(conf.min, stats[f] - conf.step))}
                style={{ background:'#30363d', border:'none', color:'#fff', borderRadius:'4px', width:'30px', height:'30px', cursor:'pointer' }}
              >-</button>
              <button 
                onClick={() => onChange(f, Math.min(conf.max, stats[f] + conf.step))}
                style={{ background:'#30363d', border:'none', color:'#fff', borderRadius:'4px', width:'30px', height:'30px', cursor:'pointer' }}
              >+</button>
            </div>
          </div>
        );
      })}
    </div>
  );
};