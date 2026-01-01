// ==========================================
// FILE PATH: /src/components/hero/patch/SkillEditor.tsx
// ==========================================
import React, { useState } from 'react';
import { HeroSkillSet } from '../../../types';
import { Edit2, Check } from 'lucide-react';

// [수정됨] 모든 스킬 타입에 { key: 'cd', label: '쿨타임', ... } 항목을 추가했습니다.
// [추가됨] EXECUTE, GLOBAL 타입에 대한 UI 설정도 추가했습니다.
const MECHANIC_UI_CONFIG: any = {
  DAMAGE: [
    { key: 'val', label: '피해량', max: 1000, step: 10 }, 
    { key: 'adRatio', label: 'AD계수', max: 2.5, step: 0.05, color: '#e67e22' }, 
    { key: 'apRatio', label: 'AP계수', max: 3.0, step: 0.05, color: '#9b59b6' },
    { key: 'range', label: '사거리', max: 1200, step: 25, color: '#58a6ff' },
    { key: 'cd', label: '쿨타임', max: 180, step: 1, color: '#bdc3c7' } // 쿨타임 추가
  ],
  HEAL: [
    { key: 'val', label: '회복량', max: 800, step: 10, color: '#2ecc71' }, 
    { key: 'apRatio', label: 'AP계수', max: 2.0, step: 0.05, color: '#9b59b6' },
    { key: 'range', label: '사거리', max: 1200, step: 25, color: '#58a6ff' },
    { key: 'cd', label: '쿨타임', max: 180, step: 1, color: '#bdc3c7' } // 쿨타임 추가
  ],
  SHIELD: [
    { key: 'val', label: '보호막', max: 1000, step: 10, color: '#3498db' }, 
    { key: 'adRatio', label: 'AD계수', max: 1.5, step: 0.05, color: '#e67e22' }, 
    { key: 'duration', label: '지속시간', max: 8, step: 0.5 },
    { key: 'range', label: '사거리', max: 1200, step: 25, color: '#58a6ff' },
    { key: 'cd', label: '쿨타임', max: 180, step: 1, color: '#bdc3c7' } // 쿨타임 추가
  ],
  HOOK: [
    { key: 'val', label: '그랩거리', max: 1200, step: 25, color: '#f1c40f' }, 
    { key: 'duration', label: '기절시간', max: 3, step: 0.1 },
    { key: 'range', label: '사거리', max: 1200, step: 25, color: '#58a6ff' },
    { key: 'cd', label: '쿨타임', max: 180, step: 1, color: '#bdc3c7' } // 쿨타임 추가
  ],
  DASH: [
    { key: 'val', label: '이동거리', max: 800, step: 10, color: '#9b59b6' }, 
    { key: 'duration', label: '준비시간', max: 1.5, step: 0.05 },
    { key: 'range', label: '사거리', max: 1200, step: 25, color: '#58a6ff' },
    { key: 'cd', label: '쿨타임', max: 180, step: 1, color: '#bdc3c7' } // 쿨타임 추가
  ],
  STUN: [
    { key: 'duration', label: '기절시간', max: 4, step: 0.1, color: '#e74c3c' }, 
    { key: 'val', label: '범위', max: 600, step: 10 },
    { key: 'range', label: '사거리', max: 1200, step: 25, color: '#58a6ff' },
    { key: 'cd', label: '쿨타임', max: 180, step: 1, color: '#bdc3c7' } // 쿨타임 추가
  ],
  STEALTH: [
    { key: 'duration', label: '지속시간', max: 15, step: 0.5, color: '#95a5a6' }, 
    { key: 'val', label: '이속증가', max: 80, step: 1 },
    { key: 'range', label: '사거리', max: 1200, step: 25, color: '#58a6ff' },
    { key: 'cd', label: '쿨타임', max: 180, step: 1, color: '#bdc3c7' } // 쿨타임 추가
  ],
  // [신규] EXECUTE(처형) 및 GLOBAL(글로벌) 타입 추가
  EXECUTE: [
    { key: 'val', label: '기본피해', max: 1000, step: 10, color: '#da3633' },
    { key: 'adRatio', label: 'AD계수', max: 3.0, step: 0.1, color: '#e67e22' },
    { key: 'range', label: '사거리', max: 1500, step: 50, color: '#58a6ff' },
    { key: 'cd', label: '쿨타임', max: 200, step: 1, color: '#bdc3c7' }
  ],
  GLOBAL: [
    { key: 'val', label: '피해/힐', max: 1000, step: 10, color: '#f1c40f' },
    { key: 'apRatio', label: 'AP계수', max: 3.0, step: 0.1, color: '#9b59b6' },
    { key: 'duration', label: '지속시간', max: 10, step: 0.5 },
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

  if (!skills) return <div>스킬 데이터를 불러올 수 없습니다.</div>;

  const currentSkill = skills[selectedKey];
  const uiConfig = MECHANIC_UI_CONFIG[currentSkill.mechanic] || MECHANIC_UI_CONFIG.DAMAGE;

  return (
    <div className="skill-editor">
      {/* 1. 스킬 선택 버튼 (P, Q, W, E, R) */}
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

      {/* 2. 스킬 이름 및 메커니즘 선택 */}
      <div style={{ marginBottom: '15px', padding: '12px', background: '#161b22', borderRadius: '12px', border: '1px solid #30363d' }}>
        {isEditingName ? (
          <div style={{ display: 'flex', gap: '8px' }}>
            <input value={currentSkill.name} onChange={e => onChange(selectedKey, 'name', e.target.value)} onBlur={() => setIsEditingName(false)} autoFocus style={{ background: '#000', border: '1px solid #58a6ff', color: '#fff', padding: '5px', flex: 1, outline: 'none', borderRadius:'4px' }} />
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

      <select value={currentSkill.mechanic} onChange={e => onChange(selectedKey, 'mechanic', e.target.value)} style={{ width: '100%', padding: '10px', background: '#161b22', border: '1px solid #30363d', color: '#fff', borderRadius: '10px', marginBottom: '15px', outline:'none', cursor:'pointer' }}>
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

      {/* 3. 스탯 그리드 (쿨타임 포함) */}
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

      {/* 4. 슬라이더 컨트롤러 */}
      {activeField && (
        <div style={{ background: '#161b22', padding: '15px', borderRadius: '12px', border: '1px solid #58a6ff44', animation: 'fadeIn 0.2s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ color: '#aaa', fontSize: '12px', fontWeight:'bold' }}>
              {uiConfig.find((c: any) => c.key === activeField)?.label} 조절
            </span>
            <strong style={{ color: '#58a6ff', fontSize:'14px' }}>
              {(currentSkill as any)[activeField]
