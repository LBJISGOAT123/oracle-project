// ==========================================
// FILE PATH: /src/components/hero/PatchModal.tsx
// ==========================================

import React, { useState, useEffect } from 'react';
import { Hero, HeroStats, HeroSkillSet } from '../../types';
import { useGameStore } from '../../store/useGameStore';
import { X, Save, Sliders, Zap, Swords, Shield } from 'lucide-react';
import { GameIcon } from '../common/GameIcon';

import { SkillEditor } from './patch/SkillEditor';
import { StatEditor } from './patch/StatEditor';

interface Props { hero: Hero | null; onClose: () => void; }

export const PatchModal: React.FC<Props> = ({ hero, onClose }) => {
  const { updateHero } = useGameStore();
  const [activeTab, setActiveTab] = useState<'skill' | 'combat' | 'basic'>('skill');

  const [stats, setStats] = useState<HeroStats | null>(null);
  const [skills, setSkills] = useState<HeroSkillSet | null>(null);

  useEffect(() => {
    if (hero) {
      setStats({ ...hero.stats });
      setSkills({ ...hero.skills });
    }
  }, [hero]);

  if (!hero || !stats || !skills) return null;

  const handleSave = () => {
    updateHero(hero.id, { stats, skills });
    alert(`${hero.name} 밸런스 패치가 적용되었습니다.`);
    onClose();
  };

  const TabButton = ({ id, label, icon }: any) => (
    <button 
      onClick={() => setActiveTab(id)} 
      style={{ 
        flex: 1, padding: '12px', background: activeTab === id ? '#1f242e' : 'transparent', 
        border: 'none', borderBottom: activeTab === id ? '2px solid #58a6ff' : '1px solid #30363d', 
        color: activeTab === id ? '#58a6ff' : '#8b949e', fontWeight: 'bold', cursor: 'pointer',
        display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', fontSize:'13px',
        transition: '0.2s'
      }}
    >
      {icon} {label}
    </button>
  );

  return (
    <div className="modal-overlay" onClick={onClose} style={{ 
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', 
      display: 'flex', justifyContent: 'center', alignItems: 'center', 
      zIndex: 9999, backdropFilter: 'blur(5px)', padding:'20px'
    }}>

      <div onClick={e => e.stopPropagation()} style={{ 
        width: '100%', maxWidth: '500px', 
        maxHeight: '90vh',
        display: 'flex', flexDirection: 'column',
        background: '#161b22', borderRadius: '16px', border: '1px solid #30363d', 
        overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.6)'
      }}>

        <div style={{ padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#21262d', borderBottom: '1px solid #30363d' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <GameIcon id={hero.id} size={44} shape="rounded" />
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', color: '#fff' }}>{hero.name}</h3>
                <span style={{ fontSize:'10px', background:'#30363d', padding:'2px 6px', borderRadius:'4px', color:'#ccc' }}>{hero.role}</span>
              </div>
              <div style={{ fontSize: '12px', color: '#58a6ff', marginTop:'2px', display:'flex', alignItems:'center', gap:'4px' }}>
                <Sliders size={12}/> 밸런스 조정 중...
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding:'5px' }}>
            <X size={24}/>
          </button>
        </div>

        <div style={{ display: 'flex', background: '#0d1117' }}>
          <TabButton id="skill" label="스킬" icon={<Zap size={14}/>} />
          <TabButton id="combat" label="전투" icon={<Swords size={14}/>} />
          <TabButton id="basic" label="기본" icon={<Shield size={14}/>} />
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {activeTab === 'skill' && <SkillEditor skills={skills} onChange={(k, f, v) => setSkills({...skills, [k]: {...(skills as any)[k], [f]: v}})} />}

          {/* [수정] 전투 스탯: AD, AP, BaseAtk, Crit, Pen, Range */}
          {activeTab === 'combat' && <StatEditor fields={['baseAtk', 'ad', 'ap', 'crit', 'pen', 'range']} stats={stats} onChange={(f, v) => setStats({...stats, [f]: v})} />}

          {/* [수정] 기본 스탯: HP, MP, Armor, HP Regen, MP Regen, Speed */}
          {activeTab === 'basic' && <StatEditor fields={['hp', 'mp', 'armor', 'regen', 'mpRegen', 'speed']} stats={stats} onChange={(f, v) => setStats({...stats, [f]: v})} />}
        </div>

        <div style={{ padding: '15px 20px', background: '#21262d', borderTop: '1px solid #30363d' }}>
          <button onClick={handleSave} style={{ 
            width: '100%', padding: '12px', background: '#238636', border: 'none', 
            borderRadius: '8px', color: '#fff', fontWeight: 'bold', fontSize:'14px',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            boxShadow: '0 4px 12px rgba(35, 134, 54, 0.2)'
          }}>
            <Save size={18}/> 패치 사항 적용하기
          </button>
        </div>

      </div>
    </div>
  );
};