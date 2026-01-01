// ==========================================
// FILE PATH: /src/components/battle/BattlefieldTab.tsx
// ==========================================

import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { Shield, Skull, Circle, Coins, Heart, Zap, Swords, Bot, Timer, Ghost, Layers, Gem, AlertTriangle, Sword } from 'lucide-react';
import { JUNGLE_CONFIG } from '../../data/jungle';

export const BattlefieldTab: React.FC = () => {
  const { gameState, updateFieldSettings } = useGameStore();
  const settings = gameState.fieldSettings;

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!settings) return <div>설정 로딩 중...</div>;

  const handleChange = (target: string, field: string, value: any) => {
    // @ts-ignore
    updateFieldSettings({ [target]: { ...settings[target], [field]: value } });
  };

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))', 
      gap: '20px', 
      paddingBottom: '80px' 
    }}>

      {/* 1. 혼돈의 균열 (공격력/방어력 분리 적용) */}
      <ObjectConfigCard 
        title={JUNGLE_CONFIG.NAME}
        description={JUNGLE_CONFIG.DESCRIPTION}
        icon={<Ghost size={20} color="#d580ff"/>}
        color="#d580ff"
        isJungle={true}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <InputSlider 
            label="생태계 밀도 (리젠율)" 
            icon={<Layers size={14}/>} 
            value={settings.jungle?.density ?? 50} 
            min={0} max={100} step={1} 
            onChange={(v: number) => handleChange('jungle', 'density', v)} 
            color="#d580ff" 
            unit="%"
          />

          {/* [신규] 크리처 공격력 */}
          <InputSlider 
            label="크리처 공격력 (아픔)" 
            icon={<Sword size={14}/>} 
            value={settings.jungle?.attack ?? 30} 
            min={0} max={100} step={1} 
            onChange={(v: number) => handleChange('jungle', 'attack', v)} 
            color="#ff4d4d" 
            unit="Atk"
          />

          {/* [신규] 크리처 방어력 */}
          <InputSlider 
            label="크리처 방어력 (단단함)" 
            icon={<Shield size={14}/>} 
            value={settings.jungle?.defense ?? 20} 
            min={0} max={100} step={1} 
            onChange={(v: number) => handleChange('jungle', 'defense', v)} 
            color="#3498db" 
            unit="Def"
          />

          <InputSlider 
            label="자원 풍요도 (보상)" 
            icon={<Gem size={14}/>} 
            value={settings.jungle?.yield ?? 50} 
            min={0} max={100} step={1} 
            onChange={(v: number) => handleChange('jungle', 'yield', v)} 
            color="#f1c40f" 
            unit="Gold"
          />
        </div>
        <div style={{ marginTop:'15px', padding:'10px', background:'#2a1a36', borderRadius:'6px', fontSize:'11px', color:'#d580ff', lineHeight:'1.4' }}>
          * 공격력이 높으면 정글러 체력 관리가 힘들고, 방어력이 높으면 성장 속도가 느려집니다.
        </div>
      </ObjectConfigCard>

      {/* 2. 거신병 등 나머지 카드들은 기존 유지 */}
      <ObjectConfigCard 
        title="거신병 (Colossus)" 
        description="고대 문명의 병기입니다. 파괴한 진영은 이 병기를 해킹하여 적의 포탑을 철거하는 데 사용합니다."
        icon={<Skull size={20} color="#7ee787"/>}
        color="#7ee787"
        data={settings.colossus}
        onChange={(f: string, v: any) => handleChange('colossus', f, v)}
      >
        <InputSlider label="최대 체력 (HP)" icon={<Heart size={14}/>} value={settings.colossus.hp} min={1000} max={50000} step={100} onChange={(v:number) => handleChange('colossus', 'hp', v)} color="#7ee787" />
        <InputSlider label="방어력 (Armor)" icon={<Shield size={14}/>} value={settings.colossus.armor} min={0} max={500} step={1} onChange={(v:number) => handleChange('colossus', 'armor', v)} color="#7ee787" />
        <InputSlider label="기본 보상 (Gold)" icon={<Coins size={14}/>} value={settings.colossus.rewardGold} min={0} max={1000} step={10} onChange={(v:number) => handleChange('colossus', 'rewardGold', v)} color="#e89d40" />
        <div style={{ borderTop: '1px dashed #333', paddingTop: '15px', marginTop: '10px' }}>
          <div style={{ fontSize: '12px', color: '#7ee787', fontWeight: 'bold', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Bot size={14}/> 소환수 능력치 설정
          </div>
          <InputSlider label="공성 공격력" icon={<Swords size={12}/>} value={settings.colossus.attack} min={10} max={200} step={1} onChange={(v:number) => handleChange('colossus', 'attack', v)} color="#7ee787" />
        </div>
      </ObjectConfigCard>

      {/* 3. 공허의 주시자 */}
      <ObjectConfigCard 
        title="공허의 주시자" 
        description="차원의 눈을 가진 절대자입니다. 처치 시 아군 전체에게 강력한 버프를 부여합니다."
        icon={<Circle size={20} color="#a371f7"/>}
        color="#a371f7"
        data={settings.watcher}
        onChange={(f: string, v: any) => handleChange('watcher', f, v)}
      >
        <InputSlider label="최대 체력 (HP)" icon={<Heart size={14}/>} value={settings.watcher.hp} min={1000} max={50000} step={100} onChange={(v:number) => handleChange('watcher', 'hp', v)} color="#a371f7" />
        <InputSlider label="방어력 (Armor)" icon={<Shield size={14}/>} value={settings.watcher.armor} min={0} max={500} step={1} onChange={(v:number) => handleChange('watcher', 'armor', v)} color="#a371f7" />
        <InputSlider label="기본 보상 (Gold)" icon={<Coins size={14}/>} value={settings.watcher.rewardGold} min={0} max={1000} step={10} onChange={(v:number) => handleChange('watcher', 'rewardGold', v)} color="#e89d40" />
        <div style={{ borderTop: '1px dashed #333', paddingTop: '15px', marginTop: '10px' }}>
          <div style={{ fontSize: '12px', color: '#a371f7', fontWeight: 'bold', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Zap size={14}/> 처치 버프 설정
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display:'block', fontSize:'11px', color:'#8b949e', marginBottom:'5px' }}>버프 효과</label>
            <select 
              value={settings.watcher.buffType} 
              onChange={(e) => handleChange('watcher', 'buffType', e.target.value)}
              style={{ width:'100%', background:'#0d1117', border:'1px solid #30363d', color:'#fff', padding:'8px', borderRadius:'4px' }}
            >
              <option value="COMBAT">⚔️ 전투력 강화 (승률 상승)</option>
              <option value="GOLD">💰 황금의 손 (골드 획득량 증가)</option>
            </select>
          </div>
          <InputSlider label="효과 수치 (%)" icon={<Zap size={12}/>} value={settings.watcher.buffAmount} min={5} max={100} step={1} onChange={(v:number) => handleChange('watcher', 'buffAmount', v)} color="#a371f7" />
          <div style={{ height:'10px' }}></div>
          <InputSlider label="지속 시간 (초)" icon={<Timer size={12}/>} value={settings.watcher.buffDuration} min={60} max={600} step={10} onChange={(v:number) => handleChange('watcher', 'buffDuration', v)} color="#a371f7" />
        </div>
      </ObjectConfigCard>

      {/* 4. 포탑 */}
      <ObjectConfigCard 
        title="방어 포탑" 
        description="각 라인을 지키는 마법 구조물입니다. 적의 진격을 저지하는 1차 방어선입니다."
        icon={<Shield size={20} color="#58a6ff"/>}
        color="#58a6ff"
        data={settings.tower}
        onChange={(f: string, v: any) => handleChange('tower', f, v)}
      >
        <InputSlider label="최대 체력 (HP)" icon={<Heart size={14}/>} value={settings.tower.hp} min={1000} max={10000} step={100} onChange={(v:number) => handleChange('tower', 'hp', v)} color="#58a6ff" />
        <InputSlider label="방어력 (Armor)" icon={<Shield size={14}/>} value={settings.tower.armor} min={0} max={500} step={1} onChange={(v:number) => handleChange('tower', 'armor', v)} color="#58a6ff" />
        <InputSlider label="기본 보상 (Gold)" icon={<Coins size={14}/>} value={settings.tower.rewardGold} min={0} max={500} step={10} onChange={(v:number) => handleChange('tower', 'rewardGold', v)} color="#e89d40" />
      </ObjectConfigCard>

    </div>
  );
};

const ObjectConfigCard = ({ title, description, icon, color, data, onChange, children, isJungle }: any) => {
  return (
    <div style={{ 
      background: '#161b22', borderRadius: '12px', border: `1px solid ${color}44`, 
      overflow: 'hidden', display:'flex', flexDirection:'column',
      boxShadow: `0 4px 20px -5px ${color}11`
    }}>
      <div style={{ padding: '15px', background: `${color}11`, borderBottom: `1px solid ${color}22` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          {icon}
          <h3 style={{ margin: 0, fontSize: '16px', color: '#fff' }}>{title}</h3>
        </div>
        <div style={{ fontSize: '12px', color: '#ccc', fontStyle: 'italic', lineHeight: '1.4', opacity: 0.8 }}>
          "{description}"
        </div>
      </div>

      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', flex:1 }}>
        {children}
      </div>
    </div>
  );
};

const InputSlider = ({ label, icon, value, min, max, step, onChange, color, unit }: any) => (
  <div>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px', color: '#8b949e' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>{icon} {label}</div>
      <span style={{ fontWeight: 'bold', color: '#fff', fontFamily: 'monospace' }}>
        {value.toLocaleString()}{unit ? ` ${unit}` : ''}
      </span>
    </div>
    <input 
      type="range" min={min} max={max} step={step} value={value} 
      onChange={(e) => onChange(Number(e.target.value))}
      style={{ width: '100%', accentColor: color, cursor: 'pointer', height: '6px', background: '#30363d', borderRadius: '3px' }} 
    />
  </div>
);