import React from 'react';
import { GameIcon } from '../../common/GameIcon';
import { Ban, Skull, Eye, Shield, Sword, Target, Zap, Crosshair } from 'lucide-react';

export const SpeedButton = ({ label, speed, currentSpeed, setSpeed }: any) => (
  <button 
    onClick={() => setSpeed(speed)} 
    style={{ 
      flex: 1, padding: '6px 0', 
      background: currentSpeed === speed ? '#00b894' : '#2d3436', 
      border: `1px solid ${currentSpeed === speed ? '#00b894' : '#444'}`, 
      borderRadius: '4px', color: '#fff', 
      fontSize: '10px', fontWeight: 'bold', cursor: 'pointer', height: '28px'
    }}
  >
    {label}
  </button>
);

export const BanCard = ({ heroId, heroes, onClick }: any) => {
  return (
    <div 
      onClick={() => heroId && onClick && onClick(heroId)}
      style={{ 
        width: '30px', height: '30px', borderRadius: '4px', overflow: 'hidden', 
        background:'#1e1e1e', border: '1px solid #444', position:'relative',
        display:'flex', alignItems:'center', justifyContent:'center',
        flexShrink: 0
      }}
    >
      {heroId ? (
        <>
          <div style={{ filter: 'grayscale(100%) opacity(0.7)' }}><GameIcon id={heroId} size={30} shape="square" /></div>
          <div style={{ position: 'absolute', width: '140%', height: '2px', backgroundColor: '#d63031', transform: 'rotate(45deg)' }} />
        </>
      ) : <Ban size={12} color="#444"/>}
    </div>
  );
};

const RoleIcon = ({ lane }: { lane: string }) => {
  switch(lane) {
    case 'TOP': return <Shield size={9} color="#e74c3c"/>;
    case 'JUNGLE': return <Sword size={9} color="#2ecc71"/>;
    case 'MID': return <Zap size={9} color="#3498db"/>;
    case 'BOT': return <Crosshair size={9} color="#f1c40f"/>;
    default: return <Skull size={9} color="#9b59b6"/>;
  }
};

export const PlayerCard = ({ p, isSelected, onClick, heroName, teamColor }: any) => {
  if (!p) return null;

  const isDead = p.respawnTimer > 0;
  const kda = `${p.kills}/${p.deaths}/${p.assists}`;
  
  // [수정] 누적 골드 계산 로직 강화
  // totalGold가 있으면 쓰고, 없으면 (현재골드 + 아이템가치)로 추정해서 보여줌
  let totalGoldVal = p.totalGold;
  if (totalGoldVal === undefined || totalGoldVal < p.gold) {
      const itemsVal = (p.items || []).reduce((sum: number, i: any) => sum + (i.cost || 0), 0);
      totalGoldVal = Math.floor(p.gold + itemsVal);
  }
  
  const goldStr = `${(totalGoldVal / 1000).toFixed(1)}k`;
  
  const dmg = p.totalDamageDealt > 1000 
    ? `${(p.totalDamageDealt / 1000).toFixed(1)}k` 
    : p.totalDamageDealt;

  return (
    <div onClick={onClick} style={{ 
      display: 'flex', alignItems: 'center', 
      background: '#1e1e1e', 
      borderRadius: '4px', 
      border: isSelected ? `1px solid ${teamColor}` : '1px solid #333',
      borderLeft: `3px solid ${teamColor}`, 
      marginBottom: '6px', 
      padding: '4px 6px',
      cursor: 'pointer', 
      minHeight: '56px', 
      flexShrink: 0,
      opacity: isDead ? 0.5 : 1,
      position: 'relative',
      overflow: 'hidden',
      boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
    }}>
      <div style={{ position:'relative', marginRight:'8px', flexShrink: 0 }}>
        <GameIcon id={p.heroId} size={42} shape="rounded" />
        <div style={{ position:'absolute', bottom:-2, right:-2, background:'#000', color:'#fff', fontSize:'10px', fontWeight:'bold', padding:'0 3px', borderRadius:'3px', border:'1px solid #555' }}>
          {p.level}
        </div>
      </div>

      <div style={{ flex: 1, display:'flex', flexDirection:'column', justifyContent:'center', minWidth: 0, gap:'1px' }}>
        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
          {heroName}
        </div>
        <div style={{ fontSize: '10px', color: '#ccc', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
          {p.name}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'2px', fontSize:'9px', color:'#888', fontWeight:'bold' }}>
          <RoleIcon lane={p.lane} /> {p.lane}
        </div>
      </div>

      <div style={{ textAlign: 'right', marginLeft:'4px', display:'flex', flexDirection:'column', justifyContent:'center', minWidth:'55px', gap:'1px' }}>
        <div style={{ fontSize: '11px', color: '#fff', fontWeight: 'bold', letterSpacing:'-0.5px' }}>
          {kda}
        </div>
        <div style={{ fontSize: '10px', color: '#e89d40', fontWeight:'bold' }}>
          {goldStr}
        </div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'flex-end', gap:'4px', fontSize:'9px', color:'#aaa', marginTop:'2px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'1px' }} title="CS">
            <Target size={8} color="#ccc"/> {p.cs}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'1px' }} title="딜량">
            <Sword size={8} color="#ff7675"/> {dmg}
          </div>
        </div>
      </div>

      {isDead && (
        <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:10 }}>
          <span style={{ color:'#ff7675', fontWeight:'900', fontSize:'18px', textShadow:'0 0 3px #000' }}>{Math.ceil(p.respawnTimer)}</span>
        </div>
      )}
      
      <div style={{ position:'absolute', bottom:0, left:0, width:'100%', height:'2px', background:'#333' }}>
        <div style={{ width: `${(p.currentHp/p.maxHp)*100}%`, height:'100%', background: teamColor }} />
      </div>
    </div>
  );
};

export const ObjectStatBox = ({ stats, color, godName }: any) => {
  if (!stats) return null;
  const hpPercent = (stats.nexusHp / stats.maxNexusHp) * 100;
  
  const TowerLane = ({ label, brokenCount }: { label: string, brokenCount: number }) => (
    <div style={{ display:'flex', alignItems:'center', gap:'2px', fontSize:'9px', color:'#888', marginBottom:'2px' }}>
      <span style={{ width:'20px', fontWeight:'bold' }}>{label}</span>
      {[3, 2, 1].map(tier => {
        const isAlive = brokenCount < tier;
        return (
          <div key={tier} style={{
            width: '8px', height: '8px', borderRadius: '2px',
            background: isAlive ? color : '#222',
            border: isAlive ? 'none' : '1px solid #444',
            opacity: isAlive ? 1 : 0.5
          }} title={`${tier}차 타워 ${isAlive ? '생존' : '파괴됨'}`} />
        );
      })}
    </div>
  );

  return (
    <div style={{ background: '#1e1e1e', border: `1px solid ${color}44`, borderRadius: '4px', padding: '8px', flex: 1 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'4px' }}>
        <span style={{ color: color, fontWeight:'bold', fontSize:'11px', whiteSpace:'nowrap' }}>
          {godName}의 수호자
        </span>
        <span style={{ color: '#fff', fontSize:'10px', fontWeight:'bold' }}>
          {Math.ceil(stats.nexusHp).toLocaleString()}
        </span>
      </div>
      
      <div style={{ width:'100%', height:'4px', background:'#333', borderRadius:'2px', overflow:'hidden', marginBottom:'8px' }}>
         <div style={{ width:`${hpPercent}%`, height:'100%', background: color }} />
      </div>

      <div style={{ display:'flex', justifyContent:'space-between' }}>
        <div style={{ display:'flex', flexDirection:'column' }}>
          <TowerLane label="TOP" brokenCount={stats.towers?.top || 0} />
          <TowerLane label="MID" brokenCount={stats.towers?.mid || 0} />
          <TowerLane label="BOT" brokenCount={stats.towers?.bot || 0} />
        </div>

        <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', justifyContent:'center', gap:'4px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'4px', fontSize:'10px', color:'#ccc' }} title="처치한 거신병">
            <Skull size={10} color="#7ee787"/> {stats.colossus}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'4px', fontSize:'10px', color:'#ccc' }} title="처치한 주시자">
            <Eye size={10} color="#a371f7"/> {stats.watcher}
          </div>
        </div>
      </div>
    </div>
  );
};

export const NeutralObjPanel = ({ colossus, watcher }: any) => {
  const ObjItem = ({ obj, name, color }: any) => {
    if(!obj) return null;
    const isAlive = obj.status === 'ALIVE';
    return (
      <div style={{ flex:1, background: isAlive ? `${color}22` : '#1e1e1e', padding:'6px', borderRadius:'4px', border: `1px solid ${isAlive ? color : '#333'}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ color: isAlive ? '#fff' : '#777', fontWeight:'bold', fontSize:'11px' }}>{name}</span>
        <span style={{ color: isAlive ? color : '#555', fontSize:'10px', fontWeight:'bold' }}>
          {isAlive ? 'ALIVE' : 'DEAD'}
        </span>
      </div>
    );
  };
  return (
    <div style={{ display:'flex', gap:'6px', padding:'8px 10px', background:'#121212', borderTop:'1px solid #222', flexShrink: 0 }}>
      <ObjItem obj={colossus} name="거신병" color="#7ee787" />
      <ObjItem obj={watcher} name="주시자" color="#a371f7" />
    </div>
  );
};
