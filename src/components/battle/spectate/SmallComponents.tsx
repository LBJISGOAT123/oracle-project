// === FILE: /src/components/battle/spectate/SmallComponents.tsx ===

// ==========================================
// FILE PATH: /src/components/battle/spectate/SmallComponents.tsx
// ==========================================
import React from 'react';
import { X, Ban, Skull, Eye } from 'lucide-react'; 
import { GameIcon } from '../../common/GameIcon';

export const SpeedButton = ({ label, speed, currentSpeed, setSpeed }: any) => (
  <button 
    onClick={() => setSpeed(speed)} 
    style={{ 
      flex: 1, padding: '4px 0', 
      background: currentSpeed === speed ? '#58a6ff' : '#1c1c1f', 
      border: `1px solid ${currentSpeed === speed ? '#58a6ff' : '#333'}`, 
      borderRadius: '4px', color: currentSpeed === speed ? '#000' : '#888', 
      fontSize: '10px', fontWeight: '800', cursor: 'pointer', height: '24px'
    }}
  >
    {label}
  </button>
);

export const BanCard = ({ heroId, heroes, onClick }: any) => {
  const isValid = heroId && typeof heroId === 'string' && heroId.length > 0;
  return (
    <div 
      onClick={() => isValid && onClick && onClick(heroId)} 
      style={{ position: 'relative', width: '22px', height: '22px', borderRadius: '3px', overflow: 'hidden', background:'#111', border:'1px solid #333', cursor: isValid ? 'pointer' : 'default' }}
    >
      {isValid ? (
        <>
          <div style={{ filter: 'grayscale(100%) brightness(0.5)' }}><GameIcon id={heroId} size={22} shape="square" /></div>
          <div style={{ position: 'absolute', top: '50%', left: '50%', width: '140%', height: '2px', backgroundColor: '#da3633', transform: 'translate(-50%, -50%) rotate(45deg)' }} />
        </>
      ) : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center' }}><Ban size={10} color="#333"/></div>}
    </div>
  );
};

export const NeutralObjBar = ({ obj, label, color, icon }: any) => {
  if (!obj) return null;
  const isAlive = obj.status === 'ALIVE';
  const percent = isAlive ? (obj.hp / obj.maxHp) * 100 : 0;
  return (
    <div style={{ flex: 1, background: '#121214', padding: '6px 10px', borderRadius: '4px', border: '1px solid #333' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', fontSize: '9px', fontWeight: 'bold' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: color }}>{icon} {label}</div>
        <span style={{ color: isAlive ? '#fff' : '#666' }}>{isAlive ? `${Math.ceil(obj.hp).toLocaleString()}` : 'SPAWN'}</span>
      </div>
      <div style={{ width: '100%', height: '3px', background: '#000', borderRadius: '1px', overflow: 'hidden' }}>
         <div style={{ width: `${percent}%`, height: '100%', background: isAlive ? color : '#333', transition: 'width 0.3s' }} />
      </div>
    </div>
  );
};

export const ObjectStatBox = ({ stats, color, side }: any) => {
  if (!stats) return null;
  const hpPercent = (stats.nexusHp / stats.maxNexusHp) * 100;
  const TowerIndicator = ({ label, brokenCount }: any) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9px', color:'#555' }}>
      <span style={{ width:'18px' }}>{label}</span>
      <div style={{ display: 'flex', gap: '1px' }}>
        {[1, 2, 3].map(tier => (
          <div key={tier} style={{ width: '6px', height: '6px', borderRadius: '1px', background: tier <= brokenCount ? '#222' : color, opacity: tier <= brokenCount ? 0.2 : 1 }} />
        ))}
      </div>
    </div>
  );
  return (
    <div style={{ background: '#121214', border: `1px solid ${color}22`, borderRadius: '6px', padding: '8px', flex: 1 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div>
          <div style={{ fontSize:'9px', color: color, fontWeight:'900', marginBottom:'2px' }}>{side}</div>
          <TowerIndicator label="TOP" brokenCount={stats.towers?.top || 0} />
          <TowerIndicator label="MID" brokenCount={stats.towers?.mid || 0} />
          <TowerIndicator label="BOT" brokenCount={stats.towers?.bot || 0} />
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:'4px', marginTop:'15px' }}>
           <div style={{ display:'flex', alignItems:'center', gap:'4px', fontSize:'11px', color:'#ccc', fontWeight:'bold' }}><Skull size={10} color="#7ee787"/> {stats.colossus || 0}</div>
           <div style={{ display:'flex', alignItems:'center', gap:'4px', fontSize:'11px', color:'#ccc', fontWeight:'bold' }}><Eye size={10} color="#a371f7"/> {stats.watcher || 0}</div>
        </div>
        <div style={{ textAlign:'right' }}>
           <div style={{ fontSize:'8px', color:'#666' }}>NEXUS</div>
           <div style={{ fontSize:'12px', fontWeight:'900', color: hpPercent < 30 ? '#da3633' : '#fff' }}>{Math.max(0, Math.ceil(stats.nexusHp)).toLocaleString()}</div>
           <div style={{ width:'50px', height:'3px', background:'#222', borderRadius:'1px', marginTop:'2px', overflow:'hidden' }}>
              <div style={{ width:`${hpPercent}%`, height:'100%', background: hpPercent < 30 ? '#da3633' : color }} />
           </div>
        </div>
      </div>
    </div>
  );
};

export const PlayerCard = ({ p, isSelected, onClick, heroName, teamColor }: any) => {
  if (!p) return null;
  const currentHp = p.currentHp || 0;
  const maxHp = p.maxHp || 1;
  const hpPercent = (currentHp / maxHp) * 100;
  const isDead = currentHp <= 0;
  
  return (
    <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 8px', background: isSelected ? `${teamColor}15` : '#161b22', borderRadius: '4px', border: isSelected ? `1px solid ${teamColor}` : '1px solid #30363d', marginBottom: '4px', cursor: 'pointer', height: '34px', opacity: isDead ? 0.6 : 1, filter: isDead ? 'grayscale(0.8)' : 'none', position: 'relative', overflow:'hidden' }}>
      <div style={{ position: 'relative', display:'flex', alignItems:'center', gap:'8px' }}>
        <GameIcon id={p.heroId || ''} size={28} shape="rounded" />
        <div>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#fff' }}>{heroName}</div>
          <div style={{ fontSize: '9px', color: '#8b949e' }}>{p.name}</div>
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#fff' }}>{p.kills}/{p.deaths}/{p.assists}</div>
        <div style={{ fontSize: '9px', color: '#8b949e' }}>{((p.gold||0)/1000).toFixed(1)}k | {p.cs||0}cs</div>
      </div>
      <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '2px', background: 'rgba(0,0,0,0.3)' }}>
        <div style={{ width: `${hpPercent}%`, height: '100%', background: hpPercent < 30 ? '#da3633' : teamColor }} />
      </div>
    </div>
  );
};

export const DraftScreen = ({ match, heroes, onClose }: { match: any, heroes: any[], onClose: () => void }) => {
  // [Safety] match가 null일 경우를 대비해 기본값 설정
  const safeMatch = match || {};
  const blueTeam = safeMatch.blueTeam || [];
  const redTeam = safeMatch.redTeam || [];
  
  // draft 객체가 없으면 기본적으로 0으로 처리 (Crash 방지)
  const timer = Math.ceil(safeMatch.draft?.timer || 0);
  const turn = safeMatch.draft?.turnIndex || 0;
  
  const isPickPhase = turn >= 10;
  const isBanPhase = turn < 10;

  // 현재 픽 순서 계산 (하이라이트용)
  const pickIndex = isPickPhase ? turn - 10 : -1;
  const currentPickTeam = pickIndex >= 0 && pickIndex % 2 === 0 ? 'BLUE' : 'RED';
  const currentPickSlot = pickIndex >= 0 ? Math.floor(pickIndex / 2) : -1;

  const DraftPlayerSlot = ({ player, index, side }: { player: any, index: number, side: 'BLUE' | 'RED' }) => {
    if (!player) return <div style={{ height:'50px' }}></div>; // 플레이어 데이터 없으면 빈 공간

    const isPicking = isPickPhase && currentPickTeam === side && currentPickSlot === index;
    const isPicked = !!player.heroId; // 이미 픽이 되었는지

    return (
      <div style={{
        marginBottom:'8px', 
        display:'flex', gap:'10px', alignItems:'center', 
        flexDirection: side === 'RED' ? 'row-reverse' : 'row',
        opacity: isPicked ? 1 : 0.5, // 픽 전에는 반투명
        transition: '0.2s',
        transform: isPicking ? 'scale(1.05)' : 'scale(1)'
      }}>
        <div style={{
          border: isPicking ? `2px solid ${side === 'BLUE' ? '#58a6ff' : '#e84057'}` : '1px solid #333',
          borderRadius: '12px',
          boxShadow: isPicking ? `0 0 15px ${side === 'BLUE' ? '#58a6ff' : '#e84057'}44` : 'none',
          position: 'relative'
        }}>
          {/* 영웅 ID가 없으면 물음표 렌더링 (GameIcon 내부 처리) */}
          <GameIcon id={player.heroId || ''} size={50} shape="square"/>
          
          {/* 픽 중일 때 로딩 인디케이터 */}
          {isPicking && (
            <div style={{ position:'absolute', inset:0, border:'2px solid #fff', borderRadius:'10px', animation:'pulse 1s infinite' }} />
          )}
        </div>
        <div style={{ textAlign: side === 'RED' ? 'right' : 'left' }}>
          <div style={{ fontSize:'12px', fontWeight:'bold', color: isPicking ? '#fff' : '#aaa' }}>{player.name}</div>
          <div style={{ fontSize:'10px', color: '#666' }}>{player.lane}</div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'#0d1117' }}>
      <button onClick={onClose} style={{ position:'absolute', right:'20px', top:'20px', background:'none', border:'none', color:'#fff', cursor:'pointer' }}><X size={30}/></button>
      
      <div style={{ marginBottom:'40px', textAlign:'center' }}>
        <h2 style={{ color:'#fff', fontSize:'24px', margin:'0 0 10px 0' }}>DRAFT PHASE</h2>
        <div style={{ fontSize:'14px', color:'#888', marginBottom:'5px' }}>
            {isBanPhase ? '⛔ 챔피언 금지 진행 중...' : '⚔️ 챔피언 선택 진행 중...'}
        </div>
        <div style={{ fontSize:'32px', fontWeight:'900', color: timer <= 5 ? '#da3633' : '#fff' }}>{timer}</div>
      </div>

      <div style={{ display:'flex', width:'90%', maxWidth:'800px', justifyContent:'space-between' }}>
        {/* BLUE TEAM */}
        <div style={{ width:'40%', color:'#58a6ff' }}>
          <h3 style={{ borderBottom:'1px solid #58a6ff44', paddingBottom:'10px', marginBottom:'15px', margin:0 }}>BLUE TEAM</h3>
          {blueTeam.map((p: any, i: number) => <DraftPlayerSlot key={i} player={p} index={i} side="BLUE" />)}
        </div>

        {/* RED TEAM */}
        <div style={{ width:'40%', color:'#e84057', textAlign:'right' }}>
          <h3 style={{ borderBottom:'1px solid #e8405744', paddingBottom:'10px', marginBottom:'15px', margin:0 }}>RED TEAM</h3>
          {redTeam.map((p: any, i: number) => <DraftPlayerSlot key={i} player={p} index={i} side="RED" />)}
        </div>
      </div>
    </div>
  );
};
