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
      setStats(JSON.parse(JSON.stringify(hero.stats)));
      setSkills(JSON.parse(JSON.stringify(hero.skills)));
    }
  }, [hero]);

  if (!hero || !stats || !skills) return null;

  const handleSave = () => {
    const r = hero.record;
    
    // 1. 과거 기록 압축 (Soft Reset) - 기존 데이터의 20% 비중만 남김
    const COMPRESSION_RATIO = 0.2; 
    const newTotalMatches = Math.max(100, Math.floor(r.totalMatches * COMPRESSION_RATIO));
    
    // 기존 승률 유지
    const winRate = r.totalMatches > 0 ? r.totalWins / r.totalMatches : 0.5;
    const newTotalWins = Math.floor(newTotalMatches * winRate);

    // 2. [핵심 수정] 최근 전적(Trend)에 가상 데이터 주입
    // 빈 배열([])로 두면 승률이 50%로 튀어버리므로, 기존 승률 패턴을 반영한 더미 데이터 20개를 넣음
    const newRecentResults: boolean[] = [];
    for (let i = 0; i < 20; i++) {
        // winRate 확률로 승리(true) 주입
        newRecentResults.push(Math.random() < winRate);
    }

    const updatedRecord = {
        ...r,
        totalMatches: newTotalMatches,
        totalWins: newTotalWins,
        // 픽/밴 등 기타 통계도 압축
        totalPicks: Math.floor(r.totalPicks * COMPRESSION_RATIO),
        totalBans: Math.floor(r.totalBans * COMPRESSION_RATIO),
        totalDamage: r.totalDamage * COMPRESSION_RATIO,
        totalDamageTaken: r.totalDamageTaken * COMPRESSION_RATIO,
        totalCs: r.totalCs * COMPRESSION_RATIO,
        totalGold: r.totalGold * COMPRESSION_RATIO,
        totalKills: r.totalKills * COMPRESSION_RATIO,
        totalDeaths: r.totalDeaths * COMPRESSION_RATIO,
        totalAssists: r.totalAssists * COMPRESSION_RATIO,
        
        recentResults: newRecentResults
    };

    updateHero(hero.id, { stats, skills, record: updatedRecord });
    
    alert(`[${hero.name}] 패치 완료!\n통계가 소프트 리셋되어 승률 변화가 즉각 반영됩니다.`);
    onClose();
  };

  const handleStatChange = (field: string, value: number) => {
    setStats(prev => prev ? ({ ...prev, [field]: value }) : null);
  };

  const handleSkillChange = (key: string, field: string, value: any) => {
    setSkills(prev => {
      if (!prev) return null;
      return {
        ...prev,
        [key]: { ...prev[key as keyof HeroSkillSet], [field]: value }
      };
    });
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
        width: '100%', maxWidth: '500px', maxHeight: '90vh', display: 'flex', flexDirection: 'column',
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
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding:'5px' }}><X size={24}/></button>
        </div>
        <div style={{ display: 'flex', background: '#0d1117' }}>
          <TabButton id="skill" label="스킬" icon={<Zap size={14}/>} />
          <TabButton id="combat" label="전투" icon={<Swords size={14}/>} />
          <TabButton id="basic" label="기본" icon={<Shield size={14}/>} />
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {activeTab === 'skill' && <SkillEditor skills={skills} onChange={handleSkillChange} />}
          {activeTab === 'combat' && <StatEditor fields={['baseAtk', 'ad', 'ap', 'crit', 'pen', 'range']} stats={stats} onChange={handleStatChange} />}
          {activeTab === 'basic' && <StatEditor fields={['hp', 'mp', 'armor', 'regen', 'mpRegen', 'speed']} stats={stats} onChange={handleStatChange} />}
        </div>
        <div style={{ padding: '15px 20px', background: '#21262d', borderTop: '1px solid #30363d' }}>
          <button onClick={handleSave} style={{ 
            width: '100%', padding: '12px', background: '#238636', border: 'none', 
            borderRadius: '8px', color: '#fff', fontWeight: 'bold', fontSize:'14px',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            boxShadow: '0 4px 12px rgba(35, 134, 54, 0.2)'
          }}>
            <Save size={18}/> 패치 적용 (통계 보정됨)
          </button>
        </div>
      </div>
    </div>
  );
};
