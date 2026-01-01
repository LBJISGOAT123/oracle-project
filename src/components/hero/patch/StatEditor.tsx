// ==========================================
// FILE PATH: /src/components/hero/patch/StatEditor.tsx
// ==========================================
import React, { useState } from 'react';
import { Sliders } from 'lucide-react';

// [설정] 스킬 에디터와 동일한 스타일 적용
// min/max 범위는 넉넉하게, step은 1로 고정
const STAT_CONFIG: any = {
  baseAtk: { min: 0, max: 1000, step: 1, color: '#f1c40f', label: '기본 공격력', unit: '' },
  ad: { min: 0, max: 1000, step: 1, color: '#e67e22', label: '추가 AD', unit: '' },
  ap: { min: 0, max: 1000, step: 1, color: '#9b59b6', label: '주문력(AP)', unit: '' },
  crit: { min: 0, max: 100, step: 1, color: '#e74c3c', label: '치명타율', unit: '%' },
  range: { min: 1, max: 2000, step: 1, color: '#58a6ff', label: '공격 사거리', unit: '' },
  hp: { min: 1, max: 20000, step: 1, color: '#2ecc71', label: '체력(HP)', unit: '' },
  armor: { min: 0, max: 1000, step: 1, color: '#3498db', label: '방어력', unit: '' },
  speed: { min: 1, max: 2000, step: 1, color: '#95a5a6', label: '이동 속도', unit: '' }
};

interface Props {
  fields: string[];
  stats: any;
  onChange: (field: string, value: number) => void;
}

export const StatEditor: React.FC<Props> = ({ fields, stats, onChange }) => {
  // 현재 수정 중인 스탯 키 (예: 'hp', 'ad')
  const [activeField, setActiveField] = useState<string | null>(null);

  // 현재 선택된 스탯의 설정값 가져오기
  const currentStatValue = activeField ? stats[activeField] : 0;
  const currentConfig = activeField ? STAT_CONFIG[activeField] : null;
  
  // 설정이 없으면 기본값 처리
  const currentMax = currentConfig?.max || 1000;
  const currentStep = 1; // 무조건 1단위 고정
  const currentLabel = currentConfig?.label || '';
  const currentUnit = currentConfig?.unit || '';
  const currentColor = currentConfig?.color || '#fff';

  return (
    <div className="stat-editor">
      
      {/* 1. 스탯 카드 그리드 (터치하면 선택됨) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
        {fields.map(f => {
          const conf = STAT_CONFIG[f];
          if (!conf) return null;
          
          const isActive = activeField === f;

          return (
            <div 
              key={f} 
              onClick={() => setActiveField(f)}
              style={{ 
                background: isActive ? '#1f242e' : '#161b22', 
                border: isActive ? `2px solid ${conf.color}` : '1px solid #30363d', 
                borderRadius: '12px', padding: '15px', 
                textAlign: 'center', cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: isActive ? `0 0 15px ${conf.color}33` : 'none'
              }}
            >
              <div style={{ fontSize: '11px', color: isActive ? conf.color : '#8b949e', marginBottom: '4px', fontWeight:'bold' }}>
                {conf.label}
              </div>
              <div style={{ fontSize: '20px', fontWeight: '800', color: conf.color }}>
                {stats[f]}<span style={{fontSize:'12px', marginLeft:'2px', color:'#666'}}>{conf.unit}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 2. 슬라이더 패널 (선택 시 등장) */}
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

          {/* 슬라이더 */}
          <input 
            type="range" 
            min={currentConfig.min} 
            max={currentMax} 
            step={currentStep}
            value={currentStatValue} 
            onChange={e => onChange(activeField, Number(e.target.value))}
            style={{ width: '100%', accentColor: currentColor, height:'8px', cursor:'pointer', marginBottom:'15px' }}
          />

          {/* 미세 조정 버튼 (+-1, +-10) */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:'8px' }}>
             <AdjustBtn onClick={() => onChange(activeField, Math.max(currentConfig.min, currentStatValue - 10))} label="-10" />
             <AdjustBtn onClick={() => onChange(activeField, Math.max(currentConfig.min, currentStatValue - 1))} label="-1" />
             <AdjustBtn onClick={() => onChange(activeField, Math.min(currentMax, currentStatValue + 1))} label="+1" />
             <AdjustBtn onClick={() => onChange(activeField, Math.min(currentMax, currentStatValue + 10))} label="+10" />
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

// 미세 조정 버튼 컴포넌트
const AdjustBtn = ({ onClick, label }: any) => (
  <button 
    onClick={onClick} 
    style={{
      background:'#21262d', border:'1px solid #30363d', color:'#fff', 
      padding:'12px 0', borderRadius:'8px', cursor:'pointer', fontWeight:'bold',
      fontSize:'14px', transition:'0.1s'
    }}
    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#30363d'}
    onMouseLeave={e => e.currentTarget.style.backgroundColor = '#21262d'}
  >
    {label}
  </button>
);
