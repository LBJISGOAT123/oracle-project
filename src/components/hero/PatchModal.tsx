// ==========================================
// FILE PATH: /src/components/hero/PatchModal.tsx
// ==========================================
import React, { useState, useEffect, useRef } from 'react';
import { Hero, HeroStats, HeroSkillSet } from '../../types';
import { useGameStore } from '../../store/useGameStore';
import { X, Save, Edit2, Check, Upload, Trash2 } from 'lucide-react';
import { GameIcon } from '../common/GameIcon';

import { SkillEditor } from './patch/SkillEditor';
import { StatEditor } from './patch/StatEditor';

interface Props { hero: Hero | null; onClose: () => void; }

export const PatchModal: React.FC<Props> = ({ hero, onClose }) => {
  const { updateHero, setCustomImage, removeCustomImage } = useGameStore();
  const [activeTab, setActiveTab] = useState<'skill' | 'combat' | 'basic'>('skill');
  const [heroName, setHeroName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [stats, setStats] = useState<HeroStats | null>(null);
  const [skills, setSkills] = useState<HeroSkillSet | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (hero) {
      setHeroName(hero.name);
      setStats({ ...hero.stats });
      setSkills({ ...hero.skills });
    }
  }, [hero]);

  if (!hero || !stats || !skills) return null;

  const handleSave = () => {
    updateHero(hero.id, { name: heroName, stats, skills });
    alert(`${heroName} 패치 적용 완료!`);
    onClose();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setCustomImage(hero.id, reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', zIndex: 9999, backdropFilter: 'blur(8px)' }}>
      <div className="patch-modal" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '500px', background: '#0d1117', borderRadius: '24px 24px 0 0', border: '1px solid #30363d', height: '85vh', display: 'flex', flexDirection: 'column' }}>

        <header style={{ padding: '15px 20px', display: 'flex', justifyContent: 'space-between', background: '#161b22', borderRadius: '24px 24px 0 0', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            {/* 원본 이미지 업로드 UI 보존 */}
            <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => fileInputRef.current?.click()}>
              <GameIcon id={hero.id} size={50} fallback={<span style={{fontSize:'24px'}}>🧙‍♂️</span>} />
              <div style={{ position:'absolute', bottom:-5, right:-5, background:'#58a6ff', borderRadius:'50%', padding:'4px', border:'2px solid #161b22' }}>
                <Upload size={10} color="#000" />
              </div>
              <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleImageUpload} />
            </div>

            <div>
              {isEditingName ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#000', padding: '4px 10px', borderRadius: '8px', border: '1px solid #58a6ff' }}>
                  <input value={heroName} onChange={e=>setHeroName(e.target.value)} onBlur={()=>setIsEditingName(false)} autoFocus style={{ background: 'none', border: 'none', color: '#fff', fontWeight: 'bold', outline: 'none', width: '100px' }}/>
                  <Check size={16} color="#2ecc71" onClick={()=>setIsEditingName(false)}/>
                </div>
              ) : (
                <h2 onClick={()=>setIsEditingName(true)} style={{ margin: 0, fontSize: '18px', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>{heroName} <Edit2 size={14}/></h2>
              )}
              <div style={{ display:'flex', gap:'8px', alignItems:'center', marginTop:'4px' }}>
                <span style={{ fontSize: '10px', color: '#8b949e' }}>{hero.role}</span>
                <button onClick={(e) => { e.stopPropagation(); removeCustomImage(hero.id); }} style={{ background:'none', border:'none', color:'#da3633', fontSize:'10px', cursor:'pointer', display:'flex', alignItems:'center', gap:'2px' }}>
                  <Trash2 size={10}/> 사진 삭제
                </button>
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: '#333', border: 'none', color: '#fff', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer' }}><X size={18}/></button>
        </header>

        {/* 탭 디자인 보존 */}
        <nav style={{ display: 'flex', background: '#161b22', borderBottom: '1px solid #30363d' }}>
          <button onClick={()=>setActiveTab('skill')} style={{ flex: 1, padding: '12px', background: 'none', border: 'none', color: activeTab === 'skill' ? '#58a6ff' : '#8b949e', borderBottom: activeTab === 'skill' ? '2px solid #58a6ff' : 'none', fontWeight: 'bold', cursor: 'pointer' }}>스킬</button>
          <button onClick={()=>setActiveTab('combat')} style={{ flex: 1, padding: '12px', background: 'none', border: 'none', color: activeTab === 'combat' ? '#58a6ff' : '#8b949e', borderBottom: activeTab === 'combat' ? '2px solid #58a6ff' : 'none', fontWeight: 'bold', cursor: 'pointer' }}>전투</button>
          <button onClick={()=>setActiveTab('basic')} style={{ flex: 1, padding: '12px', background: 'none', border: 'none', color: activeTab === 'basic' ? '#58a6ff' : '#8b949e', borderBottom: activeTab === 'basic' ? '2px solid #58a6ff' : 'none', fontWeight: 'bold', cursor: 'pointer' }}>기본</button>
        </nav>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {activeTab === 'skill' && <SkillEditor skills={skills} onChange={(k, f, v) => setSkills({...skills, [k]: {...(skills as any)[k], [f]: v}})} />}
          {/* [수정] combat 탭에 'range' 필드만 무결하게 추가 */}
          {activeTab === 'combat' && <StatEditor fields={['baseAtk', 'ad', 'ap', 'crit', 'range']} stats={stats} onChange={(f, v) => setStats({...stats, [f]: v})} />}
          {activeTab === 'basic' && <StatEditor fields={['hp', 'armor', 'speed']} stats={stats} onChange={(f, v) => setStats({...stats, [f]: v})} />}
        </div>

        <footer style={{ padding: '20px', background: '#161b22', borderTop: '1px solid #30363d' }}>
          <button onClick={handleSave} style={{ width: '100%', padding: '15px', background: '#238636', border: 'none', borderRadius: '12px', color: '#fff', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><Save size={18}/> 패치 적용하기</button>
        </footer>
      </div>
    </div>
  );
};