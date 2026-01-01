// ==========================================
// FILE PATH: /src/components/hero/RolePatchModal.tsx
// ==========================================

import React, { useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { Role, RoleSettings } from '../../types';
import { X, Save, Sliders } from 'lucide-react';

interface Props {
  role: Role;
  onClose: () => void;
}

export const RolePatchModal: React.FC<Props> = ({ role, onClose }) => {
  const { gameState, updateRoleSettings } = useGameStore();

  // 스토어에서 현재 설정값 가져오기 (없으면 기본값)
  const initialSettings = gameState.roleSettings || {
    executor: { damage: 15, defense: 15 },
    tracker: { gold: 20, smiteChance: 1.5 },
    prophet: { cdrPerLevel: 2 },
    slayer: { structureDamage: 30 },
    guardian: { survivalRate: 20 }
  };

  const [settings, setSettings] = useState<RoleSettings>(initialSettings);

  // 값 변경 핸들러
  const handleChange = (group: keyof RoleSettings, field: string, value: number) => {
    setSettings(prev => ({
      ...prev,
      [group]: { ...prev[group], [field]: value }
    }));
  };

  // 저장 핸들러
  const handleSave = () => {
    updateRoleSettings(settings);
    alert(`[${role}] 밸런스 패치가 완료되었습니다.\n다음 시뮬레이션 틱부터 즉시 적용됩니다.`);
    onClose();
  };

  // 역할군별로 다른 입력창 렌더링
  const renderInputs = () => {
    switch(role) {
      case '집행관':
        return (
          <>
            <div style={{fontSize:'12px', color:'#888', marginBottom:'10px'}}>
              * 고립(주변에 아군 없음) 상태일 때 적용되는 보너스입니다.
            </div>
            <RangeInput 
              label="추가 피해량" 
              value={settings.executor.damage} 
              onChange={(v: number) => handleChange('executor', 'damage', v)} 
              unit="%" max={100} 
            />
            <RangeInput 
              label="추가 방어력" 
              value={settings.executor.defense} 
              onChange={(v: number) => handleChange('executor', 'defense', v)} 
              unit="%" max={100} 
            />
          </>
        );
      case '추적자':
        return (
          <>
            <div style={{fontSize:'12px', color:'#888', marginBottom:'10px'}}>
              * 정글러의 성장 속도와 오브젝트 싸움 능력을 조절합니다.
            </div>
            <RangeInput 
              label="골드 획득량 보너스" 
              value={settings.tracker.gold} 
              onChange={(v: number) => handleChange('tracker', 'gold', v)} 
              unit="%" max={200} 
            />
            <RangeInput 
              label="강타 확률 배율 (기본 1.0)" 
              value={settings.tracker.smiteChance} 
              onChange={(v: number) => handleChange('tracker', 'smiteChance', v)} 
              unit="배" max={5} step={0.1} 
            />
          </>
        );
      case '선지자':
        return (
          <>
            <div style={{fontSize:'12px', color:'#888', marginBottom:'10px'}}>
              * 레벨이 오를수록 스킬 쿨타임이 줄어드는 효과를 데미지로 환산합니다.
            </div>
            <RangeInput 
              label="레벨당 스킬 위력 증가" 
              value={settings.prophet.cdrPerLevel} 
              onChange={(v: number) => handleChange('prophet', 'cdrPerLevel', v)} 
              unit="%" max={10} step={0.5} 
            />
            <div style={{fontSize:'11px', color:'#58a6ff', marginTop:'5px'}}>
              (예: 3% 설정 시, 16레벨 도달하면 데미지 48% 증가)
            </div>
          </>
        );
      case '신살자':
        return (
          <>
             <div style={{fontSize:'12px', color:'#888', marginBottom:'10px'}}>
              * 타워 철거 및 넥서스 파괴 능력을 조절합니다.
            </div>
            <RangeInput 
              label="구조물 대상 추가 피해" 
              value={settings.slayer.structureDamage} 
              onChange={(v: number) => handleChange('slayer', 'structureDamage', v)} 
              unit="%" max={300} 
            />
          </>
        );
      case '수호기사':
        return (
          <>
            <div style={{fontSize:'12px', color:'#888', marginBottom:'10px'}}>
              * 같은 라인 아군의 생존력을 높여줍니다.
            </div>
            <RangeInput 
              label="아군 생존율 증가 보정" 
              value={settings.guardian.survivalRate} 
              onChange={(v: number) => handleChange('guardian', 'survivalRate', v)} 
              unit="%" max={80} 
            />
          </>
        );
      default: return null;
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ width: '400px', background: '#161b22', border: '1px solid #30363d', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.8)' }}>

        {/* 헤더 */}
        <div style={{ padding: '15px', background: '#21262d', borderBottom: '1px solid #30363d', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px' }}>
            <Sliders size={18} color="#58a6ff"/> {role} 밸런스 패치
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}><X size={20}/></button>
        </div>

        {/* 바디 */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {renderInputs()}
        </div>

        {/* 푸터 */}
        <div style={{ padding: '15px', borderTop: '1px solid #30363d', display: 'flex', justifyContent: 'flex-end', background:'#0d1117' }}>
          <button onClick={handleSave} style={{ background: '#238636', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Save size={16}/> 패치 적용
          </button>
        </div>
      </div>
    </div>
  );
};

// 슬라이더 컴포넌트
const RangeInput = ({ label, value, onChange, unit, max, step = 1 }: any) => (
  <div>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px', color: '#ccc' }}>
      <span>{label}</span>
      <span style={{ fontWeight: 'bold', color: '#58a6ff', fontFamily:'monospace' }}>{value}{unit}</span>
    </div>
    <input 
      type="range" min={0} max={max} step={step} value={value} 
      onChange={(e) => onChange(Number(e.target.value))} 
      style={{ width: '100%', accentColor: '#58a6ff', height: '4px', cursor: 'pointer' }} 
    />
  </div>
);