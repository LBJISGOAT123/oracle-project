// ==========================================
// FILE PATH: /src/components/hero/RewardSettingModal.tsx
// ==========================================
import React, { useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { X, Save, Coins, Star, Users, Zap, Skull } from 'lucide-react';
import { RangeInput } from '../battle/ui/PatchInputs';

interface Props { onClose: () => void; }

export const RewardSettingModal: React.FC<Props> = ({ onClose }) => {
  const { gameState, updateBattleSettings } = useGameStore();
  const economy = gameState.battleSettings.economy;
  const [localSettings, setLocalSettings] = useState({ ...economy });

  const handleChange = (field: string, val: number) => {
    setLocalSettings(prev => ({ ...prev, [field]: val }));
  };

  const handleSave = () => {
    updateBattleSettings({ economy: localSettings });
    alert('✅ 보상 밸런스가 변경되었습니다.\n다음 킬부터 즉시 적용됩니다.');
    onClose();
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', zIndex:9999, display:'flex', justifyContent:'center', alignItems:'center', padding:'20px' }}>
      <div style={{ width:'100%', maxWidth:'450px', background:'#161b22', border:'1px solid #30363d', borderRadius:'12px', overflow:'hidden', display:'flex', flexDirection:'column', maxHeight:'90vh' }}>
        
        <div style={{ padding:'15px', background:'#21262d', borderBottom:'1px solid #30363d', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <h3 style={{ margin:0, color:'#fff', fontSize:'16px', display:'flex', alignItems:'center', gap:'8px' }}>
            <Coins size={18} color="#f1c40f"/> 보상 밸런스 설정
          </h3>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#888', cursor:'pointer', padding:'5px' }}><X size={24}/></button>
        </div>

        <div style={{ padding:'20px', overflowY:'auto', flex:1 }}>
          <div style={{ fontSize:'12px', color:'#888', marginBottom:'20px', background:'#0d1117', padding:'10px', borderRadius:'6px' }}>
            * 킬을 할 때마다 골드와 경험치를 획득합니다.<br/>
            * 현상금은 연속 킬을 기록 중인 적을 처치할 때 추가됩니다.
          </div>

          <div style={{ marginBottom:'10px', fontWeight:'bold', color:'#f1c40f', fontSize:'13px' }}>[골드 보상]</div>
          <RangeInput label="기본 킬 골드" icon={<Coins size={14}/>} value={localSettings.killGold} onChange={(v) => handleChange('killGold', v)} min={100} max={1000} step={10} unit=" G" color="#f1c40f" />
          
          <RangeInput label="적 레벨당 추가 골드" icon={<TrendingUp size={14} />} value={localSettings.goldPerLevel} onChange={(v) => handleChange('goldPerLevel', v)} min={0} max={100} step={5} unit=" G" color="#e67e22" />
          
          <RangeInput label="연속 킬당 현상금 증가" icon={<Skull size={14}/>} value={localSettings.bountyIncrement} onChange={(v) => handleChange('bountyIncrement', v)} min={0} max={500} step={50} unit=" G" color="#da3633" />

          <div style={{borderTop:'1px dashed #333', margin:'20px 0'}}></div>

          <div style={{ marginBottom:'10px', fontWeight:'bold', color:'#2ecc71', fontSize:'13px' }}>[경험치 & 어시스트]</div>
          <RangeInput label="기본 킬 경험치" icon={<Star size={14}/>} value={localSettings.killXpBase} onChange={(v) => handleChange('killXpBase', v)} min={0} max={500} step={10} unit=" XP" color="#2ecc71" />
          
          <RangeInput label="레벨당 추가 경험치" icon={<Zap size={14}/>} value={localSettings.killXpPerLevel} onChange={(v) => handleChange('killXpPerLevel', v)} min={0} max={100} step={5} unit=" XP" color="#2ecc71" />
          
          <div style={{borderTop:'1px dashed #333', margin:'20px 0'}}></div>

          <RangeInput label="어시스트 분배율" icon={<Users size={14}/>} value={localSettings.assistPool} onChange={(v) => handleChange('assistPool', v)} min={0} max={100} step={5} unit="%" color="#3498db" />
          <div style={{fontSize:'11px', color:'#666', marginTop:'-15px', textAlign:'right'}}>
             * 킬 골드의 {localSettings.assistPool}%를 어시스트 인원끼리 나눔
          </div>

        </div>

        <div style={{ padding:'15px', borderTop:'1px solid #30363d', display:'flex', gap:'10px', background:'#161b22' }}>
          <button onClick={onClose} style={{ flex:1, background:'transparent', border:'1px solid #444', color:'#ccc', padding:'12px', borderRadius:'8px', fontWeight:'bold', cursor:'pointer' }}>닫기</button>
          <button onClick={handleSave} style={{ flex:2, background:'#238636', border:'none', color:'#fff', padding:'12px', borderRadius:'8px', fontWeight:'bold', cursor:'pointer', display:'flex', justifyContent:'center', alignItems:'center', gap:'6px' }}>
            <Save size={18}/> 설정 저장
          </button>
        </div>

      </div>
    </div>
  );
};
import { TrendingUp } from 'lucide-react';
