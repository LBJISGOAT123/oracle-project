// ==========================================
// FILE PATH: /src/components/hero/HeroManagement.tsx
// ==========================================
import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { Edit3, Search, Plus, Trash2, Shield, Swords, Zap, Crosshair, Skull, Layers, Target } from 'lucide-react';
import { Hero, Role } from '../../types';
import { GameIcon } from '../common/GameIcon';

interface Props { onEditHero: (hero: Hero) => void; }

// 역할군 데이터 및 아이콘 매핑 (원본 유지)
const ROLES: (Role | 'ALL')[] = ['ALL', '집행관', '추적자', '선지자', '신살자', '수호기사'];

const getRoleIcon = (role: string) => {
  switch(role) {
    case 'ALL': return <Layers size={14}/>;
    case '집행관': return <Shield size={14}/>;
    case '추적자': return <Swords size={14}/>;
    case '선지자': return <Zap size={14}/>;
    case '신살자': return <Crosshair size={14}/>;
    case '수호기사': return <Skull size={14}/>;
    default: return <Layers size={14}/>;
  }
};

const getRoleColor = (role: string) => {
  switch(role) {
    case '집행관': return '#e74c3c';
    case '추적자': return '#2ecc71';
    case '선지자': return '#3498db';
    case '신살자': return '#f1c40f';
    case '수호기사': return '#9b59b6';
    default: return '#8b949e';
  }
};

export const HeroManagement: React.FC<Props> = ({ onEditHero }) => {
  const { heroes, addHero, deleteHero } = useGameStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role | 'ALL'>('ALL');

  // 모바일 감지 로직 (원본 유지)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 필터링 로직 (원본 유지)
  const filteredHeroes = heroes.filter(h => {
    const matchRole = selectedRole === 'ALL' || h.role === selectedRole;
    const matchSearch = h.name.includes(searchTerm) || h.role.includes(searchTerm);
    return matchRole && matchSearch;
  });

  // 영웅 생성 로직 (stats에 range 기본값 포함하여 무결성 유지)
  const handleCreateHero = () => {
    const id = `h_custom_${Date.now()}`;
    const newHero: Hero = {
      id,
      name: "이름 없는 영웅",
      role: selectedRole === 'ALL' ? "집행관" : selectedRole,
      tier: "3",
      stats: { hp: 2000, ad: 60, ap: 0, armor: 30, crit: 0, range: 150, speed: 340, regen: 10, pen: 0, baseAtk: 60 },
      skills: {
        passive: { name: "기본 패시브", mechanic: "NONE", val: 0, adRatio: 0, apRatio: 0, cd: 0, isPassive: true },
        q: { name: "Q 스킬", mechanic: "DAMAGE", val: 100, adRatio: 1.0, apRatio: 0, cd: 8 },
        w: { name: "W 스킬", mechanic: "NONE", val: 0, adRatio: 0, apRatio: 0, cd: 12 },
        e: { name: "E 스킬", mechanic: "DASH", val: 50, adRatio: 0, apRatio: 0, cd: 15 },
        r: { name: "R 궁극기", mechanic: "DAMAGE", val: 300, adRatio: 1.5, apRatio: 0, cd: 100 }
      },
      record: {
        totalMatches: 0, totalWins: 0, totalPicks: 0, totalBans: 0,
        totalKills: 0, totalDeaths: 0, totalAssists: 0,
        totalDamage: 0, totalDamageTaken: 0, totalCs: 0, totalGold: 0,
        recentResults: []
      },
      rank: 999, rankChange: 0, recentWinRate: 0, pickRate: 0, banRate: 0,
      avgKda: "0.0/0.0/0.0", kdaRatio: "0.00", avgDpm: "0", avgDpg: "0", avgCs: "0", avgGold: "0"
    };
    addHero(newHero);
    onEditHero(newHero);
  };

  const handleDelete = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    if (confirm(`정말 '${name}' 영웅을 삭제하시겠습니까?\n삭제 후 되돌릴 수 없으며, 통계 데이터도 사라집니다.`)) {
      deleteHero(id);
    }
  };

  return (
    <div style={{ background: '#161b22', padding: isMobile ? '15px' : '20px', borderRadius: '12px', border: '1px solid #30363d', minHeight:'80vh', display:'flex', flexDirection:'column' }}>

      {/* 1. 헤더 & 검색창 (원본 디자인 유지) */}
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', marginBottom: '15px', gap: '10px' }}>
        <h3 style={{ margin:0, color:'#fff', display:'flex', alignItems:'center', gap:'8px' }}>
          🛡️ 영웅 데이터 관리
        </h3>

        <div style={{ display:'flex', gap:'10px' }}>
          <div style={{ flex:1, display: 'flex', alignItems: 'center', gap: '10px', background: '#0d1117', padding: '8px 15px', borderRadius: '8px', border: '1px solid #30363d' }}>
            <Search size={16} color="#888" />
            <input 
              type="text" 
              placeholder="영웅 검색..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ background: 'none', border: 'none', color: '#fff', outline: 'none', width: '100%', fontSize:'13px' }}
            />
          </div>
          <button 
            onClick={handleCreateHero}
            style={{ 
              background:'#238636', color:'#fff', display:'flex', alignItems:'center', gap:'6px', 
              fontSize:'13px', whiteSpace:'nowrap', padding:'8px 16px', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:'bold'
            }}
          >
            <Plus size={16}/> {isMobile ? '' : '새 영웅'}
          </button>
        </div>
      </div>

      {/* 2. 포지션 필터 (원본 가로 스크롤 디자인 유지) */}
      <div style={{ 
        display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '10px', marginBottom: '10px',
        scrollbarWidth: 'none', msOverflowStyle: 'none' 
      }}>
        {ROLES.map(role => (
          <button
            key={role}
            onClick={() => setSelectedRole(role)}
            style={{
              padding: '8px 12px', borderRadius: '20px', border: selectedRole === role ? `1px solid ${getRoleColor(role)}` : '1px solid #30363d',
              background: selectedRole === role ? `${getRoleColor(role)}22` : '#0d1117',
              color: selectedRole === role ? getRoleColor(role) : '#8b949e',
              fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap',
              display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0
            }}
          >
            {getRoleIcon(role)} {role === 'ALL' ? '전체' : role}
          </button>
        ))}
      </div>

      {/* 3. 영웅 리스트 (원본 디자인 유지 + 사거리 정보만 추가) */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(240px, 1fr))', 
        gap: '10px', flex: 1, overflowY: 'auto', alignContent: 'start'
      }}>
        {filteredHeroes.map(hero => (
          <div key={hero.id} style={{ 
            background: '#0d1117', padding: '12px', borderRadius: '10px', border: '1px solid #30363d', 
            display: 'flex', alignItems: 'center', gap: '15px', position: 'relative'
          }}>

            <div onClick={() => onEditHero(hero)} style={{ cursor:'pointer' }}>
                <GameIcon id={hero.id} size={50} fallback={<span style={{fontSize:'24px'}}>🧙‍♂️</span>} shape="rounded" border={`2px solid ${getRoleColor(hero.role)}44`}/>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }} onClick={() => onEditHero(hero)}>
              <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                <span style={{ fontSize: '10px', color: getRoleColor(hero.role), border: `1px solid ${getRoleColor(hero.role)}44`, padding:'1px 4px', borderRadius:'3px', fontWeight:'bold' }}>
                  {hero.role}
                </span>
                {hero.id.startsWith('h_custom') && (
                  <span style={{ fontSize:'9px', background:'#1f6feb', color:'#fff', padding:'1px 4px', borderRadius:'3px' }}>NEW</span>
                )}
              </div>
              <strong style={{ fontSize: '15px', color: '#fff', cursor:'pointer' }}>{hero.name}</strong>

              {/* [추가] 사거리 정보 및 기존 승률 정보 무결하게 표시 */}
              <div style={{ fontSize: '11px', color: '#666', display:'flex', gap:'8px', marginTop:'2px' }}>
                <span style={{ display:'flex', alignItems:'center', gap:'3px' }}>
                    <Target size={10} color="#58a6ff"/> {hero.stats.range}
                </span>
                <span style={{ color:'#444' }}>|</span>
                <span>승률 {hero.recentWinRate.toFixed(1)}%</span>
              </div>
            </div>

            <div style={{ display:'flex', flexDirection: isMobile ? 'row' : 'column', gap:'6px' }}>
              <button onClick={() => onEditHero(hero)} style={{ background: '#21262d', border: '1px solid #30363d', color: '#fff', padding: '8px', borderRadius: '6px', cursor: 'pointer' }}>
                <Edit3 size={16} />
              </button>

              <button onClick={(e) => handleDelete(e, hero.id, hero.name)} style={{ background: '#3f1515', border: '1px solid #5a1e1e', color: '#ff6b6b', padding: '8px', borderRadius: '6px', cursor: 'pointer' }}>
                <Trash2 size={16} />
              </button>
            </div>

          </div>
        ))}

        {filteredHeroes.length === 0 && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: '#555' }}>
            해당하는 영웅이 없습니다.
          </div>
        )}
      </div>

    </div>
  );
};