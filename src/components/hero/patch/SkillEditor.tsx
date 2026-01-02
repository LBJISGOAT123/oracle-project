// ==========================================
// FILE PATH: /src/components/hero/patch/SkillEditor.tsx
// ==========================================
import React, { useState } from 'react';
import { HeroSkillSet } from '../../../types';
import { Edit2, Check } from 'lucide-react';

const MECHANIC_UI_CONFIG: any = {
  DAMAGE: [
    { key: 'val', label: '피해량', max: 1000, step: 10 }, 
    { key: 'adRatio', label: 'AD계수', max: 2.5, step: 0.05, color: '#e67e22' }, 
    { key: 'apRatio', label: 'AP계수', max: 3.0, step: 0.05, color: '#9b59b6' },
    { key: 'cost', label: '마나 소모', max: 300, step: 5, color: '#3498db' },
    { key: 'cd', label: '쿨타임', max: 180, step: 1, color: '#bdc3c7' }
  ],
  HEAL: [
    { key: 'val', label: '회복량', max: 800, step: 10, color: '#2ecc71' }, 
    { key: 'apRatio', label: 'AP계수', max: 2.0, step: 0.05, color: '#9b59b6' },
    { key: 'cost', label: '마나 소모', max: 300, step: 5, color: '#3498db' },
    { key: 'cd', label: '쿨타임', max: 180, step: 1, color: '#bdc3c7' }
  ],
  SHIELD: [
    { key: 'val', label: '보호막', max: 1000, step: 10, color: '#3498db' }, 
    { key: 'adRatio', label: 'AD계수', max: 1.5, step: 0.05, color: '#e67e22' }, 
    { key: 'duration', label: '지속시간', max: 8, step: 0.5 },
    { key: 'cost', label: '마나 소모', max: 300, step: 5, color: '#3498db' },
    { key: 'cd', label: '쿨타임', max: 180, step: 1, color: '#bdc3c7' }
  ],
  HOOK: [
    { key: 'val', label: '그랩거리', max: 1200, step: 25, color: '#f1c40f' }, 
    { key: 'duration', label: '기절시간', max: 3, step: 0.1 },
    { key: 'cost', label: '마나 소모', max: 300, step: 5, color: '#3498db' },
    { key: 'cd', label: '쿨타임', max: 180, step: 1, color: '#bdc3c7' }
  ],
  DASH: [
    { key: 'val', label: '이동거리', max: 800, step: 10, color: '#9b59b6' }, 
    { key: 'duration', label: '준비시간', max: 1.5, step: 0.05 },
    { key: 'cost', label: '마나 소모', max: 300, step: 5, color: '#3498db' },
    { key: 'cd', label: '쿨타임', max: 180, step: 1, color: '#bdc3c7' }
  ],
  STUN: [
    { key: 'duration', label: '기절시간', max: 4, step: 0.1, color: '#e74c3c' }, 
    { key: 'val', label: '범위', max: 600, step: 10 },
    { key: 'cost', label: '마나 소모', max: 300, step: 5, color: '#3498db' },
    { key: 'cd', label: '쿨타임', max: 180, step: 1, color: '#bdc3c7' }
  ],
  STEALTH: [
    { key: 'duration', label: '지속시간', max: 15, step: 0.5, color: '#95a5a6' }, 
    { key: 'val', label: '이속증가', max: 80, step: 1 },
    { key: 'cost', label: '마나 소모', max: 300, step: 5, color: '#3498db' },
    { key: 'cd', label: '쿨타임', max: 180, step: 1, color: '#bdc3c7' }
  ],
  EXECUTE: [
    { key: 'val', label: '기본피해', max: 1000, step: 10, color: '#da3633' },
    { key: 'adRatio', label: 'AD계수', max: 3.0, step: 0.1, color: '#e67e22' },
    { key: 'cost', label: '마나 소모', max: 300, step: 5, color: '#3498db' },
    { key: 'cd', label: '쿨타임', max: 200, step: 1, color: '#bdc3c7' }
  ],
  GLOBAL: [
    { key: 'val', label: '피해/힐', max: 1000, step: 10, color: '#f1c40f' },
    { key: 'apRatio', label: 'AP계수', max: 3.0, step: 0.1, color: '#9b59b6' },
    { key: 'duration', label: '지속시간', max: 10, step: 0.5 },
    { key: 'cost', label: '마나 소모', max: 300, step: 5, color: '#3498db' },
    { key: 'cd', label: '쿨타임', max: 300, step: 5, color: '#bdc3c7' }
  ]
};

interface Props {
  skills: HeroSkillSet;
  onChange: (key: string, field: string, value: any) => void;
}

export const SkillEditor: React.FC<Props> = ({ skills, onChange }) => {
  const [selectedKey, setSelectedKey] = useState<keyof HeroSkillSet>('passive');
  const [activeField, setActiveField] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);

  if (!skills) {
    return <div style={{ color: '#fff', padding: '20px' }}>{"스킬 데이터를 불러올 수 없습니다."}</div>;
  }

  const currentSkill = skills[selectedKey];
  const uiConfig = MECHANIC_UI_CONFIG[currentSkill.mechanic] || MECHANIC_UI_CONFIG.DAMAGE;

  const currentStatValue = activeField ? (currentSkill as any)[activeField] : 0;
  const currentConfig = activeField ? uiConfig.find((c: any) => c.key === activeField) : null;
  const currentMax = currentConfig?.max || 1000;
  const currentStep = currentConfig?.step || 1;
  const currentLabel = currentConfig?.label || '';

  return (
    <div className="skill-editor">
      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px' }}>
        {(['passive', 'q', 'w', 'e', 'r'] as const).map(k => (
          <button 
            key={k} 
            onClick={() => {setSelectedKey(k); setActiveField(null);}} 
            style={{ 
              flex: 1, padding: '10px', 
              background: selectedKey === k ? '#30363d' : '#161b22', 
              border: '1px solid #30363d', borderRadius: '10px', 
              color: selectedKey === k ? '#fff' : '#8b949e', fontWeight: 'bold', cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {k === 'passive' ? 'P' : k.toUpperCase()}
          </button>
        ))}
      </div>

      <div style={{ marginBottom: '15px', padding: '12px', background: '#161b22', borderRadius: '12px', border: '1px solid #30363d' }}>
        {isEditingName ? (
          <div style={{ display: 'flex', gap: '8px' }}>
            <input 
              value={currentSkill.name} 
              onChange={e => onChange(selectedKey, 'name', e.target.value)} 
              onBlur={() => setIsEditingName(false)} 
              autoFocus 
              style={{ background: '#000', border: '1px solid #58a6ff', color: '#fff', padding: '5px', flex: 1, outline: 'none', borderRadius:'4px' }} 
            />
            <Check size={16} color="#2ecc71" onClick={() => setIsEditingName(false)} style={{ cursor: 'pointer' }} />
          </div>
        ) : (
          <div onClick={() => setIsEditingName(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <span style={{ fontSize: '10px', color: '#8b949e', fontWeight: 'bold' }}>{selectedKey.toUpperCase()}</span>
            <span style={{ fontWeight: 'bold', flex: 1, color: '#fff' }}>{currentSkill.name}</span>
            <Edit2 size={12} color="#58a6ff" />
          </div>
        )}
      </div>

      <select 
        value={currentSkill.mechanic} 
        onChange={e => onChange(selectedKey, 'mechanic', e.target.value)} 
        style={{ width: '100%', padding: '10px', background: '#161b22', border: '1px solid #30363d', color: '#fff', borderRadius: '10px', marginBottom: '15px', outline:'none', cursor:'pointer' }}
      >
        <option value="DAMAGE">⚔️ 피해 (DAMAGE)</option>
        <option value="HEAL">💚 회복 (HEAL)</option>
        <option value="SHIELD">🛡️ 보호막 (SHIELD)</option>
        <option value="HOOK">🪝 그랩 (HOOK)</option>
        <option value="DASH">💨 이동 (DASH)</option>
        <option value="STUN">💫 기절 (STUN)</option>
        <option value="STEALTH">👻 은신 (STEALTH)</option>
        <option value="EXECUTE">🩸 처형 (EXECUTE)</option>
        <option value="GLOBAL">🌍 글로벌 (GLOBAL)</option>
      </select>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '15px' }}>
        {uiConfig.map((item: any) => (
          <div 
            key={item.key} 
            onClick={() => setActiveField(item.key)} 
            style={{ 
              background: '#161b22', 
              border: activeField === item.key ? '1px solid #58a6ff' : '1px solid #30363d', 
              borderRadius: '10px', padding: '10px', 
              textAlign: 'center', cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <label style={{ display: 'block', fontSize: '10px', color: '#8b949e', marginBottom: '4px' }}>{item.label}</label>
            <div style={{ fontSize: '15px', fontWeight: 'bold', color: item.color || '#fff' }}>
              {(currentSkill as any)[item.key] ?? 0}
              {item.key === 'cd' ? '초' : ''}
            </div>
          </div>
        ))}
      </div>

      {activeField && (
        <div style={{ background: '#161b22', padding: '15px', borderRadius: '12px', border: '1px solid #58a6ff44', animation: 'fadeIn 0.2s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ color: '#aaa', fontSize: '12px', fontWeight:'bold' }}>
              {currentLabel} 조절
            </span>
            <strong style={{ color: '#58a6ff', fontSize:'14px' }}>
              {currentStatValue}
            </strong>
          </div>
          <input 
            type="range" 
            min={0} 
            max={currentMax}
            step={currentStep}
            value={currentStatValue || 0} 
            onChange={e => onChange(selectedKey, activeField!, Number(e.target.value))}
            style={{ width: '100%', accentColor: '#58a6ff', height:'6px', cursor:'pointer' }}
          />
          <div style={{ display:'flex', justifyContent:'flex-end', gap:'10px', marginTop:'10px' }}>
             <button 
               onClick={() => onChange(selectedKey, activeField!, Math.max(0, Number(currentStatValue || 0) - currentStep))} 
               style={{background:'#30363d', border:'none', color:'#fff', padding:'5px 10px', borderRadius:'4px', cursor:'pointer'}}
             >
               -
             </button>
             <button 
               onClick={() => onChange(selectedKey, activeField!, Number(currentStatValue || 0) + currentStep)} 
               style={{background:'#30363d', border:'none', color:'#fff', padding:'5px 10px', borderRadius:'4px', cursor:'pointer'}}
             >
               +
             </button>
          </div>
        </div>
      )}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};