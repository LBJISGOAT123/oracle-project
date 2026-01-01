// ==========================================
// FILE PATH: /src/components/hero/LaneStatsView.tsx
// ==========================================

import React, { useRef, useState, useMemo } from 'react';
import { Hero, Role } from '../../types';
import { ROLE_DATA } from '../../data/roles';
import { useGameStore } from '../../store/useGameStore';
import { Wrench, Camera, Image as ImageIcon, Target, Swords, Coins, Activity, TrendingUp, Skull } from 'lucide-react';
import { RolePatchModal } from './RolePatchModal'; 
import { GameIcon } from '../common/GameIcon';

interface Props {
  heroes: Hero[];
  selectedRole: Role;
  onSelectRole: (role: Role) => void;
  isMobile?: boolean;
}

const getRoleId = (role: Role) => {
  switch(role) {
    case '집행관': return 'role_executor';
    case '추적자': return 'role_tracker';
    case '선지자': return 'role_prophet';
    case '신살자': return 'role_slayer';
    case '수호기사': return 'role_guardian';
    default: return 'role_unknown';
  }
};

export const LaneStatsView: React.FC<Props> = ({ heroes, selectedRole, onSelectRole, isMobile = false }) => {
  const { gameState, setCustomImage } = useGameStore();
  const [showPatchModal, setShowPatchModal] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const roleInfo = ROLE_DATA[selectedRole];
  const roleId = getRoleId(selectedRole);

  const roleBgId = `${roleId}_bg`; 
  const customBg = gameState.customImages?.[roleBgId];

  const iconInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);

  const s = gameState.roleSettings || {
    executor: { damage: 10, defense: 10 },
    tracker: { gold: 20, smiteChance: 1.5 },
    prophet: { cdrPerLevel: 2 },
    slayer: { structureDamage: 30 },
    guardian: { survivalRate: 20 }
  };

  const getDynamicTraitText = (role: Role) => {
    switch (role) {
      case '집행관': return `주변에 아군이 없을 때(솔로 라인전 시) 피해량 +${s.executor.damage}%, 방어력 +${s.executor.defense}%.`;
      case '추적자': return `몬스터/오브젝트 처치 시 골드 획득량 +${s.tracker.gold}%. 다른 라인 개입(갱킹) 시 성공률 증가. (강타 확률 ${s.tracker.smiteChance}배)`;
      case '선지자': return `레벨이 오를수록 스킬 가속(쿨타임 감소) 효과가 추가로 붙음. (레벨당 위력 +${s.prophet.cdrPerLevel}%)`;
      case '신살자': return `구조물(타워, 억제기, 수호자) 및 거신병에게 입히는 피해량 +${s.slayer.structureDamage}%.`;
      case '수호기사': return `같은 라인에 있는 아군의 생존율을 ${s.guardian.survivalRate}% 올려줌. (자신이 대신 죽을 확률 증가)`;
      default: return '';
    }
  };

  const laneHeroes = heroes
    .filter(h => h.role === selectedRole)
    .sort((a, b) => b.recentWinRate - a.recentWinRate);

  const roleStats = useMemo(() => {
    if (laneHeroes.length === 0) return null;

    let totalWins = 0, totalMatches = 0;
    let totalK = 0, totalD = 0, totalA = 0;
    let totalGold = 0, totalCs = 0, totalDpm = 0;

    laneHeroes.forEach(h => {
        totalWins += h.record.totalWins;
        totalMatches += h.record.totalMatches;
        totalK += h.record.totalKills;
        totalD += h.record.totalDeaths;
        totalA += h.record.totalAssists;

        totalGold += parseInt(h.avgGold.replace(/,/g, '')) || 0;
        totalCs += parseFloat(h.avgCs) || 0;
        totalDpm += parseInt(h.avgDpm.replace(/,/g, '')) || 0;
    });

    const count = laneHeroes.length;
    const safeDiv = (a: number, b: number) => b === 0 ? 0 : a / b;

    return {
        avgWinRate: totalMatches > 0 ? (totalWins / totalMatches) * 100 : 0,
        avgKda: safeDiv(totalK + totalA, totalD).toFixed(2),
        avgGold: Math.round(totalGold / count).toLocaleString(),
        avgCs: (totalCs / count).toFixed(1),
        avgDpm: Math.round(totalDpm / count).toLocaleString(),
    };
  }, [laneHeroes]);

  const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if(file) {
        const reader = new FileReader();
        reader.onloadend = () => { if(typeof reader.result === 'string') setCustomImage(roleId, reader.result); };
        reader.readAsDataURL(file);
    }
  };

  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if(file) {
        const reader = new FileReader();
        reader.onloadend = () => { if(typeof reader.result === 'string') setCustomImage(roleBgId, reader.result); };
        reader.readAsDataURL(file);
    }
  };

  const actionButtonStyle = {
    background: 'rgba(33, 38, 45, 0.8)', 
    border: '1px solid rgba(255,255,255,0.2)', 
    color: '#fff', 
    padding: '8px 12px', 
    borderRadius: '6px', 
    cursor: 'pointer', 
    fontWeight: 'bold' as const, 
    display: 'flex', 
    alignItems: 'center', 
    gap: '8px', 
    fontSize: '12px', 
    whiteSpace: 'nowrap' as const, 
    backdropFilter: 'blur(4px)',
    width: '100%',
    justifyContent: 'center'
  };

  return (
    <div 
      // [핵심 수정] key 속성을 추가하여 역할군이 바뀔 때마다 컴포넌트를 새로 그려서 스타일 꼬임 방지
      key={selectedRole}
      style={{ 
        display: 'flex', flexDirection: 'column', height: '100%', 
        // [핵심 수정] background 단축 속성 대신 개별 속성 사용으로 안정성 확보
        backgroundColor: '#0d1117',
        backgroundImage: customBg 
          ? `linear-gradient(to bottom, rgba(13,17,23,0.5), rgba(13,17,23,0.95)), url(${customBg})` 
          : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center top', // 모바일에서 인물 얼굴이 잘리지 않도록 상단 기준 정렬
        backgroundRepeat: 'no-repeat',
        position: 'relative'
      }}
    >

      {/* 0. 상단 탭 네비게이션 */}
      <div style={{ 
        padding: '10px 15px', borderBottom: '1px solid rgba(255,255,255,0.1)', 
        background: 'rgba(22, 27, 34, 0.8)', backdropFilter: 'blur(10px)',
        display: 'flex', gap: '10px', overflowX: 'auto', whiteSpace: 'nowrap',
        flexShrink: 0, zIndex: 10
      }}>
        {Object.entries(ROLE_DATA).map(([key, info]) => {
          const role = key as Role;
          const isSelected = selectedRole === role;

          return (
            <button 
              key={role} 
              onClick={() => onSelectRole(role)}
              style={{ 
                flex: 1, minWidth: isMobile ? '70px' : '100px',
                background: isSelected ? info.color : 'rgba(255,255,255,0.05)', 
                color: isSelected ? '#000' : '#ccc',
                border: '1px solid',
                borderColor: isSelected ? info.color : 'transparent',
                borderRadius: '6px', padding: '10px 0', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent:'center', gap: '6px',
                transition: '0.2s', fontWeight: '800', fontSize:'12px'
              }}
            >
              {React.createElement(info.icon, { size: 14 })} {role}
            </button>
          );
        })}
      </div>

      {/* 1. 역할군 설명 헤더 */}
      <div style={{ 
        padding: isMobile ? '15px' : '30px', 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row', 
        gap: isMobile ? '15px' : '30px', 
        alignItems: 'flex-start', 
        background: `linear-gradient(180deg, ${roleInfo.color}11 0%, transparent 100%)`,
        flexShrink: 0,
        position: 'relative'
      }}>

        {/* 아이콘 및 타이틀 */}
        <div style={{ display:'flex', gap:'20px', width: isMobile ? '100%' : 'auto', alignItems:'center' }}>
          <div 
            style={{ position: 'relative' }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <div onClick={() => iconInputRef.current?.click()} style={{ cursor: 'pointer', display: 'block' }}>
              <GameIcon 
                id={roleId} 
                size={isMobile ? 60 : 100} 
                fallback={React.createElement(roleInfo.icon, { size: isMobile ? 30 : 50, color: roleInfo.color })}
                border={`2px solid ${roleInfo.color}`}
                shape="rounded"
              />
              <div style={{
                position: 'absolute', inset: 0, borderRadius: '12px',
                background: 'rgba(0,0,0,0.5)', display: isHovered ? 'flex' : 'none',
                alignItems: 'center', justifyContent: 'center', transition: '0.2s'
              }}>
                <Camera size={24} color="#fff" />
              </div>
            </div>
          </div>

          {isMobile && (
             <div style={{ flex: 1 }}>
                <h2 style={{ margin: 0, color: '#fff', fontSize: '24px', fontWeight: '900', textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>{selectedRole}</h2>
                <span style={{ fontSize: '12px', color: roleInfo.color, fontWeight: 'bold', background: 'rgba(0,0,0,0.6)', padding: '2px 8px', borderRadius: '4px', border: `1px solid ${roleInfo.color}44` }}>
                  {roleInfo.name}
                </span>
             </div>
          )}
        </div>

        <div style={{ flex: 1, width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1, marginRight: '20px' }}>
              {!isMobile && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <h2 style={{ margin: 0, color: '#fff', fontSize: '32px', fontWeight: '900', textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>{selectedRole}</h2>
                  <span style={{ fontSize: '16px', color: roleInfo.color, fontWeight: 'bold', background: 'rgba(0,0,0,0.6)', padding: '2px 8px', borderRadius: '4px', border: `1px solid ${roleInfo.color}44` }}>
                    {roleInfo.name}
                  </span>
                </div>
              )}
              <div style={{ fontSize: isMobile ? '13px' : '16px', color: '#fff', fontWeight: 'bold', marginBottom: '8px', fontStyle: 'italic', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
                "{roleInfo.concept}"
              </div>
              <div style={{ fontSize: '13px', color: '#eee', marginBottom: '15px', lineHeight: '1.5', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
                {roleInfo.desc}
              </div>
            </div>

            {!isMobile && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '140px' }}>
                <button onClick={() => setShowPatchModal(true)} style={actionButtonStyle}>
                  <Wrench size={14}/> 밸런스 패치
                </button>
                <button onClick={() => iconInputRef.current?.click()} style={actionButtonStyle}>
                  <Camera size={14}/> 프로필 변경
                </button>
                <button onClick={() => bgInputRef.current?.click()} style={actionButtonStyle}>
                  <ImageIcon size={14}/> 배경 변경
                </button>
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '10px' }}>
            <div style={{ background: 'rgba(28, 28, 31, 0.7)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter:'blur(4px)' }}>
              <div style={{ fontSize: '11px', color: '#58a6ff', fontWeight: 'bold', marginBottom: '4px' }}>
                고유 특성 : {roleInfo.traitName}
              </div>
              <div style={{ fontSize: '12px', color: '#fff', lineHeight: '1.4' }}>
                {getDynamicTraitText(selectedRole)}
              </div>
            </div>
            <div style={{ background: 'rgba(28, 28, 31, 0.7)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter:'blur(4px)' }}>
              <div style={{ fontSize: '11px', color: '#da3633', fontWeight: 'bold', marginBottom: '4px' }}>
                시뮬레이션 반영
              </div>
              <div style={{ fontSize: '12px', color: '#ccc', lineHeight: '1.4' }}>
                {roleInfo.simEffect}
              </div>
            </div>
          </div>

          {isMobile && (
            <div style={{ marginTop: '15px', display: 'flex', gap: '8px' }}>
              <button onClick={() => setShowPatchModal(true)} style={{...actionButtonStyle, flex:1 }}>
                <Wrench size={14}/> 패치
              </button>
              <button onClick={() => iconInputRef.current?.click()} style={{...actionButtonStyle, flex:1 }}>
                <Camera size={14}/> 프로필
              </button>
              <button onClick={() => bgInputRef.current?.click()} style={{...actionButtonStyle, flex:1 }}>
                <ImageIcon size={14}/> 배경
              </button>
            </div>
          )}
        </div>
      </div>

      <input type="file" ref={iconInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleIconUpload} />
      <input type="file" ref={bgInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleBgUpload} />

      {/* 2. 역할군 통합 통계 섹션 */}
      {roleStats && (
        <div style={{ 
          background: 'rgba(18, 20, 24, 0.85)', borderBottom: '1px solid #30363d', borderTop: '1px solid rgba(255,255,255,0.1)', 
          padding: '15px 20px', backdropFilter: 'blur(5px)',
          display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: 'center', justifyContent:'space-between', gap:'15px'
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:'8px', color:'#fff', fontWeight:'bold', fontSize:'14px' }}>
            <Activity size={16} color={roleInfo.color}/> 
            <span style={{ color: roleInfo.color }}>{selectedRole}</span> 통계
          </div>

          <div style={{ display:'flex', gap: isMobile ? '10px' : '25px', flexWrap:'wrap', justifyContent: isMobile ? 'space-between' : 'flex-end', width:'100%' }}>
            <RoleStatItem label="평균 승률" value={`${roleStats.avgWinRate.toFixed(1)}%`} color={roleStats.avgWinRate >= 50 ? '#ff4d4d' : '#8b949e'} icon={<TrendingUp size={12}/>} />
            <RoleStatItem label="평균 KDA" value={`${roleStats.avgKda}:1`} color="#fff" icon={<Skull size={12}/>} />
            <RoleStatItem label="분당 골드" value={roleStats.avgGold} color="#e89d40" icon={<Coins size={12}/>} />
            <RoleStatItem label="분당 데미지" value={roleStats.avgDpm} color="#da3633" icon={<Swords size={12}/>} />
            <RoleStatItem label="평균 CS" value={roleStats.avgCs} color="#ccc" icon={<Target size={12}/>} />
          </div>
        </div>
      )}

      {/* 3. 챔피언 리스트 */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '80px', background: 'rgba(13, 17, 23, 0.6)', backdropFilter: 'blur(3px)' }}>
        {isMobile ? (
          <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {laneHeroes.map((hero, idx) => (
              <div key={hero.id} style={{ 
                background: 'rgba(22, 27, 34, 0.85)', border: '1px solid rgba(48, 54, 61, 0.8)', borderRadius: '12px', padding: '12px 15px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flex: 1 }}>
                  <div style={{ fontSize: '16px', fontWeight: '900', fontStyle: 'italic', color: idx < 3 ? '#e74c3c' : '#666', width: '20px', textAlign: 'center' }}>{idx + 1}</div>

                  <GameIcon id={hero.id} size={42} fallback={<span style={{fontSize:'22px'}}>🧙‍♂️</span>} />

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '14px', color: '#fff' }}>{hero.name}</span>
                      <span className={`tier-badge tier-${hero.tier}`} style={{ fontSize: '9px', padding: '2px 5px', height: 'fit-content' }}>{hero.tier}티어</span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#8b949e' }}>
                      <span style={{ color: hero.recentWinRate >= 50 ? '#ff4d4d' : '#8b949e', fontWeight: 'bold' }}>승률 {hero.recentWinRate.toFixed(1)}%</span>
                      <span style={{ margin: '0 4px', opacity: 0.3 }}>•</span>
                      <span>픽률 {hero.pickRate.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px', minWidth: '80px' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '12px', color: '#fff' }}>{hero.avgKda}</div>
                  <div style={{ fontSize: '10px', color: '#e89d40', fontWeight:'bold' }}>{hero.avgGold} G</div>
                  <div style={{ fontSize: '9px', color: '#888', display:'flex', gap:'6px', marginTop:'2px' }}>
                    <span>CS {hero.avgCs}</span>
                    <span style={{ color: '#da3633' }}>{hero.avgDpm}</span>
                  </div>
                </div>
              </div>
            ))}
            {laneHeroes.length === 0 && <div style={{ padding: '40px', textAlign: 'center', color: '#ccc' }}>데이터가 없습니다.</div>}
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '40px 140px 100px 120px 140px 100px 80px 1fr', padding: '10px 20px', background: 'rgba(28, 28, 31, 0.95)', fontSize: '11px', color: '#8b949e', fontWeight: 'bold', textAlign: 'center', borderBottom: '1px solid #30363d', position:'sticky', top:0 }}>
              <div>#</div>
              <div style={{ textAlign: 'left', paddingLeft: '10px' }}>챔피언</div>
              <div>승률</div>
              <div>픽률 / 밴률</div>
              <div>KDA (킬/뎃/어)</div>
              <div><Target size={10} style={{ display: 'inline' }} /> CS</div>
              <div><Swords size={10} style={{ display: 'inline' }} /> DPM</div>
              <div><Coins size={10} style={{ display: 'inline' }} /> GOLD</div>
            </div>
            <div>
              {laneHeroes.map((hero, idx) => (
                <div key={hero.id} className="hero-row" style={{ display: 'grid', gridTemplateColumns: '40px 140px 100px 120px 140px 100px 80px 1fr', padding: '10px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', alignItems: 'center', fontSize: '12px', color: '#ccc', textAlign: 'center', background: 'rgba(22, 27, 34, 0.6)' }}>
                  <div style={{ fontWeight: 'bold', color: '#aaa' }}>{idx + 1}</div>
                  <div style={{ textAlign: 'left', paddingLeft: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <GameIcon id={hero.id} size={32} fallback={<span style={{fontSize:'16px'}}>🧙‍♂️</span>} />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 'bold', color: '#fff' }}>{hero.name}</span>
                      <span className={`tier-badge tier-${hero.tier}`} style={{ marginLeft: 0, width: 'fit-content' }}>{hero.tier}티어</span>
                    </div>
                  </div>
                  <div style={{ fontWeight: 'bold', color: hero.recentWinRate >= 50 ? '#ff4d4d' : '#4d94ff' }}>{hero.recentWinRate.toFixed(1)}%</div>
                  <div style={{ fontSize: '11px', color: '#ccc' }}>
                    <span style={{ color: '#fff' }}>{hero.pickRate.toFixed(1)}%</span> <span style={{ color: '#888' }}>|</span> <span style={{ color: '#da3633' }}>{hero.banRate.toFixed(1)}%</span>
                  </div>
                  <div>
                    <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '11px' }}>{hero.avgKda}</span>
                    <span style={{ display:'block', fontSize:'10px', color:'#888' }}>({hero.kdaRatio}:1)</span>
                  </div>
                  <div style={{ fontFamily: 'monospace', color: '#ccc' }}>{hero.avgCs}</div>
                  <div style={{ fontFamily: 'monospace', color: '#da3633' }}>{hero.avgDpm}</div>
                  <div style={{ fontFamily: 'monospace', color: '#f1c40f' }}>{hero.avgGold}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {showPatchModal && (
        <RolePatchModal 
          role={selectedRole} 
          onClose={() => setShowPatchModal(false)} 
        />
      )}

    </div>
  );
};

const RoleStatItem = ({ label, value, color, icon }: any) => (
  <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end' }}>
    <span style={{ fontSize:'10px', color:'#ccc', marginBottom:'2px', display:'flex', alignItems:'center', gap:'4px' }}>
      {icon} {label}
    </span>
    <span style={{ fontSize:'14px', fontWeight:'bold', color: color, fontFamily:'monospace' }}>
      {value}
    </span>
  </div>
);