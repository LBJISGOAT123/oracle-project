// ==========================================
// FILE PATH: /src/components/battle/spectate/map/MapObjects.tsx
// ==========================================
import React from 'react';
import { Skull, Zap, Shield } from 'lucide-react';
import { POI } from '../../../../engine/data/MapData';
import { TOWER_COORDS } from './MapConstants';

const TOWER_RANGE_DIA = 24; 
const NEXUS_RANGE_DIA = 30;

// --- 타워 렌더링 ---
export const TowerRender = ({ side, lane, tier, stats }: any) => {
  const isBlue = side === 'BLUE';
  const teamStats = isBlue ? stats.blue : stats.red;
  const brokenCount = teamStats.towers[lane.toLowerCase()];
  const isBroken = brokenCount >= tier;

  const isActive = brokenCount === tier - 1;
  const currentHp = teamStats.laneHealth ? teamStats.laneHealth[lane.toLowerCase()] : 0;
  
  const maxHpMap = { 1: 5000, 2: 7500, 3: 10000 };
  const maxHp = (maxHpMap as any)[tier] || 5000;
  const hpPercent = isActive ? (currentHp / maxHp) * 100 : 0;

  const laneCoords = isBlue ? TOWER_COORDS.BLUE : TOWER_COORDS.RED;
  const pos = (laneCoords as any)[lane][tier - 1];
  const color = isBlue ? '#58a6ff' : '#e84057';

  // [수정] 렌더링 안정성을 위해 React.Fragment 대신 div로 감싸거나,
  // 조건부 렌더링 시 null을 명확히 반환
  
  if (isBroken) {
    return (
      <div style={{
        position: 'absolute', left: `${pos.x}%`, top: `${pos.y}%`,
        transform: 'translate(-50%, -50%)',
        width: '12px', height: '12px',
        background: 'rgba(0,0,0,0.5)', border: '1px dashed #555', borderRadius: '50%',
        zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <div style={{width:'4px', height:'4px', background:'#333', borderRadius:'50%'}}/>
      </div>
    );
  }

  // 살아있는 타워 (범위 표시 + 본체)
  return (
    <div style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
      {/* 1. 사거리 표시 */}
      {isActive && (
        <div style={{
          position: 'absolute', 
          left: `${pos.x}%`, top: `${pos.y}%`,
          width: `${TOWER_RANGE_DIA}%`, 
          height: `${TOWER_RANGE_DIA}%`, 
          transform: 'translate(-50%, -50%)',
          borderRadius: '50%',
          border: `1px dashed ${color}AA`, 
          backgroundColor: `${color}1A`,   
          zIndex: 1 
        }} />
      )}

      {/* 2. 타워 아이콘 */}
      <div style={{
        position: 'absolute', left: `${pos.x}%`, top: `${pos.y}%`,
        transform: 'translate(-50%, -50%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 5,
        pointerEvents: 'auto'
      }}>
        <div style={{
          width: '18px', height: '18px', background: '#161b22', border: `2px solid ${color}`,
          borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 0 8px ${color}66`, position: 'relative'
        }}>
          <Shield size={10} color={color} fill={color} />
        </div>
        
        {isActive && (
          <div style={{ width: '24px', height: '3px', background: '#000', marginTop: '2px', borderRadius: '2px', overflow: 'hidden', border:'1px solid #000' }}>
              <div style={{ width: `${Math.max(0, hpPercent)}%`, height: '100%', background: hpPercent < 30 ? '#da3633' : color, transition:'width 0.2s' }} />
          </div>
        )}
      </div>
    </div>
  );
};

// --- 넥서스 렌더링 ---
export const NexusRender = ({ side, stats }: any) => {
  const isBlue = side === 'BLUE';
  const pos = isBlue ? TOWER_COORDS.BLUE.NEXUS : TOWER_COORDS.RED.NEXUS;
  const teamStats = isBlue ? stats.blue : stats.red;
  const color = isBlue ? '#58a6ff' : '#e84057';
  
  const currentHp = Math.max(0, teamStats.nexusHp);
  const maxHp = Math.max(1, teamStats.maxNexusHp);
  const hpPercent = (currentHp / maxHp) * 100;

  return (
    <div style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
      {/* 1. 넥서스 사거리 */}
      {currentHp > 0 && (
        <div style={{
            position: 'absolute', 
            left: `${pos.x}%`, top: `${pos.y}%`,
            width: `${NEXUS_RANGE_DIA}%`, 
            height: `${NEXUS_RANGE_DIA}%`,
            transform: 'translate(-50%, -50%)',
            borderRadius: '50%',
            border: `1px solid ${color}66`,
            backgroundColor: `${color}10`,
            zIndex: 1
        }} />
      )}

      {/* 2. 넥서스 본체 */}
      <div style={{
        position: 'absolute', left: `${pos.x}%`, top: `${pos.y}%`,
        transform: 'translate(-50%, -50%)', zIndex: 6,
        display: 'flex', flexDirection: 'column', alignItems: 'center', pointerEvents: 'auto'
      }}>
        <div style={{
          width: '36px', height: '36px', background: '#161b22', border: `3px solid ${color}`,
          borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 0 20px ${color}44`, position: 'relative'
        }}>
          <Zap size={18} color={color} fill={color} />
          {hpPercent <= 0 && (
             <div style={{ position:'absolute', inset:0, background:'#000000aa', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center' }}>
               <Skull size={20} color="#fff"/>
             </div>
          )}
        </div>
        <div style={{ marginTop:'4px', width:'50px', height:'5px', background:'#111', borderRadius:'3px', border:'1px solid #333', overflow:'hidden' }}>
           <div style={{ width: `${hpPercent}%`, height:'100%', background: hpPercent < 30 ? '#da3633' : color, transition: 'width 0.2s' }}/>
        </div>
        <span style={{ fontSize:'9px', fontWeight:'900', color:'#fff', textShadow:'0 0 2px #000', marginTop:'1px' }}>
          {Math.ceil(hpPercent)}%
        </span>
      </div>
    </div>
  );
};

export const MonsterRender = ({ type, objectives }: { type: 'colossus' | 'watcher', objectives: any }) => {
  if (!objectives || !objectives[type]) return null;
  const obj = objectives[type];
  
  if (obj.status !== 'ALIVE') return null;

  const pos = type === 'colossus' ? POI.BARON : POI.DRAGON;
  const color = type === 'colossus' ? '#a658ff' : '#e67e22'; 
  const icon = type === 'colossus' ? <Skull size={16} color="#fff"/> : <Zap size={16} color="#fff"/>;
  const hpPercent = (obj.hp / obj.maxHp) * 100;

  return (
    <div style={{
      position: 'absolute', left: `${pos.x}%`, top: `${pos.y}%`,
      transform: 'translate(-50%, -50%)', zIndex: 7,
      display: 'flex', flexDirection: 'column', alignItems: 'center'
    }}>
      <div style={{
        width: '32px', height: '32px', background: color, borderRadius: '50%',
        border: '3px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: `0 0 15px ${color}`
      }}>
        {icon}
      </div>
      <div style={{ 
        width:'40px', height:'5px', background:'#000', marginTop:'-10px', 
        borderRadius:'2px', overflow:'hidden', border:'1px solid #fff', zIndex:8 
      }}>
         <div style={{ width: `${hpPercent}%`, height:'100%', background: '#fff' }}/>
      </div>
      <span style={{ 
        marginTop:'2px', fontSize:'9px', fontWeight:'900', color:'#fff', 
        textShadow:'0 0 3px #000', background:'rgba(0,0,0,0.5)', padding:'0 4px', borderRadius:'4px'
      }}>
        {type === 'colossus' ? '거신병' : '주시자'}
      </span>
    </div>
  );
};
