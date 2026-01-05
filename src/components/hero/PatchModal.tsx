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
    // -------------------------------------------------------------
    // [핵심 수정] 소프트 리셋 (Soft Reset) 적용
    // 패치를 적용하면 과거 데이터의 무게감을 줄여서, 
    // 앞으로의 변화가 승률에 빠르게 반영되도록 합니다.
    // -------------------------------------------------------------
    const r = hero.record;
    
    // 과거 기록을 20% 수준으로 압축 (승률은 유지하되, 판수를 줄임)
    // 예: 10,000판 -> 2,000판으로 취급
    const COMPRESSION_RATIO = 0.2; 
    
    // 최소 500판은 유지 (너무 가벼워져서 널뛰는 것 방지)
    const newTotalMatches = Math.max(500, Math.floor(r.totalMatches * COMPRESSION_RATIO));
    
    // 승률 유지 계산
    const winRate = r.totalMatches > 0 ? r.totalWins / r.totalMatches : 0.5;
    const newTotalWins = Math.floor(newTotalMatches * winRate);

    // [중요] 최근 전적(Trend)은 패치 이전 데이터이므로 싹 비워버립니다.
    // 그래야 패치 이후의 데이터로만 트렌드가 다시 쌓입니다.
    const newRecentResults: boolean[] = [];

    const updatedRecord = {
        ...r,
        totalMatches: newTotalMatches,
        totalWins: newTotalWins,
        // 픽/밴 횟수도 비율만큼 줄여줌 (인기 순위도 리셋 효과)
        totalPicks: Math.floor(r.totalPicks * POPULARITY_RATIO),
        totalBans: Math.floor(r.totalBans * POPULARITY_RATIO),
        // 데미지 등 누적 데이터도 압축
        totalDamage: r.totalDamage * COMPRESSION_RATIO,
        totalDamageTaken: r.totalDamageTaken * COMPRESSION_RATIO,
        totalCs: r.totalCs * COMPRESSION_RATIO,
        totalGold: r.totalGold * COMPRESSION_RATIO,
        totalKills: r.totalKills * COMPRESSION_RATIO,
        totalDeaths: r.totalDeaths * COMPRESSION_RATIO,
        totalAssists: r.totalAssists * COMPRESSION_RATIO,
        
        recentResults: newRecentResults
    };

    // 업데이트 실행
    updateHero(hero.id, { stats, skills, record: updatedRecord });
    
    alert(`${hero.name} 밸런스 패치 완료!\n통계 데이터가 '소프트 리셋'되어 승률 변화가 빨라집니다.`);
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
            <Save size={18}/> 패치 적용 (통계 리셋됨)
          </button>
        </div>

      </div>
    </div>
  );
};