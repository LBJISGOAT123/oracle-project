// ==========================================
// FILE PATH: /src/components/battle/dashboard/SiegeSettingsPanel.tsx
// ==========================================
import React from 'react';
import { Hammer, Target, Skull } from 'lucide-react';
import { useGameStore } from '../../../store/useGameStore';

export const SiegeSettingsPanel: React.FC = () => {
  const { gameState, updateBattleSettings } = useGameStore();
  
  // [수정] 데이터가 없으면 빈 객체로 처리하고 아래에서 개별적으로 기본값 할당
  const rawSiege = gameState.battleSettings.siege || {};

  // [안전장치] 값이 없거나 NaN이면 기본값 사용 (?? 연산자 활용)
  const siege = {
    minionDmg: rawSiege.minionDmg ?? 1.0,
    cannonDmg: rawSiege.cannonDmg ?? 1.0,
    superDmg: rawSiege.superDmg ?? 1.0,
    
    dmgToHero: rawSiege.dmgToHero ?? 1.0,
    dmgToT1: rawSiege.dmgToT1 ?? 0.3,
    dmgToT2: rawSiege.dmgToT2 ?? 0.25,
    dmgToT3: rawSiege.dmgToT3 ?? 0.2,
    dmgToNexus: rawSiege.dmgToNexus ?? 0.1,

    colossusToHero: rawSiege.colossusToHero ?? 1.0,
    colossusToT1: rawSiege.colossusToT1 ?? 0.4,
    colossusToT2: rawSiege.colossusToT2 ?? 0.35,
    colossusToT3: rawSiege.colossusToT3 ?? 0.3,
    colossusToNexus: rawSiege.colossusToNexus ?? 0.15
  };

  const handleChange = (field: string, value: number) => {
    // 기존 값 유지하면서 업데이트
    updateBattleSettings({ 
        siege: { ...siege, [field]: value } 
    } as any);
  };

  const CustomSlider = ({ label, value, onChange, max = 2 }: { label: string, value: number, onChange: (v: number) => void, max?: number }) => {
    // 한번 더 안전장치: value가 숫자가 아니면 0 처리
    const safeValue = isNaN(value) ? 0 : value;
    
    return (
      <div style={{ marginBottom: '15px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '11px', color: '#ccc' }}>
          <span>{label}</span>
          <span style={{ fontWeight: 'bold', color: '#f1c40f', fontFamily: 'monospace' }}>{(safeValue * 100).toFixed(0)}%</span>
        </div>
        <input 
          type="range" min={0} max={max} step={0.05} 
          value={safeValue} onChange={(e) => onChange(parseFloat(e.target.value))} 
          style={{ width: '100%', accentColor: '#f1c40f', height: '6px', cursor: 'pointer', background: '#30363d', borderRadius: '3px' }} 
        />
      </div>
    );
  };

  return (
    <div style={{ background: '#1c1c1f', padding: '20px', borderRadius: '16px', border: '1px solid #30363d', marginTop: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', color: '#fff', fontSize: '14px', fontWeight: 'bold', borderBottom:'1px solid #333', paddingBottom:'10px' }}>
        <Hammer size={16} color="#f1c40f" />
        <span>공성/하수인 상세 데미지 설정</span>
      </div>
      
      {/* 1. 공격자 타입 */}
      <div style={{ marginBottom:'25px' }}>
        <div style={{ fontSize:'12px', color:'#58a6ff', fontWeight:'bold', marginBottom:'10px' }}>[공격자] 하수인 종류별 기본 파워</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
            <CustomSlider label="일반 미니언" value={siege.minionDmg} onChange={(v) => handleChange('minionDmg', v)} />
            <CustomSlider label="대포 미니언" value={siege.cannonDmg} onChange={(v) => handleChange('cannonDmg', v)} />
            <CustomSlider label="거신병 (소환)" value={siege.superDmg} onChange={(v) => handleChange('superDmg', v)} />
        </div>
      </div>

      {/* 2. 일반 미니언 대상 계수 */}
      <div style={{ marginBottom:'25px' }}>
        <div style={{ fontSize:'12px', color:'#da3633', fontWeight:'bold', marginBottom:'10px', display:'flex', gap:'5px', alignItems:'center' }}>
            <Target size={12}/> [미니언] 대상별 데미지 비율
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: '15px' }}>
            <CustomSlider label="vs 영웅" value={siege.dmgToHero} onChange={(v) => handleChange('dmgToHero', v)} />
            <CustomSlider label="vs 1차" value={siege.dmgToT1} onChange={(v) => handleChange('dmgToT1', v)} />
            <CustomSlider label="vs 2차" value={siege.dmgToT2} onChange={(v) => handleChange('dmgToT2', v)} />
            <CustomSlider label="vs 3차" value={siege.dmgToT3} onChange={(v) => handleChange('dmgToT3', v)} />
            <CustomSlider label="vs 수호자" value={siege.dmgToNexus} onChange={(v) => handleChange('dmgToNexus', v)} />
        </div>
      </div>

      {/* 3. 거신병 전용 대상 계수 */}
      <div>
        <div style={{ fontSize:'12px', color:'#9b59b6', fontWeight:'bold', marginBottom:'10px', display:'flex', gap:'5px', alignItems:'center' }}>
            <Skull size={12}/> [거신병] 대상별 데미지 비율
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: '15px' }}>
            <CustomSlider label="vs 영웅" value={siege.colossusToHero} onChange={(v) => handleChange('colossusToHero', v)} />
            <CustomSlider label="vs 1차" value={siege.colossusToT1} onChange={(v) => handleChange('colossusToT1', v)} />
            <CustomSlider label="vs 2차" value={siege.colossusToT2} onChange={(v) => handleChange('colossusToT2', v)} />
            <CustomSlider label="vs 3차" value={siege.colossusToT3} onChange={(v) => handleChange('colossusToT3', v)} />
            <CustomSlider label="vs 수호자" value={siege.colossusToNexus} onChange={(v) => handleChange('colossusToNexus', v)} />
        </div>
      </div>
      
      <div style={{ fontSize: '11px', color: '#8b949e', marginTop: '15px', textAlign:'center' }}>
        * 최종 데미지 = (공격력) × (공격자 계수) × (대상 계수)
      </div>
    </div>
  );
};
