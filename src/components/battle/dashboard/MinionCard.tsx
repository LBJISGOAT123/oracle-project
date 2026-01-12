import React from 'react';
import { Sword, Shield, Heart, Zap, Crosshair, Coins } from 'lucide-react';

export const MinionCard = ({ type, data, onChange, color }: any) => {
  let typeIcon = <Sword size={14} />;
  let typeLabel = "근거리";
  if (type === 'ranged') { typeIcon = <Crosshair size={14}/>; typeLabel = "원거리"; }
  if (type === 'siege') { typeIcon = <Shield size={14}/>; typeLabel = "공성"; }

  return (
    <div style={{ background: 'rgba(0,0,0,0.3)', border: \`1px solid \${color}33\`, borderRadius: '8px', padding: '10px', marginBottom: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', borderBottom:\`1px dashed \${color}33\`, paddingBottom:'5px' }}>
        <div style={{ fontWeight: 'bold', color: color, fontSize: '13px', display:'flex', alignItems:'center', gap:'6px' }}>{typeIcon} {data.label}</div>
        <span style={{ fontSize: '10px', color: '#666', background:'rgba(255,255,255,0.05)', padding:'2px 6px', borderRadius:'4px' }}>{typeLabel} TYPE</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom:'8px' }}>
        <MiniInput label="체력" icon={<Heart size={10} color="#2ecc71"/>} value={data.hp} onChange={(v:number) => onChange(type, 'hp', v)} />
        <MiniInput label="방어" icon={<Shield size={10} color="#3498db"/>} value={data.def} onChange={(v:number) => onChange(type, 'def', v)} />
        <MiniInput label="공격" icon={<Sword size={10} color="#e74c3c"/>} value={data.atk} onChange={(v:number) => onChange(type, 'atk', v)} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <MiniInput label="골드" icon={<Coins size={10} color="#f1c40f"/>} value={data.gold} onChange={(v:number) => onChange(type, 'gold', v)} />
        <MiniInput label="경험치" icon={<Zap size={10} color="#9b59b6"/>} value={data.xp} onChange={(v:number) => onChange(type, 'xp', v)} />
      </div>
    </div>
  );
};

const MiniInput = ({ label, icon, value, onChange }: any) => (
  <div style={{ background: '#0d1117', border: '1px solid #30363d', borderRadius: '4px', padding: '4px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#888' }}>{icon} {label}</div>
    <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} style={{ width: '40px', background: 'transparent', border: 'none', color: '#fff', fontSize: '11px', fontWeight: 'bold', textAlign: 'right', outline: 'none', padding: 0 }} />
  </div>
);
