// ==========================================
// FILE PATH: /src/components/battle/BattlefieldPatchModal.tsx
// ==========================================

import React, { useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { X, Save, Sliders, Zap, Shield, Sword, Heart, Coins, Layers, Star } from 'lucide-react';
// [모듈화] 분리된 입력 컴포넌트 임포트
import { RangeInput, TimeInput } from './ui/PatchInputs';

interface Props {
  targetKey: string;
  title: string;
  color: string;
  onClose: () => void;
}

export const BattlefieldPatchModal: React.FC<Props> = ({ targetKey, title, color, onClose }) => {
  const { gameState, updateFieldSettings } = useGameStore();

  // 중첩된 키(towers.t1) 처리 로직
  const getInitialSettings = () => {
    if (targetKey.startsWith('towers.')) {
        const subKey = targetKey.split('.')[1];
        return (gameState.fieldSettings.towers as any)[subKey];
    }
    return (gameState.fieldSettings as any)[targetKey];
  };

  const [localSettings, setLocalSettings] = useState({ ...getInitialSettings() });

  const handleChange = (field: string, value: any) => {
    setLocalSettings((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (targetKey.startsWith('towers.')) {
        const subKey = targetKey.split('.')[1];
        updateFieldSettings({
            towers: {
                ...gameState.fieldSettings.towers,
                [subKey]: localSettings
            }
        });
    } else {
        updateFieldSettings({ [targetKey]: localSettings });
    }
    alert(`[${title}] 패치가 적용되었습니다.`);
    onClose();
  };

  const renderInputs = () => {
    // 1. 포탑 설정 (티어별 공통)
    if (targetKey.startsWith('towers.')) {
        return (
            <>
                <RangeInput label="최대 체력" icon={<Heart size={14}/>} value={localSettings.hp} onChange={(v) => handleChange('hp', v)} min={1000} max={50000} step={100} unit=" HP" color={color} />
                <RangeInput label="방어력" icon={<Shield size={14}/>} value={localSettings.armor} onChange={(v) => handleChange('armor', v)} min={0} max={500} step={5} unit=" DEF" color={color} />
                <RangeInput label="공격력" icon={<Sword size={14}/>} value={localSettings.atk} onChange={(v) => handleChange('atk', v)} min={0} max={1000} step={10} unit=" DMG" color={color} />
                <RangeInput label="파괴 보상" icon={<Coins size={14}/>} value={localSettings.rewardGold} onChange={(v) => handleChange('rewardGold', v)} min={0} max={2000} step={10} unit=" G" color={color} />
            </>
        );
    }

    // 2. 오브젝트별 설정
    switch(targetKey) {
      case 'jungle':
        return (
          <>
            <TimeInput label="최초 생성 시간" value={localSettings.initialSpawnTime} onChange={(v) => handleChange('initialSpawnTime', v)} color={color} />
            <TimeInput label="리젠 주기" value={localSettings.respawnTime} onChange={(v) => handleChange('respawnTime', v)} color={color} />
            <div style={{borderTop:'1px dashed #444', margin:'15px 0'}}></div>
            <RangeInput label="생태계 밀도" icon={<Layers size={14}/>} value={localSettings.density} onChange={(v) => handleChange('density', v)} min={0} max={500} step={1} unit="%" color={color} />
            <RangeInput label="자원 풍요도" icon={<Zap size={14}/>} value={localSettings.yield} onChange={(v) => handleChange('yield', v)} min={0} max={500} step={1} unit="%" color={color} />
            <RangeInput label="처치 골드" icon={<Coins size={14}/>} value={localSettings.gold} onChange={(v) => handleChange('gold', v)} min={1} max={500} step={1} unit=" G" color={color} />
            <RangeInput label="처치 경험치" icon={<Star size={14}/>} value={localSettings.xp} onChange={(v) => handleChange('xp', v)} min={1} max={1000} step={1} unit=" XP" color={color} />
            <RangeInput label="공격력" icon={<Sword size={14}/>} value={localSettings.attack} onChange={(v) => handleChange('attack', v)} min={0} max={1000} step={1} unit=" DMG" color={color} />
            <RangeInput label="방어력" icon={<Shield size={14}/>} value={localSettings.defense} onChange={(v) => handleChange('defense', v)} min={0} max={500} step={1} unit=" DEF" color={color} />
          </>
        );
      case 'colossus':
        return (
          <>
            <TimeInput label="최초 출현 시간" value={localSettings.initialSpawnTime} onChange={(v) => handleChange('initialSpawnTime', v)} color={color} />
            <TimeInput label="리젠 주기" value={localSettings.respawnTime} onChange={(v) => handleChange('respawnTime', v)} color={color} />
            <div style={{borderTop:'1px dashed #444', margin:'15px 0'}}></div>
            <RangeInput label="최대 체력" icon={<Heart size={14}/>} value={localSettings.hp} onChange={(v) => handleChange('hp', v)} min={1000} max={100000} step={500} unit=" HP" color={color} />
            <RangeInput label="방어력" icon={<Shield size={14}/>} value={localSettings.armor} onChange={(v) => handleChange('armor', v)} min={0} max={500} step={5} unit=" DEF" color={color} />
            <RangeInput label="공격력" icon={<Sword size={14}/>} value={localSettings.attack} onChange={(v) => handleChange('attack', v)} min={1} max={1000} step={10} unit=" DMG" color={color} />
            <RangeInput label="처치 보상" icon={<Coins size={14}/>} value={localSettings.rewardGold} onChange={(v) => handleChange('rewardGold', v)} min={0} max={5000} step={50} unit=" G" color={color} />
          </>
        );
      case 'watcher':
        return (
          <>
            <TimeInput label="최초 출현 시간" value={localSettings.initialSpawnTime} onChange={(v) => handleChange('initialSpawnTime', v)} color={color} />
            <TimeInput label="리젠 주기" value={localSettings.respawnTime} onChange={(v) => handleChange('respawnTime', v)} color={color} />
            <div style={{borderTop:'1px dashed #444', margin:'15px 0'}}></div>
            <RangeInput label="최대 체력" icon={<Heart size={14}/>} value={localSettings.hp} onChange={(v) => handleChange('hp', v)} min={1000} max={100000} step={500} unit=" HP" color={color} />
            <RangeInput label="방어력" icon={<Shield size={14}/>} value={localSettings.armor} onChange={(v) => handleChange('armor', v)} min={0} max={500} step={5} unit=" DEF" color={color} />
            <div style={{ marginBottom:'25px' }}>
              <div style={{ fontSize:'13px', color:'#ccc', marginBottom:'10px', display:'flex', gap:'6px' }}><Zap size={14}/> 버프 종류</div>
              <select 
                value={localSettings.buffType} 
                onChange={(e) => handleChange('buffType', e.target.value)}
                style={{ width:'100%', padding:'12px', background:'#0d1117', border:`1px solid ${color}`, color:'#fff', borderRadius:'8px', outline:'none', fontSize:'14px' }}
              >
                <option value="COMBAT">⚔️ 전투력 강화</option>
                <option value="GOLD">💰 황금의 손</option>
              </select>
            </div>
            <RangeInput label="버프 수치" icon={<Zap size={14}/>} value={localSettings.buffAmount} onChange={(v) => handleChange('buffAmount', v)} min={1} max={200} step={1} unit="%" color={color} />
            <TimeInput label="버프 지속 시간" value={localSettings.buffDuration} onChange={(v) => handleChange('buffDuration', v)} color={color} />
          </>
        );
      default: return null;
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter:'blur(5px)', padding:'20px' }}>
      <div style={{ width: '100%', maxWidth: '450px', background: '#161b22', border: '1px solid #30363d', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.8)', display:'flex', flexDirection:'column', maxHeight:'90vh' }}>
        <div style={{ padding: '15px 20px', background: '#21262d', borderBottom: '1px solid #30363d', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, color: color, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px' }}>
            <Sliders size={18}/> {title} 조정
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}><X size={24}/></button>
        </div>
        <div style={{ padding: '20px', overflowY:'auto', flex:1 }}>
          {renderInputs()}
        </div>
        <div style={{ padding: '15px', borderTop: '1px solid #30363d', display: 'flex', justifyContent: 'flex-end', background:'#0d1117' }}>
          <button onClick={handleSave} style={{ width:'100%', background: '#238636', color: '#fff', border: 'none', padding: '14px', borderRadius: '8px', fontWeight: 'bold', fontSize:'15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent:'center', gap: '6px' }}>
            <Save size={18}/> 패치 적용
          </button>
        </div>
      </div>
    </div>
  );
};
