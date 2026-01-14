// ==========================================
// FILE PATH: /src/components/hero/GrowthSettingModal.tsx
// ==========================================
import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { X, Save, TrendingUp, Heart, Sword, Shield, Zap, Activity, Clock, RotateCcw } from 'lucide-react';
import { GrowthIntervals } from '../../types';

const PerfectSlider = ({ value, min, max, onChange, color }: { value: number, min: number, max: number, onChange: (val: number) => void, color: string }) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const percent = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation();
    (e.target as Element).setPointerCapture(e.pointerId);
    setActive(true);
  };
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!active || !trackRef.current) return;
    e.preventDefault();
    const rect = trackRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    let ratio = x / rect.width;
    ratio = Math.max(0, Math.min(1, ratio));
    const newValue = Math.round(min + ratio * (max - min));
    if (newValue !== value) onChange(newValue);
  };
  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setActive(false);
    (e.target as Element).releasePointerCapture(e.pointerId);
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'none' }}>
      <div ref={trackRef} style={{ width: '100%', height: '6px', background: '#30363d', borderRadius: '3px', position: 'relative' }}>
        <div style={{ width: `${percent}%`, height: '100%', background: color, borderRadius: '3px' }} />
      </div>
      <div onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp}
        style={{ position: 'absolute', left: `${percent}%`, width: '28px', height: '28px', borderRadius: '50%', background: '#fff', border: `2px solid ${color}`, boxShadow: '0 2px 5px rgba(0,0,0,0.5)', transform: 'translate(-50%, 0)', cursor: 'grab', zIndex: 10, touchAction: 'none' }}
      >
        {active && <div style={{ position:'absolute', inset: -6, borderRadius:'50%', border: `2px solid ${color}`, opacity: 0.5 }}/>}
      </div>
    </div>
  );
};

interface Props { onClose: () => void; }

export const GrowthSettingModal: React.FC<Props> = ({ onClose }) => {
  const { gameState, updateGrowthSettings } = useGameStore();
  const [localSettings, setLocalSettings] = useState({ ...gameState.growthSettings });
  
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleChange = (stat: keyof typeof localSettings, period: keyof GrowthIntervals, val: number) => {
    setLocalSettings(prev => ({ ...prev, [stat]: { ...prev[stat as any], [period]: val } }));
  };

  const handleSimpleChange = (field: string, val: number) => {
    setLocalSettings(prev => ({ ...prev, [field]: val }));
  };

  const handleSave = () => {
    updateGrowthSettings(localSettings);
    alert('✅ 설정이 저장되었습니다.\n다음 시뮬레이션부터 적용됩니다.');
    onClose();
  };

  const StatRow = ({ label, icon, statKey, color }: { label: string, icon: any, statKey: string, color: string }) => {
    const data = (localSettings as any)[statKey] as GrowthIntervals;
    const renderSlider = (title: string, period: keyof GrowthIntervals) => (
      <div style={{ flex: 1 }}>
        <div style={{ fontSize:'11px', color:'#aaa', marginBottom:'0px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span>{title}</span>
            <span style={{ color: color, fontWeight:'bold', fontFamily:'monospace', fontSize:'14px' }}>{data[period]}%</span>
        </div>
        <PerfectSlider min={0} max={30} value={data[period]} onChange={(val) => handleChange(statKey as any, period, val)} color={color} />
      </div>
    );
    return (
      <div style={{ marginBottom: '15px', background:'#1f242e', padding:'15px', borderRadius:'8px', border:'1px solid #30363d' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'6px', color: color, fontWeight:'bold', fontSize:'13px', marginBottom:'12px' }}>{icon} {label}</div>
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? '12px' : '20px' }}>
          {renderSlider("초반 (Lv.1~6)", "early")}
          {renderSlider("중반 (Lv.7~12)", "mid")}
          {renderSlider("후반 (Lv.13~)", "late")}
        </div>
      </div>
    );
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', zIndex:9999, display:'flex', justifyContent:'center', alignItems:'center', padding: isMobile ? '0' : '10px' }}>
      <div style={{ width:'100%', maxWidth:'600px', height: isMobile ? '100%' : 'auto', background:'#161b22', border: isMobile ? 'none' : '1px solid #30363d', borderRadius: isMobile ? '0' : '12px', overflow:'hidden', display:'flex', flexDirection:'column', maxHeight:'95vh' }}>
        
        <div style={{ padding:'15px', background:'#21262d', borderBottom:'1px solid #30363d', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <h3 style={{ margin:0, color:'#fff', fontSize:'16px', display:'flex', alignItems:'center', gap:'8px' }}><TrendingUp size={18} color="#2ecc71"/> 게임 밸런스 설정</h3>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#888', cursor:'pointer', padding:'5px' }}><X size={24}/></button>
        </div>

        <div style={{ padding:'15px', overflowY:'auto', flex:1, WebkitOverflowScrolling: 'touch' }}>
          
          {/* 1. 게임 규칙 설정 */}
          <div style={{ marginBottom:'25px' }}>
            <h4 style={{ margin:'0 0 10px 0', fontSize:'13px', color:'#ccc', borderBottom:'1px solid #333', paddingBottom:'5px' }}>게임 규칙 (Game Rules)</h4>
            <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:'15px' }}>
                <div style={{ background:'#0d1117', padding:'12px', borderRadius:'8px', border:'1px solid #30363d' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'8px' }}>
                        <span style={{ fontSize:'12px', color:'#ccc', display:'flex', gap:'4px', alignItems:'center' }}><Clock size={12}/> 레벨당 부활시간 계수</span>
                        <span style={{ fontSize:'13px', fontWeight:'bold', color:'#f1c40f' }}>x{localSettings.respawnPerLevel}</span>
                    </div>
                    {/* 계수는 1~10까지 */}
                    <PerfectSlider min={1} max={10} value={localSettings.respawnPerLevel} onChange={(v)=>handleSimpleChange('respawnPerLevel', v)} color="#f1c40f" />
                    <div style={{ fontSize:'10px', color:'#666', marginTop:'4px' }}>
                      (기본: 3.0, 후반 페널티 별도 적용)
                    </div>
                </div>
                <div style={{ background:'#0d1117', padding:'12px', borderRadius:'8px', border:'1px solid #30363d' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'8px' }}>
                        <span style={{ fontSize:'12px', color:'#ccc', display:'flex', gap:'4px', alignItems:'center' }}><RotateCcw size={12}/> 귀환 소요시간</span>
                        <span style={{ fontSize:'13px', fontWeight:'bold', color:'#3498db' }}>{localSettings.recallTime}초</span>
                    </div>
                    {/* 귀환시간은 1~20초까지 */}
                    <PerfectSlider min={1} max={20} value={localSettings.recallTime} onChange={(v)=>handleSimpleChange('recallTime', v)} color="#3498db" />
                </div>
            </div>
          </div>

          {/* 2. 성장 밸런스 */}
          <h4 style={{ margin:'0 0 10px 0', fontSize:'13px', color:'#ccc', borderBottom:'1px solid #333', paddingBottom:'5px' }}>구간별 성장 (Growth Curve)</h4>
          <StatRow label="공격력 (AD)" icon={<Sword size={14}/>} statKey="ad" color="#e74c3c" />
          <StatRow label="주문력 (AP)" icon={<Zap size={14}/>} statKey="ap" color="#9b59b6" />
          <StatRow label="최대 체력 (HP)" icon={<Heart size={14}/>} statKey="hp" color="#2ecc71" />
          <StatRow label="방어력 (Armor)" icon={<Shield size={14}/>} statKey="armor" color="#3498db" />
          <StatRow label="기본 공격 (Base)" icon={<Sword size={14}/>} statKey="baseAtk" color="#777" />
          <StatRow label="체력 재생 (Regen)" icon={<Activity size={14}/>} statKey="regen" color="#2ecc71" />
        </div>

        <div style={{ padding:'15px', borderTop:'1px solid #30363d', display:'flex', gap:'10px', background:'#161b22', paddingBottom: isMobile ? '30px' : '15px' }}>
          <button onClick={onClose} style={{ flex:1, background:'transparent', border:'1px solid #444', color:'#ccc', padding:'12px', borderRadius:'8px', fontWeight:'bold', cursor:'pointer' }}>닫기</button>
          <button onClick={handleSave} style={{ flex:2, background:'#238636', border:'none', color:'#fff', padding:'12px', borderRadius:'8px', fontWeight:'bold', cursor:'pointer', display:'flex', justifyContent:'center', alignItems:'center', gap:'6px' }}>
            <Save size={18}/> 설정 저장
          </button>
        </div>
      </div>
    </div>
  );
};
