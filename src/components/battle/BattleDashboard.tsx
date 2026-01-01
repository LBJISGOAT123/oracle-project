// ==========================================
// FILE PATH: /src/components/battle/BattleDashboard.tsx
// ==========================================

import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { Sword, Shield, Settings, Users, Zap, Heart, Crosshair, Crown, Activity, Monitor, Coins, Camera, Upload } from 'lucide-react';
import { GameIcon } from '../common/GameIcon';

export const BattleDashboard: React.FC = () => {
  const { gameState, updateBattleSettings } = useGameStore();
  const { battleSettings, godStats } = gameState;

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!battleSettings) return <div className="panel">시스템 로딩 중...</div>;

  const handleGodChange = (god: 'izman' | 'dante', field: string, value: any) => {
    updateBattleSettings({ [god]: { ...battleSettings[god], [field]: value } });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '25px', paddingBottom: '80px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: isMobile ? '0 5px' : '0' }}>
        <div style={{ background: '#58a6ff22', padding: '10px', borderRadius: '12px', border: '1px solid #58a6ff44' }}>
          <Settings size={24} color="#58a6ff" />
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: isMobile ? '18px' : '22px', fontWeight: '800', letterSpacing: '-0.5px', color:'#fff' }}>전장 오버라이드</h2>
          <p style={{ margin: 0, fontSize: isMobile ? '11px' : '13px', color: '#8b949e' }}>
            진영별 밸런스 및 하수인 스펙을 실시간으로 제어합니다.
          </p>
        </div>
      </div>

      <GlobalBattleStats stats={godStats} isMobile={isMobile} />

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '25px' }}>
        <GodPanel 
          side="RED" settings={battleSettings.izman} stats={godStats}
          color="#ff4d4d" glowColor="rgba(255, 77, 77, 0.1)"
          onChange={(field: string, val: any) => handleGodChange('izman', field, val)}
          icon={<Sword size={20} />} isMobile={isMobile}
        />
        <GodPanel 
          side="BLUE" settings={battleSettings.dante} stats={godStats}
          color="#4d94ff" glowColor="rgba(77, 148, 255, 0.1)"
          onChange={(field: string, val: any) => handleGodChange('dante', field, val)}
          icon={<Shield size={20} />} isMobile={isMobile}
        />
      </div>
    </div>
  );
};

// --- Sub Components ---

const MinionCard = ({ type, data, onChange, color }: any) => {
  let typeIcon = <Sword size={14} />;
  let typeLabel = "근거리";
  if (type === 'ranged') { typeIcon = <Crosshair size={14}/>; typeLabel = "원거리"; }
  if (type === 'siege') { typeIcon = <Shield size={14}/>; typeLabel = "공성"; }

  return (
    <div style={{ background: 'rgba(0,0,0,0.3)', border: `1px solid ${color}33`, borderRadius: '8px', padding: '10px', marginBottom: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', borderBottom:`1px dashed ${color}33`, paddingBottom:'5px' }}>
        <div style={{ fontWeight: 'bold', color: color, fontSize: '13px', display:'flex', alignItems:'center', gap:'6px' }}>{typeIcon} {data.label}</div>
        <span style={{ fontSize: '10px', color: '#666', background:'rgba(255,255,255,0.05)', padding:'2px 6px', borderRadius:'4px' }}>{typeLabel} TYPE</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom:'8px' }}>
        <MiniInput label="체력" icon={<Heart size={10} color="#2ecc71"/>} value={data.hp} onChange={(v:number) => onChange(type, 'hp', v)} />
        <MiniInput label="방어" icon={<Shield size={10} color="#3498db"/>} value={data.def} onChange={(v:number) => onChange(type, 'def', v)} />
        <MiniInput label="공격" icon={<Sword size={10} color="#e74c3c"/>} value={data.atk} onChange={(v:number) => onChange(type, 'atk', v)} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <MiniInput label="골드" icon={<Coins size={10} color="#f1c40f"/>} value={data.gold} onChange={(v:number) => onChange(type, 'gold', v)} />
        <MiniInput label="경험치" icon={<Zap size={10} color="#9b59b6"/>} value={data.xp} onChange={(v:number) => onChange(type, 'xp', v)} />
      </div>
    </div>
  );
};

const MiniInput = ({ label, icon, value, onChange }: any) => (
  <div style={{ background: '#0d1117', border: '1px solid #30363d', borderRadius: '4px', padding: '4px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#888' }}>{icon} {label}</div>
    <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} style={{ width: '40px', background: 'transparent', border: 'none', color: '#fff', fontSize: '11px', fontWeight: 'bold', textAlign: 'right', outline: 'none', padding: 0 }} />
  </div>
);

// [수정된 GodPanel: 왕관 클릭 시 업로드]
const GodPanel = ({ side, settings, color, glowColor, onChange, icon }: any) => {
  const isRed = side === 'RED';
  const { setCustomImage } = useGameStore();
  const godId = isRed ? 'god_izman' : 'god_dante';

  // 왕관 호버 상태 관리
  const [isCrownHover, setIsCrownHover] = useState(false);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if(file) {
        const reader = new FileReader();
        reader.onloadend = () => { if(typeof reader.result === 'string') setCustomImage(godId, reader.result); };
        reader.readAsDataURL(file);
    }
  };

  return (
    <div style={{ background: 'linear-gradient(145deg, #121418 0%, #0d1117 100%)', borderRadius: '24px', border: `1px solid ${isRed ? '#4a1e1e' : '#1e3a5f'}`, boxShadow: `0 20px 40px rgba(0,0,0,0.3), inset 0 0 60px ${glowColor}`, overflow: 'hidden' }}>

      {/* 헤더 */}
      <div style={{ padding: '25px', borderBottom: `1px solid ${color}22`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: `linear-gradient(90deg, ${color}11, transparent)` }}>

        {/* [왼쪽] 프로필 정보 (클릭 불가, 표시용) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>

          <div style={{ position: 'relative' }}>
            {/* 순수 이미지 표시용 GameIcon */}
            <GameIcon 
              id={godId} 
              size={64} 
              fallback={icon} 
              border={`2px solid ${color}44`} 
              shape="rounded"
            />
          </div>

          <div>
            <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'4px' }}>
              <span style={{ fontSize: '10px', fontWeight: '900', color: '#fff', background: color, padding:'2px 8px', borderRadius:'10px' }}>
                {side} FACTION
              </span>
            </div>
            <h3 style={{ margin: 0, fontSize: '24px', fontWeight: '900', color: '#fff', letterSpacing:'-0.5px' }}>{settings.name}</h3>
          </div>
        </div>

        {/* [오른쪽] 왕관 아이콘 (업로드 버튼) */}
        <div 
          onMouseEnter={() => setIsCrownHover(true)}
          onMouseLeave={() => setIsCrownHover(false)}
          style={{ position: 'relative' }}
        >
          <label style={{ cursor: 'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>

            {/* 호버 시 '사진 변경' 텍스트 표시 */}
            {isCrownHover && (
              <span style={{ 
                position: 'absolute', right: '45px', 
                fontSize: '11px', color: color, fontWeight: 'bold', 
                whiteSpace: 'nowrap', background: '#161b22', padding: '4px 8px', borderRadius: '4px', border: `1px solid ${color}44`
              }}>
                사진 변경
              </span>
            )}

            {/* 왕관 아이콘 */}
            <Crown 
              size={32} 
              color={color} 
              style={{ 
                opacity: isCrownHover ? 1 : 0.3, // 호버시 밝아짐
                transform: isCrownHover ? 'scale(1.1) rotate(15deg)' : 'rotate(15deg)', // 호버시 커짐
                transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
              }} 
            />

            {/* 왕관 옆에 작은 카메라 뱃지 */}
            <div style={{ 
              position: 'absolute', bottom: -2, right: -2, 
              background: '#161b22', borderRadius: '50%', padding: '3px',
              border: `1px solid ${color}44`,
              opacity: isCrownHover ? 1 : 0.5
            }}>
              <Camera size={10} color={color}/>
            </div>

            {/* 숨겨진 파일 인풋 */}
            <input type="file" style={{display:'none'}} accept="image/*" onChange={handleUpload}/>
          </label>
        </div>

      </div>

      <div style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <CustomSlider label="전투 공격력 보정" icon={<Crosshair size={14}/>} value={settings.atkRatio} min={0.5} max={2.0} step={0.01} onChange={(v: number)=>onChange('atkRatio', v)} color={color} suffix="x" />
          <CustomSlider label="방어/체력 효율" icon={<Shield size={14}/>} value={settings.defRatio} min={0.5} max={2.0} step={0.01} onChange={(v: number)=>onChange('defRatio', v)} color={color} suffix="x" />
          <CustomSlider label="넥서스 최대 내구도" icon={<Heart size={14}/>} value={settings.hpRatio} min={5000} max={50000} step={1000} onChange={(v: number)=>onChange('hpRatio', v)} color={color} />
        </div>
        <div style={{ height: '1px', background: '#30363d' }} />
        <div>
          <SectionLabel icon={<Monitor size={12}/>} label="STRUCTURAL INTEGRITY" color="#8b949e" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop:'10px' }}>
            <TechInput label="수호자 생명력" value={settings.guardianHp} onChange={(v: number)=>onChange('guardianHp', v)} icon={<Crown size={14} color={color}/>} unit="HP" />
            <TechInput label="방어 타워 위력" value={settings.towerAtk} onChange={(v: number)=>onChange('towerAtk', v)} icon={<Crosshair size={14} color={color}/>} unit="DMG" />
          </div>
        </div>
        <div>
          <SectionLabel icon={<Users size={12}/>} label="MINION WAVES" color="#8b949e" />
          <div style={{ marginTop:'10px' }}>
            {settings.minions && (
              <>
                <MinionCard type="melee" data={settings.minions.melee} color={color} onChange={(t: string, f: string, v: number) => onChange('minions', { ...settings.minions, [t]: { ...settings.minions[t], [f]: v } })} />
                <MinionCard type="ranged" data={settings.minions.ranged} color={color} onChange={(t: string, f: string, v: number) => onChange('minions', { ...settings.minions, [t]: { ...settings.minions[t], [f]: v } })} />
                <MinionCard type="siege" data={settings.minions.siege} color={color} onChange={(t: string, f: string, v: number) => onChange('minions', { ...settings.minions, [t]: { ...settings.minions[t], [f]: v } })} />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const GlobalBattleStats = ({ stats }: any) => {
  const total = stats.totalMatches || 1;
  const redWinRate = ((stats.izmanWins / total) * 100).toFixed(1);
  const blueWinRate = ((stats.danteWins / total) * 100).toFixed(1);
  return (
    <div style={{ background: '#161b22', padding: '20px', borderRadius: '16px', border: '1px solid #30363d', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px', fontSize:'12px', color:'#8b949e', fontWeight:'bold' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'6px' }}><Activity size={14}/> 시뮬레이션 집계</div>
        <div>총 {total.toLocaleString()} 매치 분석됨</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ color: '#ff4d4d', fontWeight: '900', fontSize: '18px' }}>{redWinRate}%</span>
        <span style={{ color: '#555', fontSize: '12px', fontWeight: 'bold' }}>WIN RATE</span>
        <span style={{ color: '#4d94ff', fontWeight: '900', fontSize: '18px' }}>{blueWinRate}%</span>
      </div>
      <div style={{ width: '100%', height: '12px', background: '#21262d', borderRadius: '6px', overflow: 'hidden', display: 'flex', marginBottom:'20px' }}>
        <div style={{ width: `${redWinRate}%`, background: 'linear-gradient(90deg, #8a1c1c, #ff4d4d)', height: '100%' }}></div>
        <div style={{ width: '2px', background: '#000' }}></div>
        <div style={{ flex: 1, background: 'linear-gradient(90deg, #4d94ff, #1c4b8a)', height: '100%' }}></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1px 1fr', gap: '10px', alignItems: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'space-around' }}>
          <StatBox label="평균 KDA" value={stats.izmanAvgKills} color="#ff4d4d" align="center" />
          <StatBox label="승리" value={stats.izmanWins} color="#ff4d4d" align="center" />
        </div>
        <div style={{ width: '1px', height: '30px', background: '#30363d' }}></div>
        <div style={{ display: 'flex', justifyContent: 'space-around' }}>
          <StatBox label="승리" value={stats.danteWins} color="#4d94ff" align="center" />
          <StatBox label="평균 KDA" value={stats.danteAvgKills} color="#4d94ff" align="center" />
        </div>
      </div>
    </div>
  );
};

const StatBox = ({ label, value, color, align }: any) => (
  <div style={{ textAlign: align || 'left' }}>
    <div style={{ fontSize: '10px', color: '#8b949e', marginBottom: '2px' }}>{label}</div>
    <div style={{ fontSize: '16px', fontWeight: 'bold', color: color || '#fff', fontFamily: 'JetBrains Mono' }}>{value}</div>
  </div>
);

const SectionLabel = ({ icon, label, color }: any) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', fontWeight: '800', color: color, letterSpacing: '1px' }}>
    {icon} {label}
  </div>
);

const TechInput = ({ label, value, onChange, icon, unit }: any) => (
  <div style={{ background: '#0d1117', borderRadius: '12px', border: '1px solid #30363d', padding: '12px 15px', display: 'flex', flexDirection: 'column', gap: '6px', transition: 'all 0.2s' }}
  onMouseEnter={e => e.currentTarget.style.borderColor = '#58a6ff'} onMouseLeave={e => e.currentTarget.style.borderColor = '#30363d'}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#8b949e', fontWeight:'600' }}>{icon} {label}</div>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <input type="number" value={value} onChange={(e)=>onChange(Number(e.target.value))} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '18px', fontWeight: '800', outline: 'none', width: '100%', fontFamily: 'JetBrains Mono' }} />
      {unit && <span style={{ fontSize: '10px', color: '#555', fontWeight: 'bold' }}>{unit}</span>}
    </div>
  </div>
);

const CustomSlider = ({ label, icon, value, min, max, step, onChange, color, suffix }: any) => (
  <div>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ccc', fontSize: '12px', fontWeight:'bold' }}>{icon} {label}</div>
      <span style={{ color: color, fontFamily: 'JetBrains Mono', fontWeight: '800', fontSize: '14px', background:`${color}11`, padding:'2px 6px', borderRadius:'4px' }}>
        {suffix === 'x' ? 'x' : ''}{value.toLocaleString()}{suffix !== 'x' ? suffix : ''}
      </span>
    </div>
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e)=>onChange(parseFloat(e.target.value))} style={{ width: '100%', accentColor: color, height: '6px', cursor: 'pointer', background: '#1c1c1f', borderRadius: '3px', outline: 'none' }} />
    </div>
  </div>
);