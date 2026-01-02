// ==========================================
// FILE PATH: /src/components/hero/HeroDetailView.tsx
// ==========================================

import React, { useState, useEffect, useMemo } from 'react';
import { Hero } from '../../types';
import { useGameStore } from '../../store/useGameStore';
import { ROLE_DATA } from '../../data/roles';
import { 
  X, Wrench, Edit, Swords, Shield, Zap, Target, Skull, Trophy, 
  Activity, BarChart2, Clock, Search, Heart, Footprints, Crosshair, Droplets, Flame, Trash
} from 'lucide-react'; // [수정] Trash 아이콘 추가
import { GameIcon } from '../common/GameIcon';
import { CustomizeHeroModal } from './CustomizeHeroModal';
import { HeroVsModal } from './HeroVsModal';

interface Props {
  hero: Hero;
  onBack: () => void;
  onPatch: () => void;
}

export const HeroDetailView: React.FC<Props> = ({ hero, onBack, onPatch }) => {
  // [수정] deleteHero 추가
  const { heroes, gameState, shopItems, deleteHero } = useGameStore();
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

  // 영웅 고유 대사 표시
  const displayConcept = hero.concept || roleInfo.concept;

  // [신규] 영웅 삭제 핸들러
  const handleDelete = () => {
    if (confirm(`정말 '${hero.name}' 영웅을 삭제하시겠습니까?\n삭제된 영웅은 복구할 수 없으며, 통계 데이터도 사라집니다.`)) {
      deleteHero(hero.id);
      onBack(); // 목록으로 돌아가기
    }
  };

  // --- [데이터 계산] ---
  const totalMatches = Math.max(1, hero.record.totalMatches);
  const winRate = (hero.record.totalWins / totalMatches) * 100;

  const parseStat = (val: string) => parseFloat(val.replace(/,/g, '')) || 0;

  const dpm = parseStat(hero.avgDpm);
  const dpg = parseStat(hero.avgDpg);
  const gpm = parseStat(hero.avgGold);
  const cspm = parseStat(hero.avgCs);

  const avgKills = hero.record.totalKills / totalMatches;
  const avgDeaths = hero.record.totalDeaths / totalMatches;
  const avgAssists = hero.record.totalAssists / totalMatches;
  const survivalRate = Math.max(0, 100 - (avgDeaths * 10));
  const killParticipation = Math.min(100, ((avgKills + avgAssists) / (avgKills + avgDeaths + avgAssists + 5)) * 100);

  let objectDmgFactor = 0.2;
  if (hero.role === '신살자') objectDmgFactor = 0.5;
  if (hero.role === '추적자') objectDmgFactor = 0.4;
  const objectDpm = dpm * objectDmgFactor;

  let ccScore = 0;
  ['q','w','e','r'].forEach(k => {
    const s = (hero.skills as any)[k];
    if (s.mechanic === 'STUN' || s.mechanic === 'HOOK') ccScore += 15;
    if (s.mechanic === 'GLOBAL') ccScore += 10;
  });
  ccScore += (avgAssists * 2);

  const enemyList = useMemo(() => {
    return heroes
      .filter(h => h.id !== hero.id && h.name.includes(enemySearch))
      .sort((a, b) => b.recentWinRate - a.recentWinRate);
  }, [heroes, hero.id, enemySearch]);

  const recommendedItems = useMemo(() => {
    const itemStats = gameState.itemStats;
    const isAD = hero.stats.ad > hero.stats.ap;
    const isTank = hero.role === '수호기사';

    const suitableItems = shopItems.filter(item => {
      if (item.type === 'POWER') return true;
      if (isTank) return item.type === 'ARMOR' || item.hp > 0;
      if (isAD) return item.ad > 0 || item.crit > 0 || item.speed > 0;
      return item.ap > 0; 
    });

    return suitableItems.map(item => {
      const stat = itemStats[item.id] || { totalWins: 0, totalPicks: 0 };
      const iWinRate = stat.totalPicks > 0 ? (stat.totalWins / stat.totalPicks) * 100 : 0;
      return { item, winRate: iWinRate, picks: stat.totalPicks };
    })
    .sort((a, b) => b.winRate - a.winRate)
    .slice(0, 6);
  }, [hero, shopItems, gameState.itemStats]);

  // --- [UI 헬퍼] ---
  const getScoreColor = (score: number, standard: number) => {
    if (score >= standard * 1.1) return '#ff4d4d'; 
    if (score >= standard * 0.95) return '#2ecc71'; 
    return '#8b949e'; 
  };

  const getSmartSkillInfo = (skill: any) => {
    let desc = "적에게 기본 피해를 입힙니다.";
    let tag = "공격";
    let color = "#ccc";
    let icon = <Swords size={12}/>;

    switch (skill.mechanic) {
      case 'DAMAGE': desc = "강력한 피해를 입힙니다."; tag = "피해"; color = "#e74c3c"; break;
      case 'HEAL': desc = "체력을 회복시킵니다."; tag = "회복"; color = "#2ecc71"; icon = <Activity size={12}/>; break;
      case 'SHIELD': desc = "피해를 흡수합니다."; tag = "보호"; color = "#3498db"; icon = <Shield size={12}/>; break;
      case 'STUN': desc = "적을 기절시킵니다."; tag = "제어"; color = "#f1c40f"; icon = <Zap size={12}/>; break;
      case 'HOOK': desc = "적을 끌어옵니다."; tag = "그랩"; color = "#9b59b6"; icon = <Target size={12}/>; break;
      case 'DASH': desc = "빠르게 이동합니다."; tag = "이동"; color = "#95a5a6"; icon = <Activity size={12}/>; break;
      case 'STEALTH': desc = "모습을 감춥니다."; tag = "은신"; color = "#7f8c8d"; break;
      case 'EXECUTE': desc = "치명적인 피해를 줍니다."; tag = "처형"; color = "#da3633"; icon = <Skull size={12}/>; break;
      case 'GLOBAL': desc = "맵 전체에 영향을 줍니다."; tag = "광역"; color = "#e67e22"; icon = <Zap size={12}/>; break;
    }
    return { desc, tag, color, icon };
  };

  const StatRow = ({ label, value, subValue, color }: any) => (
    <div style={{ display:'flex', flexDirection:'column', justifyContent:'center', padding:'10px', background:'rgba(255,255,255,0.03)', borderRadius:'8px' }}>
      <span style={{ color:'#888', fontSize:'11px', marginBottom:'2px' }}>{label}</span>
      <div style={{ color: color || '#fff', fontWeight:'800', fontSize:'15px', fontFamily:'monospace' }}>{value}</div>
      {subValue && <div style={{ color:'#555', fontSize:'10px' }}>{subValue}</div>}
    </div>
  );

  const TabButton = ({ id, label, icon }: any) => (
    <button 
      onClick={() => setActiveTab(id)}
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

  const HeroSpecItem = ({ icon, label, value, color }: any) => (
    <div style={{ 
      display:'flex', alignItems:'center', justifyContent:'space-between',
      background:'#161b22', padding:'6px 10px', borderRadius:'6px', 
      border:'1px solid #30363d', minWidth:'80px'
    }}>
      <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
        {React.cloneElement(icon, { size: 12, color: color })}
        <span style={{ fontSize:'10px', color:'#aaa', fontWeight:'bold' }}>{label}</span>
      </div>
      <span style={{ fontSize:'12px', fontWeight:'900', color:'#fff', fontFamily:'monospace' }}>{value}</span>
    </div>
  );

  return (
    <div style={{ 
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)'
    }}>

      <div style={{ 
        width: isMobile ? '100%' : '650px', 
        height: isMobile ? '100%' : '90vh',
        backgroundColor: '#0d1117', 
        display: 'flex', flexDirection: 'column', 
        overflow: 'hidden', position: 'relative',
        borderRadius: isMobile ? '0' : '16px',
        border: isMobile ? 'none' : '1px solid #30363d',
        boxShadow: '0 20px 60px rgba(0,0,0,0.8)'
      }}>

        {/* 배경 이미지 */}
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          backgroundImage: customBg ? `url(${customBg})` : 'none',
          backgroundSize: 'cover', backgroundPosition: 'center top', zIndex: 0,
          opacity: 0.6, pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          background: 'linear-gradient(to bottom, rgba(13,17,23,0.2) 0%, rgba(13,17,23,0.9) 50%, #0d1117 100%)',
          zIndex: 1, pointerEvents: 'none'
        }} />

        {/* 닫기 버튼 */}
        <div style={{ padding: '15px 20px', position: 'relative', zIndex: 10, display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onBack} style={{ background:'rgba(0,0,0,0.5)', border:'1px solid rgba(255,255,255,0.2)', color:'#fff', padding:'8px', borderRadius:'50%', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <X size={20}/>
          </button>
        </div>

        {/* 메인 스크롤 영역 */}
        <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 10, scrollbarWidth:'none', paddingBottom:'50px' }}>

          {/* 1. 헤더 섹션 */}
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

              {/* 영웅 고유 대사 */}
              <p style={{ 
                margin: '8px 0 10px 0', fontSize: '13px', color: '#e0e0e0', fontStyle: 'italic', opacity: 0.9, 
                borderLeft:`3px solid ${roleInfo.color}`, paddingLeft:'10px', lineHeight:'1.4', background:'rgba(0,0,0,0.3)', padding:'8px 10px', borderRadius:'0 6px 6px 0'
              }}>
                "{displayConcept}"
              </p>

              {/* [수정] 버튼 그룹 (삭제 버튼 포함) */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={onPatch} style={{ flex:1, background:'#238636', border:'none', color:'#fff', padding:'6px', borderRadius:'4px', fontWeight:'bold', fontSize:'12px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'4px' }}>
                  <Wrench size={12}/> 패치
                </button>
                <button onClick={() => setShowCustomize(true)} style={{ flex:1, background:'#1f6feb', border:'none', color:'#fff', padding:'6px', borderRadius:'4px', fontWeight:'bold', fontSize:'12px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'4px' }}>
                  <Edit size={12}/> 커스텀
                </button>
                <button onClick={handleDelete} style={{ flex:1, background:'#3f1515', border:'1px solid #5a1e1e', color:'#ff6b6b', padding:'6px', borderRadius:'4px', fontWeight:'bold', fontSize:'12px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'4px' }}>
                  <Trash size={12}/> 삭제
                </button>
              </div>
            </div>
          </div>

          {/* 2. 상세 스탯 그리드 (모든 정보 표시) */}
          <div style={{ padding: '0 20px 20px 20px' }}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', 
              gap: '6px' 
            }}>
              {/* Row 1: 기본 체급 */}
              <HeroSpecItem label="HP" value={hero.stats.hp} icon={<Heart/>} color="#2ecc71" />
              <HeroSpecItem label="MP" value={hero.stats.mp || 300} icon={<Droplets/>} color="#3498db" />
              <HeroSpecItem label="AD" value={hero.stats.ad} icon={<Swords/>} color="#da3633" />
              <HeroSpecItem label="AP" value={hero.stats.ap} icon={<Zap/>} color="#9b59b6" />

              {/* Row 2: 방어/이동 */}
              <HeroSpecItem label="DEF" value={hero.stats.armor} icon={<Shield/>} color="#58a6ff" />
              <HeroSpecItem label="SPD" value={hero.stats.speed} icon={<Footprints/>} color="#f1c40f" />
              <HeroSpecItem label="RNG" value={hero.stats.range} icon={<Crosshair/>} color="#ccc" />
              <HeroSpecItem label="CRI" value={`${hero.stats.crit}%`} icon={<Target/>} color="#e67e22" />

              {/* Row 3: 재생/관통/기본공격 */}
              <HeroSpecItem label="H.Reg" value={hero.stats.regen} icon={<Activity/>} color="#2ecc71" />
              <HeroSpecItem label="M.Reg" value={hero.stats.mpRegen || 5} icon={<Activity/>} color="#3498db" />
              <HeroSpecItem label="PEN" value={hero.stats.pen} icon={<Flame/>} color="#da3633" />
              <HeroSpecItem label="BASE" value={hero.stats.baseAtk} icon={<Swords/>} color="#777" />
            </div>
          </div>

          {/* 탭 메뉴 */}
          <div style={{ display: 'flex', background: '#161b22', borderBottom: '1px solid #30363d', borderTop: '1px solid rgba(255,255,255,0.1)', position: 'sticky', top: 0, zIndex: 20 }}>
            <TabButton id="SUMMARY" label="종합분석" icon={<BarChart2/>} />
            <TabButton id="COUNTER" label="상대분석" icon={<Swords/>} />
            <TabButton id="COMBAT" label="전투성장" icon={<Activity/>} />
            <TabButton id="BUILD" label="아이템" icon={<Zap/>} />
          </div>

          {/* 탭 컨텐츠 */}
          <div style={{ padding: '20px', minHeight: '400px', background: 'rgba(13, 17, 23, 0.95)' }}>

            {/* TAB 1: 종합 분석 */}
            {activeTab === 'SUMMARY' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ background: '#1c1c1f', padding: '15px', borderRadius: '12px', border: '1px solid #333' }}>
                  <h3 style={{ margin:'0 0 12px 0', fontSize:'14px', color:'#f1c40f', display:'flex', gap:'6px', alignItems:'center' }}>
                    <Trophy size={14}/> 시즌 퍼포먼스
                  </h3>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:'8px', textAlign:'center' }}>
                    <div style={{ display:'flex', flexDirection:'column', gap:'2px' }}>
                      <div style={{ fontSize:'10px', color:'#888' }}>승률</div>
                      <div style={{ fontSize:'15px', fontWeight:'900', color: getScoreColor(winRate, 50) }}>{winRate.toFixed(0)}%</div>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:'2px', borderLeft:'1px solid #333' }}>
                      <div style={{ fontSize:'10px', color:'#888' }}>KDA</div>
                      <div style={{ fontSize:'15px', fontWeight:'900', color: getScoreColor(parseFloat(hero.kdaRatio), 3.0) }}>{hero.kdaRatio}</div>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:'2px', borderLeft:'1px solid #333' }}>
                      <div style={{ fontSize:'10px', color:'#888' }}>픽률</div>
                      <div style={{ fontSize:'15px', fontWeight:'900', color:'#fff' }}>{hero.pickRate.toFixed(0)}%</div>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:'2px', borderLeft:'1px solid #333' }}>
                      <div style={{ fontSize:'10px', color:'#da3633' }}>밴률</div>
                      <div style={{ fontSize:'15px', fontWeight:'900', color:'#da3633' }}>{hero.banRate.toFixed(0)}%</div>
                    </div>
                  </div>
                </div>

                {/* 스킬 정보 (마나 소모 포함) */}
                <div style={{ background: '#1c1c1f', padding: '15px', borderRadius: '12px', border: '1px solid #333' }}>
                  <h3 style={{ margin:'0 0 12px 0', fontSize:'14px', color:'#fff', display:'flex', gap:'6px', alignItems:'center' }}>
                    <Zap size={14}/> 스킬 정보
                  </h3>
                  <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                    {['passive', 'q', 'w', 'e', 'r'].map((key) => {
                      const skill = (hero.skills as any)[key];
                      const { desc, tag, color, icon } = getSmartSkillInfo(skill);
                      const cost = skill.cost ?? (key === 'r' ? 100 : 50);

                      return (
                        <div key={key} style={{ display:'flex', flexDirection:'column', background:'#252528', padding:'12px', borderRadius:'8px', borderLeft: key === 'r' ? '3px solid #f1c40f' : `3px solid ${color}`, gap:'6px' }}>
                          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                              <div style={{ fontSize:'12px', fontWeight:'900', color: key==='r'?'#f1c40f':color, width:'20px', textAlign:'center', background:'#161b22', borderRadius:'4px' }}>
                                {key === 'passive' ? 'P' : key.toUpperCase()}
                              </div>
                              <div style={{ fontSize:'14px', color:'#fff', fontWeight:'bold' }}>{skill.name}</div>
                            </div>
                            <div style={{ display:'flex', gap:'6px' }}>
                                {key !== 'passive' && (
                                    <div style={{ fontSize:'10px', color:'#3498db', border:'1px solid #3498db44', padding:'1px 6px', borderRadius:'10px', background:'#3498db11', fontWeight:'bold' }}>
                                        {cost} MP
                                    </div>
                                )}
                                <div style={{ fontSize:'10px', color: color, border:`1px solid ${color}44`, padding:'1px 6px', borderRadius:'10px', display:'flex', alignItems:'center', gap:'3px', background:`${color}11` }}>
                                    {icon} {tag}
                                </div>
                            </div>
                          </div>

                          <div style={{ fontSize:'12px', color:'#ccc', paddingLeft:'28px', lineHeight:'1.4' }}>{desc}</div>

                          <div style={{ fontSize:'11px', color:'#666', paddingLeft:'28px', display:'flex', flexWrap:'wrap', gap:'6px', marginTop:'4px', borderTop:'1px dashed #333', paddingTop:'4px' }}>
                            <span style={{ color:'#888' }}>수치:</span>
                            <span style={{ color:'#fff', fontWeight:'bold' }}>{skill.val}</span>
                            {skill.adRatio > 0 && <span style={{ color:'#e67e22' }}>(+{skill.adRatio} AD)</span>}
                            {skill.apRatio > 0 && <span style={{ color:'#9b59b6' }}>(+{skill.apRatio} AP)</span>}
                            {skill.cd > 0 && <span style={{ marginLeft:'auto', color:'#aaa', display:'flex', alignItems:'center', gap:'2px' }}><Clock size={10}/> {skill.cd}s</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: 상대 분석 */}
            {activeTab === 'COUNTER' && (
              <div style={{ background: '#1c1c1f', padding: '15px', borderRadius: '12px', border: '1px solid #333', minHeight:'400px' }}>
                <div style={{ display:'flex', gap:'10px', marginBottom:'15px', background:'#252528', padding:'10px', borderRadius:'8px' }}>
                  <Search size={16} color="#888"/>
                  <input 
                    type="text" placeholder="비교할 영웅 이름 검색..." value={enemySearch} onChange={(e) => setEnemySearch(e.target.value)}
                    style={{ background:'none', border:'none', color:'#fff', outline:'none', width:'100%', fontWeight:'bold', fontSize:'13px' }}
                  />
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                  {enemyList.map(enemy => (
                    <div key={enemy.id} onClick={() => setSelectedEnemy(enemy)} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'10px', background:'#252528', borderRadius:'8px', cursor:'pointer' }}>
                      <GameIcon id={enemy.id} size={36} shape="rounded" />
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:'bold', color:'#fff', fontSize:'13px' }}>{enemy.name}</div>
                        <div style={{ fontSize:'11px', color:'#888' }}>{enemy.role}</div>
                      </div>
                      <div style={{ fontSize:'12px', fontWeight:'bold', color: enemy.recentWinRate >= 50 ? '#ff4d4d' : '#888' }}>
                        {enemy.recentWinRate.toFixed(1)}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: 전투 성장 */}
            {activeTab === 'COMBAT' && (
              <div style={{ display:'flex', flexDirection:'column', gap:'15px' }}>
                <div style={{ background: '#1c1c1f', padding: '15px', borderRadius: '12px', border: '1px solid #333' }}>
                  <h3 style={{ margin:'0 0 10px 0', fontSize:'14px', color:'#da3633' }}>전투 효율성</h3>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
                    <StatRow label="DPM" value={Math.floor(dpm).toLocaleString()} color="#da3633" />
                    <StatRow label="DPG" value={Math.floor(dpg).toLocaleString()} color="#aaa" />
                    <StatRow label="킬 관여율" value={`${killParticipation.toFixed(1)}%`} color="#e89d40" />
                    <StatRow label="오브젝트 딜" value={Math.floor(objectDpm).toLocaleString()} color="#f1c40f" />
                    <StatRow label="CC 점수" value={ccScore.toFixed(0)} color="#3498db" />
                  </div>
                </div>

                <div style={{ background: '#1c1c1f', padding: '15px', borderRadius: '12px', border: '1px solid #333' }}>
                  <h3 style={{ margin:'0 0 10px 0', fontSize:'14px', color:'#2ecc71' }}>성장 지표</h3>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
                    <StatRow label="GPM" value={Math.floor(gpm).toLocaleString()} color="#f1c40f" />
                    <StatRow label="CSPM" value={cspm.toFixed(1)} color="#ccc" />
                    <StatRow label="생존 점수" value={`${survivalRate.toFixed(0)}`} color={getScoreColor(survivalRate, 70)} />
                    <StatRow label="골드 효율" value={`${((dpm/gpm)*100).toFixed(0)}%`} color="#aaa" />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: 아이템 빌드 */}
            {activeTab === 'BUILD' && (
              <div style={{ background: '#1c1c1f', padding: '15px', borderRadius: '12px', border: '1px solid #333' }}>
                <h3 style={{ margin:'0 0 10px 0', fontSize:'14px', color:'#fff' }}>추천 핵심 빌드</h3>
                <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                  {recommendedItems.map((data, idx) => (
                    <div key={idx} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'10px', background:'#252528', borderRadius:'8px' }}>
                      <div style={{ fontSize:'13px', fontWeight:'bold', color: idx < 3 ? '#e89d40' : '#555', width:'15px' }}>{idx+1}</div>
                      <div style={{ width:'32px', height:'32px', background:'#161b22', borderRadius:'6px', display:'flex', alignItems:'center', justifyContent:'center', border:'1px solid #444' }}>
                        <Zap size={16} color={data.item.type === 'WEAPON' ? '#da3633' : '#3498db'} />
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:'13px', fontWeight:'bold', color:'#fff' }}>{data.item.name}</div>
                        <div style={{ fontSize:'11px', color:'#f1c40f' }}>{data.item.cost} G</div>
                      </div>
                      <div style={{ textAlign:'right' }}>
                        <div style={{ fontSize:'13px', fontWeight:'bold', color: data.winRate >= 50 ? '#ff4d4d' : '#fff' }}>{data.winRate.toFixed(1)}%</div>
                        <div style={{ fontSize:'10px', color:'#666' }}>승률</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>

        {showCustomize && <CustomizeHeroModal hero={hero} onClose={() => setShowCustomize(false)} />}
        {selectedEnemy && <HeroVsModal myHero={hero} enemyHero={selectedEnemy} onClose={() => setSelectedEnemy(null)} />}

      </div>
    </div>
  );
};
