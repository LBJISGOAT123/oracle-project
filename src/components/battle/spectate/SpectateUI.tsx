// ==========================================
// FILE PATH: /src/components/battle/spectate/SpectateUI.tsx
// ==========================================
import React from 'react';
import { GameIcon } from '../../common/GameIcon';
import { Ban, Skull, Eye } from 'lucide-react';

// 1. 배속 버튼
export const SpeedButton = ({ label, speed, currentSpeed, setSpeed }: any) => (
  <button 
    onClick={() => setSpeed(speed)} 
    style={{ 
      flex: 1, padding: '4px 0', 
      background: currentSpeed === speed ? '#58a6ff' : '#1c1c1f', 
      border: `1px solid ${currentSpeed === speed ? '#58a6ff' : '#333'}`, 
      borderRadius: '4px', color: currentSpeed === speed ? '#000' : '#888', 
      fontSize: '10px', fontWeight: '800', cursor: 'pointer', height: '24px', minWidth:'35px'
    }}
  >
    {label}
  </button>
);

// 2. 밴 카드
export const BanCard = ({ heroId, heroes, isActive, onClick }: any) => {
  const hero = heroes.find((h: any) => h.id === heroId);
  return (
    <div 
      onClick={() => heroId && onClick && onClick(hero)}
      style={{ 
        display:'flex', flexDirection:'column', alignItems:'center', width:'42px', margin:'2px',
        opacity: (isActive || heroId) ? 1 : 0.3,
        transform: isActive ? 'scale(1.1)' : 'scale(1)',
        transition: 'all 0.3s',
        cursor: heroId ? 'pointer' : 'default',
        minHeight: '46px'
      }}
    >
      <div style={{ 
        position: 'relative', width: '32px', height: '32px', borderRadius: '4px', overflow: 'hidden', 
        background:'#111', 
        border: isActive ? '2px solid #ff4d4d' : '1px solid #444',
        boxShadow: isActive ? '0 0 10px rgba(255, 77, 77, 0.5)' : 'none',
        marginBottom: '2px'
      }}>
        {heroId ? (
          <>
            <div style={{ filter: 'grayscale(100%) brightness(0.4)' }}><GameIcon id={heroId} size={32} shape="square" /></div>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: '2px solid #da3633', boxSizing:'border-box', opacity:0.8 }}></div>
            <div style={{ position: 'absolute', top: '50%', left: '50%', width: '140%', height: '4px', backgroundColor: '#da3633', transform: 'translate(-50%, -50%) rotate(45deg)', boxShadow:'0 0 5px #000' }} />
          </>
        ) : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center' }}><Ban size={16} color={isActive ? "#ff4d4d" : "#333"}/></div>}
      </div>
      {hero && (
        <div style={{ fontSize:'9px', color:'#ff4d4d', fontWeight:'bold', textAlign:'center', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', width:'100%', textShadow: '0 0 2px black' }}>
          {hero.name}
        </div>
      )}
    </div>
  );
};

// 3. 플레이어 카드 (HP/MP 바 포함)
export const PlayerCard = ({ p, isSelected, onClick, heroName, teamColor }: any) => {
  const maxHp = p.maxHp || 1;
  const hpPercent = Math.max(0, Math.min(100, (p.currentHp / maxHp) * 100));
  const maxMp = p.maxMp || 300; 
  const mpPercent = Math.max(0, Math.min(100, (p.currentMp / maxMp) * 100));
  const isDead = p.respawnTimer > 0;

  return (
    <div onClick={onClick} style={{ 
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
      padding: '4px 8px', 
      background: isSelected ? `${teamColor}15` : '#161b22', 
      borderRadius: '4px', border: isSelected ? `1px solid ${teamColor}` : '1px solid #30363d', 
      marginBottom: '6px', cursor: 'pointer', height: '42px',
      position: 'relative', overflow:'hidden', opacity: isDead ? 0.8 : 1 
    }}>
      <div style={{ position: 'relative', display:'flex', alignItems:'center', gap:'8px', zIndex:2 }}>
        <div style={{ position:'relative' }}>
          <GameIcon id={p.heroId} size={32} shape="rounded" />
          {isDead && (
            <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', color:'#ff4d4d', fontWeight:'900', fontSize:'14px', textShadow:'0 0 2px black', borderRadius:'6px', border:'1px solid #da3633' }}>
              {Math.ceil(p.respawnTimer)}
            </div>
          )}
        </div>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: isDead ? '#777' : '#fff', lineHeight:'1.2' }}>{heroName}</div>
          <div style={{ fontSize: '9px', color: '#8b949e' }}>{p.name}</div>
        </div>
      </div>
      <div style={{ textAlign: 'right', zIndex:2 }}>
        <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#fff' }}>{p.kills}/{p.deaths}/{p.assists}</div>
        <div style={{ fontSize: '9px', color: '#8b949e' }}>{(p.gold/1000).toFixed(1)}k</div>
      </div>
      <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', display:'flex', flexDirection:'column' }}>
        <div style={{ width: '100%', height: '4px', background: 'rgba(0,0,0,0.5)' }}>
          <div style={{ width: `${hpPercent}%`, height: '100%', background: hpPercent < 30 ? '#da3633' : teamColor, transition: 'width 0.3s' }} />
        </div>
        <div style={{ width: '100%', height: '2px', background: 'rgba(0,0,0,0.5)', marginTop:'1px' }}>
          <div style={{ width: `${mpPercent}%`, height: '100%', background: '#3498db', transition: 'width 0.3s' }} />
        </div>
      </div>
    </div>
  );
};

// 4. 오브젝트 현황판
export const ObjectStatBox = ({ stats, color, side }: any) => {
  if (!stats) return null;
  const hpPercent = (stats.nexusHp / stats.maxNexusHp) * 100;
  const TowerStatusGrid = ({ towers }: any) => (
    <div style={{ display:'flex', flexDirection:'column', gap:'2px' }}>
      {['top', 'mid', 'bot'].map(lane => (
        <div key={lane} style={{ display:'flex', gap:'2px' }}>
          {[1, 2, 3].map(tier => {
            const isAlive = tier > (towers[lane] || 0);
            return (
              <div key={tier} style={{ width: '10px', height: '10px', borderRadius:'2px', background: isAlive ? color : '#222', border: isAlive ? `1px solid ${color}` : '1px solid #444', opacity: isAlive ? 1 : 0.3 }} />
            );
          })}
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ background: '#121214', border: `1px solid ${color}22`, borderRadius: '6px', padding: '10px', flex: 1, display:'flex', flexDirection:'column', justifyContent:'space-between' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'8px' }}>
        <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
          <div style={{ fontSize:'12px', color: color, fontWeight:'900' }}>{side}</div>
          <TowerStatusGrid towers={stats.towers} />
        </div>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'4px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'4px', fontSize:'11px', color:'#7ee787', fontWeight:'bold' }}><Skull size={10}/> <span>{stats.colossus || 0}</span></div>
          <div style={{ display:'flex', alignItems:'center', gap:'4px', fontSize:'11px', color:'#a371f7', fontWeight:'bold' }}><Eye size={10}/> <span>{stats.watcher || 0}</span></div>
        </div>
      </div>
      <div style={{ marginTop:'auto' }}>
        <div style={{ position:'relative', width:'100%', height:'8px', background:'#222', borderRadius:'2px', overflow:'hidden', border:'1px solid #333' }}>
           <div style={{ width:`${hpPercent}%`, height:'100%', background: hpPercent < 30 ? '#da3633' : color, transition:'width 0.3s' }} />
        </div>
      </div>
    </div>
  );
};

// ... (이전 코드: SpeedButton, BanCard, PlayerCard, ObjectStatBox 유지) ...

// [추가됨] 5. 중립 오브젝트 상태 패널 (거신병, 주시자 HP/젠시간)
export const NeutralObjPanel = ({ colossus, watcher, currentTime }: any) => {
  const ObjStatus = ({ obj, label, color, icon }: any) => {
    if(!obj) return null;
    const isAlive = obj.status === 'ALIVE';
    const hpPercent = isAlive ? (obj.hp / obj.maxHp) * 100 : 0;
    // 남은 시간 계산 (음수 방지)
    const respawnTime = Math.max(0, Math.ceil(obj.nextSpawnTime - currentTime));

    return (
      <div style={{ flex:1, background:'#161b22', border:'1px solid #333', borderRadius:'6px', padding:'8px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'4px', fontSize:'11px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'5px', color: color, fontWeight:'bold' }}>
            {icon} {label}
          </div>
          <span style={{ color: isAlive ? '#2ecc71' : '#888', fontWeight:'bold', fontSize:'10px' }}>
            {isAlive ? 'ALIVE' : `${respawnTime}s`}
          </span>
        </div>

        <div style={{ width:'100%', height:'6px', background:'#000', borderRadius:'3px', overflow:'hidden', position:'relative' }}>
          {isAlive ? (
            <div style={{ width:`${hpPercent}%`, height:'100%', background: color, transition:'width 0.2s' }} />
          ) : (
            <div style={{ width:'100%', height:'100%', background: '#333' }} /> 
          )}
        </div>

        {isAlive && (
          <div style={{ textAlign:'right', fontSize:'9px', color:'#aaa', marginTop:'2px' }}>
            {Math.ceil(obj.hp).toLocaleString()} HP
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ display:'flex', gap:'10px', padding:'8px', background:'#0a0a0c', borderTop:'1px dashed #333' }}>
      <ObjStatus obj={colossus} label="거신병" color="#7ee787" icon={<Skull size={12}/>} />
      <ObjStatus obj={watcher} label="주시자" color="#a371f7" icon={<Eye size={12}/>} />
    </div>
  );
};