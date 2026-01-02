// ==========================================
// FILE PATH: /src/components/battle/BattlefieldPatchModal.tsx
// ==========================================

import React, { useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { X, Save, Sliders, Zap, Shield, Sword, Heart, Clock, Coins, Layers, Star } from 'lucide-react';

interface Props {
  targetKey: string;
  title: string;
  color: string;
  onClose: () => void;
}

export const BattlefieldPatchModal: React.FC<Props> = ({ targetKey, title, color, onClose }) => {
  const { gameState, updateFieldSettings } = useGameStore();

  const initialSettings = (gameState.fieldSettings as any)[targetKey] || {};
  const [localSettings, setLocalSettings] = useState({ ...initialSettings });

  const handleChange = (field: string, value: any) => {
    setLocalSettings((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    // @ts-ignore
    updateFieldSettings({ [targetKey]: localSettings });
    alert(`[${title}] 패치가 적용되었습니다.`);
    onClose();
  };

  // [CSS 수정] 터치 영역 최적화 및 기본 스타일 제거
  const sliderStyle = `
    .custom-range {
      -webkit-appearance: none; /* 크롬, 사파리 기본 스타일 제거 */
      appearance: none;
      width: 100%;
      background: transparent;
      cursor: pointer;
      height: 30px; /* 터치 판정 영역 확대 */
      margin: 0;
      touch-action: none; /* 브라우저 스크롤 개입 차단 */
      position: relative;
      z-index: 10;
    }
    .custom-range:focus {
      outline: none;
    }
    /* 트랙 스타일 */
    .custom-range::-webkit-slider-runnable-track {
      width: 100%;
      height: 8px; /* 트랙 두께 약간 확대 */
      background: #30363d;
      border-radius: 4px;
      border: 1px solid #444;
    }
    /* 손잡이(Thumb) 스타일 */
    .custom-range::-webkit-slider-thumb {
      -webkit-appearance: none;
      height: 26px; /* 손잡이 크기 확대 */
      width: 26px;
      border-radius: 50%;
      background: ${color};
      border: 3px solid #fff; /* 테두리를 두껍게 해서 시인성 확보 */
      margin-top: -10px; /* 중앙 정렬 보정 */
      box-shadow: 0 2px 6px rgba(0,0,0,0.6);
      transition: transform 0.1s;
    }
    .custom-range:active::-webkit-slider-thumb {
      transform: scale(1.1);
      background: #fff;
      border-color: ${color};
    }
  `;

  // [컴포넌트 수정] 터치 이벤트 전파 방지 로직 추가
  const RangeInput = ({ label, icon, field, min, max, step = 1, unit }: any) => (
    <div style={{ marginBottom: '25px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '13px', color: '#ccc' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>{icon} {label}</div>
        <span style={{ fontWeight: 'bold', color: color, fontFamily:'monospace', fontSize:'15px' }}>
          {localSettings[field]?.toLocaleString()}{unit}
        </span>
      </div>
      <div style={{ padding: '0 5px' }}> {/* 슬라이더 좌우 여백 확보 */}
        <input 
          type="range" min={min} max={max} step={step} 
          value={localSettings[field] || 0} 
          onChange={(e) => handleChange(field, Number(e.target.value))} 
          className="custom-range"
          // [핵심] 터치 시 스크롤 이벤트가 발생하지 않도록 차단
          onTouchStart={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  );

  const renderInputs = () => {
    switch(targetKey) {
      case 'jungle':
        return (
          <>
            <div style={{ fontSize:'12px', color:'#888', marginBottom:'20px', background:'rgba(255,255,255,0.05)', padding:'12px', borderRadius:'8px', lineHeight:'1.5' }}>
              <div style={{marginBottom:'4px', color:'#fff'}}><strong>📢 용어 설명</strong></div>
              <div>• <strong>자원 풍요도:</strong> 몬스터 리젠 속도 (빈도)</div>
              <div>• <strong>골드/경험치:</strong> 몬스터 1마리당 보상</div>
            </div>

            {/* [수정] 생태계 밀도 최대 500% */}
            <RangeInput label="생태계 밀도" icon={<Layers size={14}/>} field="density" min={0} max={500} step={1} unit="%" />
            <RangeInput label="자원 풍요도 (리젠율)" icon={<Zap size={14}/>} field="yield" min={0} max={500} step={1} unit="%" />

            <div style={{ borderTop:'1px dashed #444', margin:'20px 0' }}/>
            <div style={{ fontSize:'12px', color: color, fontWeight:'bold', marginBottom:'15px' }}>▼ 사냥 보상 설정</div>

            <RangeInput label="크리처 처치 골드" icon={<Coins size={14}/>} field="gold" min={1} max={500} step={1} unit=" G" />
            <RangeInput label="크리처 처치 경험치" icon={<Star size={14}/>} field="xp" min={1} max={1000} step={1} unit=" XP" />

            <div style={{ borderTop:'1px dashed #444', margin:'20px 0' }}/>
            <div style={{ fontSize:'12px', color: color, fontWeight:'bold', marginBottom:'15px' }}>▼ 크리처 전투력</div>

            <RangeInput label="공격력" icon={<Sword size={14}/>} field="attack" min={0} max={1000} step={1} unit=" DMG" />
            <RangeInput label="방어력" icon={<Shield size={14}/>} field="defense" min={0} max={500} step={1} unit=" DEF" />
          </>
        );
      case 'colossus':
        return (
          <>
            <RangeInput label="최대 체력" icon={<Heart size={14}/>} field="hp" min={1} max={100000} step={100} unit=" HP" />
            <RangeInput label="방어력" icon={<Shield size={14}/>} field="armor" min={0} max={500} step={1} unit=" DEF" />
            <RangeInput label="공성 공격력" icon={<Sword size={14}/>} field="attack" min={1} max={1000} step={1} unit=" DMG" />
            <RangeInput label="처치 보상" icon={<Coins size={14}/>} field="rewardGold" min={0} max={2000} step={10} unit=" G" />
            <RangeInput label="리젠 시간" icon={<Clock size={14}/>} field="respawnTime" min={10} max={1800} step={10} unit=" 초" />
          </>
        );
      case 'watcher':
        return (
          <>
            <RangeInput label="최대 체력" icon={<Heart size={14}/>} field="hp" min={1} max={100000} step={100} unit=" HP" />
            <RangeInput label="방어력" icon={<Shield size={14}/>} field="armor" min={0} max={500} step={1} unit=" DEF" />
            <div style={{ marginBottom:'25px' }}>
              <div style={{ fontSize:'13px', color:'#ccc', marginBottom:'10px', display:'flex', gap:'6px' }}><Zap size={14}/> 버프 종류</div>
              <select 
                value={localSettings.buffType} 
                onChange={(e) => handleChange('buffType', e.target.value)}
                style={{ width:'100%', padding:'12px', background:'#0d1117', border:`1px solid ${color}`, color:'#fff', borderRadius:'8px', outline:'none', fontSize:'14px' }}
              >
                <option value="COMBAT">⚔️ 전투력 강화 (데미지/명중률)</option>
                <option value="GOLD">💰 황금의 손 (골드 획득량)</option>
              </select>
            </div>
            <RangeInput label="버프 수치" icon={<Zap size={14}/>} field="buffAmount" min={1} max={200} step={1} unit="%" />
            <RangeInput label="지속 시간" icon={<Clock size={14}/>} field="buffDuration" min={10} max={600} step={10} unit=" 초" />
            <RangeInput label="리젠 시간" icon={<Clock size={14}/>} field="respawnTime" min={10} max={1800} step={10} unit=" 초" />
          </>
        );
      case 'tower':
        return (
          <>
            <RangeInput label="최대 체력" icon={<Heart size={14}/>} field="hp" min={1} max={50000} step={100} unit=" HP" />
            <RangeInput label="방어력" icon={<Shield size={14}/>} field="armor" min={0} max={500} step={1} unit=" DEF" />
            <RangeInput label="파괴 보상" icon={<Coins size={14}/>} field="rewardGold" min={0} max={1000} step={10} unit=" G" />
          </>
        );
      default: return null;
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter:'blur(5px)', padding:'20px' }}>

      {/* 스타일 태그 주입 */}
      <style>{sliderStyle}</style>

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