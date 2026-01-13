// ==========================================
// FILE PATH: /src/components/battle/dashboard/GodPanel.tsx
// ==========================================
import React, { useState } from 'react';
import { useGameStore } from '../../../store/useGameStore';
import { GameIcon } from '../../common/GameIcon';
import { Crown, Camera, Crosshair, Shield, Heart, Monitor, Users } from 'lucide-react';
import { MinionCard } from './MinionCard';

const CustomSlider = ({ label, icon, value, min, max, step, onChange, color, suffix }: any) => (
  <div>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ccc', fontSize: '12px', fontWeight:'bold' }}>{icon} {label}</div>
      <span style={{ color: color, fontFamily: 'JetBrains Mono', fontWeight: '800', fontSize: '14px', background:`${color}11`, padding:'2px 6px', borderRadius:'4px' }}>
        {suffix === 'x' ? 'x' : ''}{value.toLocaleString()}{suffix !== 'x' ? suffix : ''}
      </span>
    </div>
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e)=>onChange(parseFloat(e.target.value))} style={{ width: '100%', accentColor: color, height: '6px', cursor: 'pointer', background: '#1c1c1f', borderRadius: '3px', outline: 'none' }} />
    </div>
  </div>
);

const SectionLabel = ({ icon, label, color }: any) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', fontWeight: '800', color: color, letterSpacing: '1px' }}>
    {icon} {label}
  </div>
);

const TechInput = ({ label, value, onChange, icon, unit }: any) => (
  <div style={{ background: '#0d1117', borderRadius: '12px', border: '1px solid #30363d', padding: '12px 15px', display: 'flex', flexDirection: 'column', gap: '6px', transition: 'all 0.2s' }}
  onMouseEnter={e => e.currentTarget.style.borderColor = '#58a6ff'} onMouseLeave={e => e.currentTarget.style.borderColor = '#30363d'}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#8b949e', fontWeight:'600' }}>{icon} {label}</div>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <input type="number" value={value} onChange={(e)=>onChange(Number(e.target.value))} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '18px', fontWeight: '800', outline: 'none', width: '100%', fontFamily: 'JetBrains Mono' }} />
      {unit && <span style={{ fontSize: '10px', color: '#555', fontWeight: 'bold' }}>{unit}</span>}
    </div>
  </div>
);

export const GodPanel = ({ side, settings, color, glowColor, onChange, icon }: any) => {
  const isRed = side === 'RED';
  const { setCustomImage } = useGameStore();
  const godId = isRed ? 'god_izman' : 'god_dante';
  const [isCrownHover, setIsCrownHover] = useState(false);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if(file) {
        const reader = new FileReader();
        reader.onloadend = () => { if(typeof reader.result === 'string') setCustomImage(godId, reader.result); };
        reader.readAsDataURL(file);
    }
  };

  return (
    <div style={{ background: 'linear-gradient(145deg, #121418 0%, #0d1117 100%)', borderRadius: '24px', border: `1px solid ${isRed ? '#4a1e1e' : '#1e3a5f'}`, boxShadow: `0 20px 40px rgba(0,0,0,0.3), inset 0 0 60px ${glowColor}`, overflow: 'hidden' }}>
      <div style={{ padding: '25px', borderBottom: `1px solid ${color}22`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: `linear-gradient(90deg, ${color}11, transparent)` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ position: 'relative' }}>
            <GameIcon id={godId} size={64} fallback={icon} border={`2px solid ${color}44`} shape="rounded" />
          </div>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'4px' }}>
              <span style={{ fontSize: '10px', fontWeight: '900', color: '#fff', background: color, padding:'2px 8px', borderRadius:'10px' }}>
                {side} FACTION
              </span>
            </div>
            <h3 style={{ margin: 0, fontSize: '24px', fontWeight: '900', color: '#fff', letterSpacing:'-0.5px' }}>{settings.name}</h3>
          </div>
        </div>
        <div onMouseEnter={() => setIsCrownHover(true)} onMouseLeave={() => setIsCrownHover(false)} style={{ position: 'relative' }}>
          <label style={{ cursor: 'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
            {isCrownHover && <span style={{ position: 'absolute', right: '45px', fontSize: '11px', color: color, fontWeight: 'bold', whiteSpace: 'nowrap', background: '#161b22', padding: '4px 8px', borderRadius: '4px', border: `1px solid ${color}44` }}>사진 변경</span>}
            <Crown size={32} color={color} style={{ opacity: isCrownHover ? 1 : 0.3, transform: isCrownHover ? 'scale(1.1) rotate(15deg)' : 'rotate(15deg)', transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }} />
            <div style={{ position: 'absolute', bottom: -2, right: -2, background: '#161b22', borderRadius: '50%', padding: '3px', border: `1px solid ${color}44`, opacity: isCrownHover ? 1 : 0.5 }}><Camera size={10} color={color}/></div>
            <input type="file" style={{display:'none'}} accept="image/*" onChange={handleUpload}/>
          </label>
        </div>
      </div>
      <div style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <CustomSlider label="전투 공격력 보정" icon={<Crosshair size={14}/>} value={settings.atkRatio} min={0.5} max={2.0} step={0.01} onChange={(v: number)=>onChange('atkRatio', v)} color={color} suffix="x" />
          <CustomSlider label="방어/체력 효율" icon={<Shield size={14}/>} value={settings.defRatio} min={0.5} max={2.0} step={0.01} onChange={(v: number)=>onChange('defRatio', v)} color={color} suffix="x" />
          <CustomSlider label="넥서스 최대 내구도" icon={<Heart size={14}/>} value={settings.hpRatio} min={5000} max={50000} step={1000} onChange={(v: number)=>onChange('hpRatio', v)} color={color} />
        </div>
        <div style={{ height: '1px', background: '#30363d' }} />
        <div>
          <SectionLabel icon={<Monitor size={12}/>} label="STRUCTURAL INTEGRITY" color="#8b949e" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop:'10px' }}>
            <TechInput label="수호자 생명력" value={settings.guardianHp} onChange={(v: number)=>onChange('guardianHp', v)} icon={<Crown size={14} color={color}/>} unit="HP" />
            <TechInput label="방어 타워 위력" value={settings.towerAtk} onChange={(v: number)=>onChange('towerAtk', v)} icon={<Crosshair size={14} color={color}/>} unit="DMG" />
          </div>
        </div>
        <div>
          <SectionLabel icon={<Users size={12}/>} label="MINION WAVES" color="#8b949e" />
          <div style={{ marginTop:'10px' }}>
            {settings.minions && (
              <>
                <MinionCard type="melee" data={settings.minions.melee} color={color} onChange={(t: string, f: string, v: number) => onChange('minions', { ...settings.minions, [t]: { ...settings.minions[t], [f]: v } })} />
                <MinionCard type="ranged" data={settings.minions.ranged} color={color} onChange={(t: string, f: string, v: number) => onChange('minions', { ...settings.minions, [t]: { ...settings.minions[t], [f]: v } })} />
                <MinionCard type="siege" data={settings.minions.siege} color={color} onChange={(t: string, f: string, v: number) => onChange('minions', { ...settings.minions, [t]: { ...settings.minions[t], [f]: v } })} />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
