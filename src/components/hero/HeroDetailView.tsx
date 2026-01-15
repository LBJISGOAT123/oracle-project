import React, { useState, useEffect, useMemo } from 'react';
import { Hero } from '../../types';
import { useGameStore } from '../../store/useGameStore';
import { ROLE_DATA } from '../../data/roles';
import { 
  X, Wrench, Edit, Swords, Shield, Zap, Target, Heart, Footprints, Crosshair, Droplets, Flame, Trash, BarChart2, Search, Activity
} from 'lucide-react';
import { GameIcon } from '../common/GameIcon';
import { CustomizeHeroModal } from './CustomizeHeroModal';
import { HeroVsModal } from './HeroVsModal';

import { SkillAnalysisPanel } from './detail/SkillAnalysisPanel';
import { ItemBuildAnalysis } from './detail/ItemBuildAnalysis';
import { GrowthStatsPanel } from './detail/GrowthStatsPanel';
import { SummaryOverview } from './detail/SummaryOverview';

interface Props {
  hero: Hero;
  onBack: () => void;
  onPatch: () => void;
}

const HeroSpecItem = ({ icon, label, value, color }: any) => (
  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'#161b22', padding:'6px 10px', borderRadius:'6px', border:'1px solid #30363d', minWidth:'80px' }}>
    <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
      {React.cloneElement(icon, { size: 12, color: color })}
      <span style={{ fontSize:'10px', color:'#aaa', fontWeight:'bold' }}>{label}</span>
    </div>
    <span style={{ fontSize:'12px', fontWeight:'900', color:'#fff', fontFamily:'monospace' }}>{value}</span>
  </div>
);

const TabButton = ({ id, label, icon, activeTab, onClick }: any) => (
  <button 
    onClick={() => onClick(id)}
    style={{ 
      flex: 1, display:'flex', alignItems:'center', justifyContent:'center', gap:'4px',
      padding: '12px 0',
      background: activeTab === id ? 'rgba(88, 166, 255, 0.2)' : 'rgba(0,0,0,0.6)',
      border: 'none', borderBottom: activeTab === id ? '3px solid #58a6ff' : '3px solid transparent',
      color: activeTab === id ? '#58a6ff' : '#aaa', fontWeight:'bold', cursor:'pointer', transition:'0.2s',
      fontSize: '11px', whiteSpace: 'nowrap'
    }}
  >
    {React.cloneElement(icon, { size: 14 })} {label}
  </button>
);

export const HeroDetailView: React.FC<Props> = ({ hero, onBack, onPatch }) => {
  const { heroes, gameState, deleteHero } = useGameStore();
  const [activeTab, setActiveTab] = useState<'SUMMARY' | 'COUNTER' | 'COMBAT' | 'BUILD'>('SUMMARY');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showCustomize, setShowCustomize] = useState(false);

  const [selectedEnemy, setSelectedEnemy] = useState<Hero | null>(null);
  const [enemySearch, setEnemySearch] = useState('');

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const roleInfo = ROLE_DATA[hero.role];
  const bgId = `${hero.id}_bg`;
  const customBg = gameState.customImages?.[bgId];
  const displayConcept = hero.concept || roleInfo.concept;

  const handleDelete = () => {
    if (confirm(`정말 '${hero.name}' 영웅을 삭제하시겠습니까?`)) {
      deleteHero(hero.id);
      onBack();
    }
  };
  
  const enemyList = useMemo(() => {
    return heroes
      .filter(h => h.id !== hero.id && h.name.includes(enemySearch))
      .sort((a, b) => b.recentWinRate - a.recentWinRate);
  }, [heroes, hero.id, enemySearch]);

  const renderContent = () => {
    switch(activeTab) {
        case 'SUMMARY':
            return <SummaryOverview hero={hero} isMobile={isMobile} />;
        case 'COUNTER':
            return (
              <div style={{ background: '#1c1c1f', padding: '15px', borderRadius: '12px', border: '1px solid #333', minHeight:'400px' }}>
                <div style={{ display:'flex', gap:'10px', marginBottom:'15px', background:'#252528', padding:'10px', borderRadius:'8px' }}>
                  <Search size={16} color="#888"/>
                  <input type="text" placeholder="비교할 영웅 이름 검색..." value={enemySearch} onChange={(e) => setEnemySearch(e.target.value)} style={{ background:'none', border:'none', color:'#fff', outline:'none', width:'100%', fontWeight:'bold', fontSize:'13px' }} />
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                  {enemyList.map(enemy => (
                    <div key={enemy.id} onClick={() => setSelectedEnemy(enemy)} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'10px', background:'#252528', borderRadius:'8px', cursor:'pointer' }}>
                      <GameIcon id={enemy.id} size={36} shape="rounded" />
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:'bold', color:'#fff', fontSize:'13px' }}>{enemy.name}</div>
                        <div style={{ fontSize:'11px', color:'#888' }}>{enemy.role}</div>
                      </div>
                      <div style={{ fontSize:'12px', fontWeight:'bold', color: enemy.recentWinRate >= 50 ? '#ff4d4d' : '#888' }}>{enemy.recentWinRate.toFixed(1)}%</div>
                    </div>
                  ))}
                </div>
              </div>
            );
        case 'COMBAT':
            return (
              <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>
                <SkillAnalysisPanel hero={hero} isMobile={isMobile} />
                <div style={{ height:'1px', background:'#333', margin:'5px 0' }} />
                <GrowthStatsPanel hero={hero} isMobile={isMobile} />
              </div>
            );
        case 'BUILD':
            return <ItemBuildAnalysis hero={hero} />;
        default:
            return null;
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)' }}>
      <div style={{ width: isMobile ? '100%' : '650px', height: isMobile ? '100%' : '90vh', backgroundColor: '#0d1117', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative', borderRadius: isMobile ? '0' : '16px', border: isMobile ? 'none' : '1px solid #30363d', boxShadow: '0 20px 60px rgba(0,0,0,0.8)' }}>

        {/* 배경 (포인터 이벤트 제거) */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundImage: customBg ? `url(${customBg})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center top', zIndex: 0, opacity: 0.6, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(to bottom, rgba(13,17,23,0.2) 0%, rgba(13,17,23,0.9) 50%, #0d1117 100%)', zIndex: 1, pointerEvents: 'none' }} />

        {/* 닫기 버튼 */}
        <div style={{ padding: '15px 20px', position: 'relative', zIndex: 10, display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onBack} style={{ background:'rgba(0,0,0,0.5)', border:'1px solid rgba(255,255,255,0.2)', color:'#fff', padding:'8px', borderRadius:'50%', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><X size={20}/></button>
        </div>

        {/* 메인 스크롤 영역 */}
        <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 10, scrollbarWidth:'none', paddingBottom:'50px' }}>

          {/* 1. 헤더 */}
          <div style={{ padding: '0 20px 20px 20px', display: 'flex', flexDirection: 'row', gap: '20px', alignItems: 'center' }}>
            <div style={{ flexShrink: 0 }}>
              <GameIcon id={hero.id} size={isMobile ? 100 : 120} shape="rounded" border={`3px solid ${roleInfo.color}`} />
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:'4px', flex: 1 }}>
              <h1 style={{ margin: 0, fontSize: isMobile ? '24px' : '32px', fontWeight: '900', color: '#fff', textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>{hero.name}</h1>
              <div style={{ display:'flex', gap:'6px', alignItems:'center', marginTop:'4px' }}>
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#000', background: roleInfo.color, padding:'2px 8px', borderRadius:'4px' }}>{hero.role}</span>
                <span style={{ fontSize: '11px', fontWeight: '800', color: roleInfo.color, border:`1px solid ${roleInfo.color}`, padding:'2px 8px', borderRadius:'4px' }}>{hero.tier}티어</span>
              </div>
              
              <div style={{ margin: '8px 0 10px 0', fontSize: '13px', color: '#e0e0e0', fontStyle: 'italic', opacity: 0.9, borderLeft:`3px solid ${roleInfo.color}`, paddingLeft:'10px', lineHeight:'1.4', background:'rgba(0,0,0,0.3)', padding:'8px 10px', borderRadius:'0 6px 6px 0' }}>
                "{displayConcept}"
              </div>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={onPatch} style={{ flex:1, background:'#238636', border:'none', color:'#fff', padding:'6px', borderRadius:'4px', fontWeight:'bold', fontSize:'12px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'4px' }}><Wrench size={12}/> 패치</button>
                <button onClick={() => setShowCustomize(true)} style={{ flex:1, background:'#1f6feb', border:'none', color:'#fff', padding:'6px', borderRadius:'4px', fontWeight:'bold', fontSize:'12px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'4px' }}><Edit size={12}/> 커스텀</button>
                <button onClick={handleDelete} style={{ flex:1, background:'#3f1515', border:'1px solid #5a1e1e', color:'#ff6b6b', padding:'6px', borderRadius:'4px', fontWeight:'bold', fontSize:'12px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'4px' }}><Trash size={12}/> 삭제</button>
              </div>
            </div>
          </div>

          {/* 2. 스탯 그리드 */}
          <div style={{ padding: '0 20px 20px 20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: '6px' }}>
              <HeroSpecItem label="HP" value={hero.stats.hp} icon={<Heart/>} color="#2ecc71" />
              <HeroSpecItem label="MP" value={hero.stats.mp || 300} icon={<Droplets/>} color="#3498db" />
              <HeroSpecItem label="AD" value={hero.stats.ad} icon={<Swords/>} color="#da3633" />
              <HeroSpecItem label="AP" value={hero.stats.ap} icon={<Zap/>} color="#9b59b6" />
              <HeroSpecItem label="DEF" value={hero.stats.armor} icon={<Shield/>} color="#58a6ff" />
              <HeroSpecItem label="SPD" value={hero.stats.speed} icon={<Footprints/>} color="#f1c40f" />
              <HeroSpecItem label="RNG" value={hero.stats.range} icon={<Crosshair/>} color="#ccc" />
              <HeroSpecItem label="CRI" value={`${hero.stats.crit}%`} icon={<Target/>} color="#e67e22" />
              {/* [수정 완료] Activity 아이콘 import 추가됨 */}
              <HeroSpecItem label="H.Reg" value={hero.stats.regen} icon={<Activity/>} color="#2ecc71" />
              <HeroSpecItem label="M.Reg" value={hero.stats.mpRegen || 5} icon={<Activity/>} color="#3498db" />
              <HeroSpecItem label="PEN" value={hero.stats.pen} icon={<Flame/>} color="#da3633" />
              <HeroSpecItem label="BASE" value={hero.stats.baseAtk} icon={<Swords/>} color="#777" />
            </div>
          </div>

          <div style={{ display: 'flex', background: '#161b22', borderBottom: '1px solid #30363d', borderTop: '1px solid rgba(255,255,255,0.1)', position: 'sticky', top: 0, zIndex: 20 }}>
            <TabButton id="SUMMARY" label="종합분석" icon={<BarChart2/>} activeTab={activeTab} onClick={setActiveTab} />
            <TabButton id="COUNTER" label="상대분석" icon={<Swords/>} activeTab={activeTab} onClick={setActiveTab} />
            <TabButton id="COMBAT" label="스킬/성장" icon={<Zap/>} activeTab={activeTab} onClick={setActiveTab} />
            <TabButton id="BUILD" label="아이템" icon={<Target/>} activeTab={activeTab} onClick={setActiveTab} />
          </div>

          {/* 탭 컨텐츠 */}
          <div key={activeTab} style={{ padding: '20px', minHeight: '400px', background: 'rgba(13, 17, 23, 0.95)' }}>
            {renderContent()}
          </div>
        </div>

        {showCustomize && <CustomizeHeroModal hero={hero} onClose={() => setShowCustomize(false)} />}
        {selectedEnemy && <HeroVsModal myHero={hero} enemyHero={selectedEnemy} onClose={() => setSelectedEnemy(null)} />}

      </div>
    </div>
  );
};
