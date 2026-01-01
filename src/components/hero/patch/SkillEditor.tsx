import React, { useState } from 'react';
import { HeroSkillSet } from '../../../types';
import { Edit2, Check } from 'lucide-react';

const MECHANIC_UI_CONFIG: any = {
  DAMAGE: [{ key: 'val', label: '피해량', max: 1000, step: 10 }, { key: 'adRatio', label: 'AD계수', max: 2.5, step: 0.05, color: '#e67e22' }, { key: 'apRatio', label: 'AP계수', max: 3.0, step: 0.05, color: '#9b59b6' }],
  HEAL: [{ key: 'val', label: '회복량', max: 800, step: 10, color: '#2ecc71' }, { key: 'apRatio', label: 'AP계수', max: 2.0, step: 0.05, color: '#9b59b6' }],
  SHIELD: [{ key: 'val', label: '보호막', max: 1000, step: 10, color: '#3498db' }, { key: 'adRatio', label: 'AD계수', max: 1.5, step: 0.05, color: '#e67e22' }, { key: 'duration', label: '지속시간', max: 8, step: 0.5 }],
  HOOK: [{ key: 'val', label: '그랩거리', max: 1200, step: 25, color: '#f1c40f' }, { key: 'duration', label: '기절시간', max: 3, step: 0.1 }],
  DASH: [{ key: 'val', label: '이동거리', max: 800, step: 10, color: '#9b59b6' }, { key: 'duration', label: '준비시간', max: 1.5, step: 0.05 }],
  STUN: [{ key: 'duration', label: '기절시간', max: 4, step: 0.1, color: '#e74c3c' }, { key: 'val', label: '범위', max: 600, step: 10 }],
  STEALTH: [{ key: 'duration', label: '지속시간', max: 15, step: 0.5, color: '#95a5a6' }, { key: 'val', label: '이속증가', max: 80, step: 1 }]
};

interface Props {
  skills: HeroSkillSet;
  onChange: (key: string, field: string, value: any) => void;
}

export const SkillEditor: React.FC<Props> = ({ skills, onChange }) => {
  const [selectedKey, setSelectedKey] = useState<keyof HeroSkillSet>('passive');
  const [activeField, setActiveField] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);

  const currentSkill = skills[selectedKey];
  const uiConfig = MECHANIC_UI_CONFIG[currentSkill.mechanic] || MECHANIC_UI_CONFIG.DAMAGE;

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
              color: selectedKey === k ? '#fff' : '#8b949e', fontWeight: 'bold', cursor: 'pointer' 
            }}
          >
            {k === 'passive' ? 'P' : k.toUpperCase()}
          </button>
        ))}
      </div>

      <div style={{ marginBottom: '15px', padding: '12px', background: '#161b22', borderRadius: '12px', border: '1px solid #30363d' }}>
        {isEditingName ? (
          <div style={{ display: 'flex', gap: '8px' }}>
            <input value={currentSkill.name} onChange={e => onChange(selectedKey, 'name', e.target.value)} onBlur={() => setIsEditingName(false)} autoFocus style={{ background: '#000', border: '1px solid #58a6ff', color: '#fff', padding: '5px', flex: 1, outline: 'none' }} />
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

      <select value={currentSkill.mechanic} onChange={e => onChange(selectedKey, 'mechanic', e.target.value)} style={{ width: '100%', padding: '10px', background: '#161b22', border: '1px solid #30363d', color: '#fff', borderRadius: '10px', marginBottom: '15px' }}>
        <option value="DAMAGE">⚔️ 피해</option>
        <option value="HEAL">💚 회복</option>
        <option value="SHIELD">🛡️ 보호막</option>
        <option value="HOOK">🪝 그랩</option>
        <option value="DASH">💨 이동</option>
        <option value="STUN">💫 기절</option>
        <option value="STEALTH">👻 은신</option>
      </select>

      <div style={{ display: 'flex', gap: '6px', marginBottom: '15px' }}>
        {uiConfig.map((item: any) => (
          <div key={item.key} onClick={() => setActiveField(item.key)} style={{ flex: 1, background: '#161b22', border: activeField === item.key ? '1px solid #58a6ff' : '1px solid #30363d', borderRadius: '10px', padding: '8px 4px', textAlign: 'center', cursor: 'pointer' }}>
            <label style={{ display: 'block', fontSize: '8px', color: '#8b949e', marginBottom: '4px' }}>{item.label}</label>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: item.color || '#fff' }}>{(currentSkill as any)[item.key]}</div>
          </div>
        ))}
      </div>

      {activeField && (
        <div style={{ background: '#161b22', padding: '15px', borderRadius: '15px', border: '1px solid #58a6ff44' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ color: '#aaa', fontSize: '12px' }}>{activeField.toUpperCase()} 조절</span>
            <strong style={{ color: '#58a6ff' }}>{(currentSkill as any)[activeField]}</strong>
          </div>
          <input 
            type="range" 
            min={0} 
            max={(uiConfig.find((c: any) => c.key === activeField)?.max || 1000)}
            step={(uiConfig.find((c: any) => c.key === activeField)?.step || 1)}
            value={(currentSkill as any)[activeField]} 
            onChange={e => onChange(selectedKey, activeField, Number(e.target.value))}
            style={{ width: '100%', accentColor: '#58a6ff' }}
          />
        </div>
      )}
    </div>
  );
};