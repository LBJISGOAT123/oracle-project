// ==========================================
// FILE PATH: /src/components/battle/spectate/DraftScreen.tsx
// ==========================================
import React from 'react';
import { X } from 'lucide-react';
import { GameIcon } from '../../common/GameIcon';
import { SpeedButton, BanCard } from './SpectateUI';

export const DraftScreen: React.FC<any> = ({ match, heroes, onClose, setSpeed, gameState, onBanClick }) => {
  const { blueTeam, redTeam, draft, bans } = match;
  const timer = Math.ceil(draft?.timer || 0);
  const turn = draft?.turnIndex || 0;
  const isBanPhase = turn < 10;

  // 밴 목록 채우기 (빈칸 포함 5개)
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

  const TeamPickColumn = ({ team, side, players }: any) => (
    <div style={{ width:'48%' }}>
      <h3 style={{ color: side === 'BLUE' ? '#58a6ff' : '#e84057', borderBottom:`2px solid ${side === 'BLUE' ? '#58a6ff' : '#e84057'}`, paddingBottom:'5px', textAlign: side==='RED'?'right':'left', fontSize:'16px' }}>
        {side} TEAM
      </h3>
      {players.map((p:any, i:number) => {
        const teamIdx = side === 'BLUE' ? 0 : 1;
        const isPicking = (!isBanPhase && activeTeam === teamIdx && activeSlot === i);
        const isBanning = (isBanPhase && activeBanTeam === teamIdx && activeBanSlot === i);
        const isActive = isPicking || isBanning;
        const glowColor = isBanning ? 'rgba(255, 77, 77, 0.4)' : (side==='BLUE' ? 'rgba(88, 166, 255, 0.4)' : 'rgba(232, 64, 87, 0.4)');

        return (
          <div key={i} style={{ 
            marginBottom:'8px', display:'flex', flexDirection: side==='RED'?'row-reverse':'row', alignItems:'center', gap:'10px', 
            background: isActive ? `linear-gradient(${side==='BLUE'?'90deg':'-90deg'}, ${glowColor}, transparent)` : '#161b22', 
            border: isActive ? `1px solid ${side==='BLUE'?'#58a6ff':'#e84057'}` : '1px solid transparent',
            padding:'8px', borderRadius:'6px', transition: 'all 0.3s', transform: isActive ? 'scale(1.02)' : 'scale(1)'
          }}>
            <GameIcon id={p.heroId} size={40} shape="square" />
            <div style={{ textAlign: side==='RED'?'right':'left', color: p.heroId ? '#fff' : '#555' }}>
              <div style={{ fontSize:'12px', fontWeight:'bold' }}>{p.name}</div>
              <div style={{ fontSize:'10px', color:'#888' }}>{p.lane}</div>
              {p.heroId && <div style={{ fontSize:'11px', color: side==='BLUE'?'#58a6ff':'#e84057', fontWeight:'bold', marginTop:'2px' }}>{getHeroName(p.heroId)}</div>}
              {isBanning && <div style={{ fontSize:'9px', color:'#ff4d4d', fontWeight:'bold' }}>금지 중...</div>}
              {isPicking && <div style={{ fontSize:'9px', color:'#fff', fontWeight:'bold' }}>선택 중...</div>}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', alignItems:'center', background:'#0d1117', overflowY:'auto' }}>
      <div style={{ width:'100%', padding:'15px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ display:'flex', gap:'6px', width:'200px' }}>
           {[1, 5, 10, 15].map(s => <SpeedButton key={s} label={`${s}x`} speed={s} currentSpeed={gameState.gameSpeed} setSpeed={setSpeed} />)}
        </div>
        <button onClick={onClose} style={{ background:'none', border:'none', color:'#fff', cursor:'pointer' }}><X size={28}/></button>
      </div>

      <div style={{ textAlign:'center', marginBottom:'20px' }}>
        <h2 style={{ color:'#fff', fontSize:'24px', margin:'0 0 10px 0' }}>DRAFT PHASE</h2>
        <div style={{ color: isBanPhase ? '#e84057' : '#fff', fontSize:'14px', marginBottom:'5px' }}>
            {isBanPhase ? '챔피언 금지 진행 중...' : '챔피언 선택 진행 중...'}
        </div>
        <div style={{ fontSize:'36px', fontWeight:'900', color: timer <= 10 ? '#e74c3c' : '#fff' }}>{timer}</div>
      </div>

      <div style={{ display:'flex', justifyContent:'space-between', width:'90%', maxWidth:'600px', marginBottom:'30px' }}>
        <div style={{ display:'flex', gap:'4px' }}>
          {blueBans.map((id, i) => <BanCard key={i} heroId={id} heroes={heroes} isActive={isBanPhase && activeBanTeam === 0 && activeBanSlot === i} onClick={onBanClick} />)}
        </div>
        <div style={{ display:'flex', gap:'4px' }}>
          {redBans.map((id, i) => <BanCard key={i} heroId={id} heroes={heroes} isActive={isBanPhase && activeBanTeam === 1 && activeBanSlot === i} onClick={onBanClick} />)}
        </div>
      </div>

      <div style={{ display:'flex', width:'100%', maxWidth:'800px', justifyContent:'space-between', padding:'0 20px', paddingBottom:'40px' }}>
        <TeamPickColumn team={0} side="BLUE" players={blueTeam} />
        <TeamPickColumn team={1} side="RED" players={redTeam} />
      </div>
    </div>
  );
};