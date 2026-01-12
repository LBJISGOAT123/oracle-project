import React from 'react';
import { X, Shield, Swords, Zap, Crosshair, Skull } from 'lucide-react';
import { GameIcon } from '../../common/GameIcon';
import { SpeedButton, BanCard } from './SpectateUI';

export const DraftScreen: React.FC<any> = ({ match, heroes, onClose, setSpeed, gameState, onBanClick }) => {
  const { blueTeam, redTeam, draft, bans } = match;
  const timer = Math.ceil(draft?.timer || 0);
  const turn = draft?.turnIndex || 0;
  const isBanPhase = turn < 10;

  // 밴 목록 채우기
  const fillBans = (arr: string[]) => {
    const res = [...(arr || [])];
    while(res.length < 5) res.push('');
    return res;
  };
  const blueBans = fillBans(bans?.blue);
  const redBans = fillBans(bans?.red);

  // 픽 순서 (스네이크)
  const PICK_ORDER = [
    {team: 0, slot: 0}, {team: 1, slot: 0}, {team: 1, slot: 1}, {team: 0, slot: 1}, 
    {team: 0, slot: 2}, {team: 1, slot: 2}, {team: 1, slot: 3}, {team: 0, slot: 3}, 
    {team: 0, slot: 4}, {team: 1, slot: 4}
  ];

  let activeTeam = -1; 
  let activeSlot = -1; 

  if (!isBanPhase && (turn - 10) < PICK_ORDER.length) {
    const order = PICK_ORDER[turn - 10];
    activeTeam = order.team;
    activeSlot = order.slot;
  }

  const activeBanSlot = isBanPhase ? Math.floor(turn / 2) : -1;
  const activeBanTeam = isBanPhase ? (turn % 2) : -1;
  const getHeroName = (id: string) => heroes.find((h: any) => h.id === id)?.name || '';

  // [핵심] 게임 컨셉에 맞는 포지션 명칭 및 아이콘 변환
  const getRoleDisplay = (lane: string) => {
    switch(lane) {
      case 'TOP': return { label: '집행관', icon: <Shield size={10}/>, color: '#e74c3c' };
      case 'JUNGLE': return { label: '추적자', icon: <Swords size={10}/>, color: '#2ecc71' };
      case 'MID': return { label: '선지자', icon: <Zap size={10}/>, color: '#3498db' };
      case 'BOT': return { label: '신살자', icon: <Crosshair size={10}/>, color: '#f1c40f' };
      default: return { label: '수호기사', icon: <Skull size={10}/>, color: '#9b59b6' };
    }
  };

  // 모바일 최적화 픽 슬롯
  const PickSlot = ({ player, side, isActive }: any) => {
    const roleInfo = getRoleDisplay(player.lane);
    const borderColor = side === 'BLUE' ? '#58a6ff' : '#e84057';
    
    return (
      <div style={{ 
        display:'flex', alignItems:'center', gap:'8px', 
        background: isActive ? '#1f242e' : '#161b22', 
        border: isActive ? `1px solid ${borderColor}` : '1px solid #333',
        padding:'6px', borderRadius:'6px', 
        height: '48px', overflow:'hidden', position:'relative',
        marginBottom: '6px'
      }}>
        {/* 영웅 아이콘 */}
        <div style={{ position:'relative', width:'36px', height:'36px', flexShrink:0 }}>
          {player.heroId ? (
            <GameIcon id={player.heroId} size={36} shape="rounded" />
          ) : (
            <div style={{ width:'100%', height:'100%', background:'#222', borderRadius:'8px', border:'1px dashed #444' }} />
          )}
          {isActive && (
            <div style={{ position:'absolute', inset:0, border:`2px solid ${borderColor}`, borderRadius:'8px', animation:'pulse 1s infinite' }} />
          )}
        </div>

        {/* 정보 텍스트 */}
        <div style={{ flex:1, minWidth:0, display:'flex', flexDirection:'column', justifyContent:'center' }}>
          {/* 영웅 이름 / 상태 */}
          <div style={{ fontSize:'12px', fontWeight:'bold', color: player.heroId ? '#fff' : '#666', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
            {player.heroId ? getHeroName(player.heroId) : (isActive ? '선택 중...' : '대기 중')}
          </div>
          
          {/* 유저 닉네임 (요청하신 부분) */}
          <div style={{ fontSize:'10px', color:'#ccc', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', marginTop:'1px' }}>
            {player.name}
          </div>

          {/* 포지션 (게임 컨셉 적용) */}
          <div style={{ fontSize:'9px', color: roleInfo.color, display:'flex', alignItems:'center', gap:'3px', marginTop:'2px', fontWeight:'bold' }}>
            {roleInfo.icon} {roleInfo.label}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ 
      position: 'fixed', inset: 0, background: '#0f0f0f', zIndex: 10000,
      display: 'flex', flexDirection: 'column'
    }}>
      
      {/* 1. 상단 컨트롤 & 타이머 */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px', background:'#1a1a1a', borderBottom:'1px solid #333' }}>
        <div style={{ display:'flex', gap:'4px' }}>
           {[1, 10, 60].map(s => <SpeedButton key={s} label={`${s}x`} speed={s} currentSpeed={gameState.gameSpeed} setSpeed={setSpeed} />)}
        </div>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:'24px', fontWeight:'900', color: timer <= 5 ? '#da3633' : '#fff' }}>{timer}</div>
          <div style={{ fontSize:'10px', color: isBanPhase ? '#e84057' : '#58a6ff', fontWeight:'bold' }}>
            {isBanPhase ? '금지 단계 (BAN)' : '선택 단계 (PICK)'}
          </div>
        </div>
        <button onClick={onClose} style={{ background:'none', border:'none', color:'#888', cursor:'pointer' }}><X size={24}/></button>
      </div>

      {/* 2. 밴 카드 영역 */}
      <div style={{ display:'flex', justifyContent:'space-between', padding:'10px 15px', background:'#1a1a1a', borderBottom:'1px solid #333' }}>
        <div style={{ display:'flex', gap:'4px' }}>
          {blueBans.map((id, i) => (
            <BanCard key={i} heroId={id} heroes={heroes} isActive={isBanPhase && activeBanTeam === 0 && activeBanSlot === i} onClick={onBanClick} />
          ))}
        </div>
        <div style={{ display:'flex', gap:'4px' }}>
          {redBans.map((id, i) => (
            <BanCard key={i} heroId={id} heroes={heroes} isActive={isBanPhase && activeBanTeam === 1 && activeBanSlot === i} onClick={onBanClick} />
          ))}
        </div>
      </div>

      {/* 3. 픽 리스트 (좌우 2분할, 스크롤 가능) */}
      <div style={{ flex: 1, overflowY:'auto', padding:'10px', display:'flex', gap:'10px' }}>
        {/* BLUE TEAM */}
        <div style={{ flex: 1, display:'flex', flexDirection:'column' }}>
          <div style={{ textAlign:'center', fontSize:'12px', fontWeight:'bold', color:'#58a6ff', marginBottom:'8px', borderBottom:'2px solid #58a6ff', paddingBottom:'4px' }}>BLUE TEAM</div>
          {blueTeam.map((p:any, i:number) => (
            <PickSlot key={i} player={p} side="BLUE" isActive={!isBanPhase && activeTeam === 0 && activeSlot === i} />
          ))}
        </div>

        {/* RED TEAM */}
        <div style={{ flex: 1, display:'flex', flexDirection:'column' }}>
          <div style={{ textAlign:'center', fontSize:'12px', fontWeight:'bold', color:'#e84057', marginBottom:'8px', borderBottom:'2px solid #e84057', paddingBottom:'4px' }}>RED TEAM</div>
          {redTeam.map((p:any, i:number) => (
            <PickSlot key={i} player={p} side="RED" isActive={!isBanPhase && activeTeam === 1 && activeSlot === i} />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0% { opacity: 0.5; } 50% { opacity: 1; } 100% { opacity: 0.5; } }
      `}</style>
    </div>
  );
};
