import React from 'react';
import { Clock } from 'lucide-react';

interface RangeProps {
  label: string;
  icon?: React.ReactNode;
  value: number;
  onChange: (val: number) => void;
  min: number; max: number; step?: number;
  unit?: string;
  color?: string;
}

export const RangeInput: React.FC<RangeProps> = ({ label, icon, value, onChange, min, max, step = 1, unit = '', color = '#58a6ff' }) => (
  <div style={{ marginBottom: '25px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '13px', color: '#ccc' }}>
      <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>{icon} {label}</div>
      <span style={{ fontWeight: 'bold', color: color, fontFamily:'monospace', fontSize:'15px' }}>
        {value?.toLocaleString()}{unit}
      </span>
    </div>
    <div style={{ padding: '0 5px' }}>
      <input 
        type="range" min={min} max={max} step={step} 
        value={value || 0} 
        onChange={(e) => onChange(Number(e.target.value))} 
        style={{ width:'100%', accentColor: color, cursor:'pointer' }}
      />
    </div>
  </div>
);

export const TimeInput: React.FC<Omit<RangeProps, 'icon' | 'unit'>> = ({ label, value, onChange, min = 0, max = 3600, step = 10, color = '#ccc' }) => (
  <div style={{ marginBottom: '25px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '13px', color: '#ccc' }}>
      <div style={{ display:'flex', alignItems:'center', gap:'6px' }}><Clock size={14}/> {label}</div>
      <span style={{ fontWeight: 'bold', color: color, fontFamily:'monospace', fontSize:'15px' }}>
        {Math.floor(value / 60)}분 {value % 60}초
      </span>
    </div>
    <input 
      type="range" min={min} max={max} step={step} 
      value={value || 0} 
      onChange={(e) => onChange(Number(e.target.value))} 
      style={{ width:'100%', accentColor: color, cursor:'pointer' }}
    />
  </div>
);
