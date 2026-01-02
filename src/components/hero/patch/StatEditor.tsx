// ==========================================
// FILE PATH: /src/components/hero/patch/StatEditor.tsx
// ==========================================
import React, { useState } from 'react';
import { Sliders } from 'lucide-react';

// [수정] 스탯 설정 확장 (마나, 재생, 관통력 추가)
const STAT_CONFIG: any = {
  baseAtk: { min: 0, max: 200, step: 1, color: '#777', label: '기본 공격력', unit: '' },
  ad: { min: 0, max: 1000, step: 1, color: '#e67e22', label: '추가 AD (계수용)', unit: '' },
  ap: { min: 0, max: 1000, step: 1, color: '#9b59b6', label: '주문력(AP)', unit: '' },
  crit: { min: 0, max: 100, step: 1, color: '#e74c3c', label: '치명타율', unit: '%' },
  range: { min: 1, max: 1000, step: 5, color: '#ccc', label: '공격 사거리', unit: '' },
  pen: { min: 0, max: 100, step: 1, color: '#da3633', label: '방어 관통력', unit: '' },

  hp: { min: 1, max: 5000, step: 10, color: '#2ecc71', label: '체력(HP)', unit: '' },
  mp: { min: 0, max: 2000, step: 10, color: '#3498db', label: '마나(MP)', unit: '' },
  regen: { min: 0, max: 100, step: 1, color: '#27ae60', label: '체력 재생', unit: '/s' },
  mpRegen: { min: 0, max: 50, step: 1, color: '#2980b9', label: '마나 재생', unit: '/s' },
  armor: { min: 0, max: 300, step: 1, color: '#3498db', label: '방어력', unit: '' },
  speed: { min: 100, max: 600, step: 5, color: '#f1c40f', label: '이동 속도', unit: '' }
};

interface Props {
  fields: string[];
  stats: any;
  onChange: (field: string, value: number) => void;
}

export const StatEditor: React.FC<Props> = ({ fields, stats, onChange }) => {
  const [activeField, setActiveField] = useState<string | null>(null);

  const currentStatValue = activeField ? stats[activeField] : 0;
  const currentConfig = activeField ? STAT_CONFIG[activeField] : null;

  const currentMax = currentConfig?.max || 1000;
  const currentStep = currentConfig?.step || 1;
  const currentLabel = currentConfig?.label || '';
  const currentUnit = currentConfig?.unit || '';
  const currentColor = currentConfig?.color || '#fff';

  return (
    <div className="stat-editor">

      {/* 1. 스탯 카드 그리드 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '20px' }}>
        {fields.map(f => {
          const conf = STAT_CONFIG[f];
          if (!conf) return null;

          const isActive = activeField === f;
          const val = stats[f] !== undefined ? stats[f] : 0;

          return (
            <div 
              key={f} 
              onClick={() => setActiveField(f)}
              style={{ 
                background: isActive ? '#1f242e' : '#161b22', 
                border: isActive ? `2px solid ${conf.color}` : '1px solid #30363d', 
                borderRadius: '8px', padding: '10px 5px', 
                textAlign: 'center', cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ fontSize: '10px', color: isActive ? conf.color : '#8b949e', marginBottom: '2px', fontWeight:'bold', whiteSpace:'nowrap' }}>
                {conf.label}
              </div>
              <div style={{ fontSize: '14px', fontWeight: '800', color: conf.color }}>
                {val}<span style={{fontSize:'10px', marginLeft:'1px', color:'#666'}}>{conf.unit}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 2. 슬라이더 패널 */}
      {activeField && currentConfig && (
        <div style={{ 
          background: '#1c1c1f', padding: '20px', borderRadius: '16px', 
          border: `1px solid ${currentColor}`, boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
          animation: 'slideUp 0.2s ease-out'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
              <Sliders size={18} color={currentColor}/>
              <span style={{ color: '#fff', fontSize: '14px', fontWeight:'bold' }}>{currentLabel} 조절</span>
            </div>
            <div style={{ fontSize: '24px', fontWeight: '900', color: currentColor }}>
              {currentStatValue}<span style={{fontSize:'14px', color:'#555'}}>{currentUnit}</span>
            </div>
          </div>

          <input 
            type="range" 
            min={currentConfig.min} 
            max={currentMax} 
            step={currentStep}
            value={currentStatValue || 0} 
            onChange={e => onChange(activeField, Number(e.target.value))}
            style={{ width: '100%', accentColor: currentColor, height:'8px', cursor:'pointer', marginBottom:'15px' }}
          />

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:'8px' }}>
             <AdjustBtn onClick={() => onChange(activeField, Math.max(currentConfig.min, (currentStatValue||0) - (currentStep*10)))} label={`-${currentStep*10}`} />
             <AdjustBtn onClick={() => onChange(activeField, Math.max(currentConfig.min, (currentStatValue||0) - currentStep))} label={`-${currentStep}`} />
             <AdjustBtn onClick={() => onChange(activeField, Math.min(currentMax, (currentStatValue||0) + currentStep))} label={`+${currentStep}`} />
             <AdjustBtn onClick={() => onChange(activeField, Math.min(currentMax, (currentStatValue||0) + (currentStep*10)))} label={`+${currentStep*10}`} />
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

const AdjustBtn = ({ onClick, label }: any) => (
  <button 
    onClick={onClick} 
    style={{
      background:'#21262d', border:'1px solid #30363d', color:'#fff', 
      padding:'12px 0', borderRadius:'8px', cursor:'pointer', fontWeight:'bold',
      fontSize:'14px', transition:'0.1s'
    }}
  >
    {label}
  </button>
);