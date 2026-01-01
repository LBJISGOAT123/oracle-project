// ==========================================
// FILE PATH: /src/components/battle/SpectateModal.tsx
// ==========================================

import React, { useState } from 'react';
import { X, Clock, Shield, Skull, Zap, Circle, Terminal, Swords, Briefcase, Crown, User, BarChart2, Activity, Coins, Ban } from 'lucide-react';
import { LiveMatch, LivePlayer, Item, TeamStats, Hero } from '../../types';
import { useGameStore } from '../../store/useGameStore';
import { GameIcon } from '../common/GameIcon';

interface Props { match: LiveMatch; onClose: () => void; }

export const SpectateModal: React.FC<Props> = ({ match, onClose }) => {
  const { heroes } = useGameStore(); 

  // 상태 관리
  const [selectedHeroId, setSelectedHeroId] = useState<string | null>(null);
  const [viewingItem, setViewingItem] = useState<Item | null>(null);
  const [viewingBanHero, setViewingBanHero] = useState<Hero | null>(null);

  const getHeroName = (id: string) => heroes.find(h => h.id === id)?.name || id;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const maxDamage = Math.max(...match.blueTeam.map(p=>p.totalDamageDealt), ...match.redTeam.map(p=>p.totalDamageDealt), 1);

  // --- 밴 상세 팝업 ---
  const BanDetailPopup = ({ hero, onClose }: { hero: Hero, onClose: () => void }) => {
    return (
      <div 
        onClick={onClose}
        style={{ 
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 11000, 
          display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px',
          backdropFilter: 'blur(3px)'
        }}
      >
        <div 
          onClick={e => e.stopPropagation()}
          style={{ 
            width: '280px', background: '#1c1c1f', borderRadius: '16px', border: '1px solid #da3633', 
            overflow: 'hidden', boxShadow: '0 10px 40px rgba(218, 54, 51, 0.2)', display:'flex', flexDirection:'column', alignItems:'center'
          }}
        >
          <div style={{ background:'#da3633', width:'100%', padding:'10px', textAlign:'center', color:'#fff', fontWeight:'bold', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px' }}>
            <Ban size={18}/> BANNED HERO
          </div>

          <div style={{ padding: '30px 20px', display:'flex', flexDirection:'column', alignItems:'center', gap:'15px' }}>
            <div style={{ position:'relative', width: '80px', height: '80px' }}>
              <GameIcon id={hero.id} size={80} shape="rounded" border="2px solid #444" fallback={<span style={{fontSize:'30px'}}>🧙‍♂️</span>} />
              {/* 팝업 내부에서도 빗금 표시 */}
              <div style={{ 
                position: 'absolute', top: '50%', left: '50%', width: '120%', height: '4px', 
                background: '#da3633', transform: 'translate(-50%, -50%) rotate(45deg)',
                boxShadow: '0 0 5px rgba(0,0,0,0.5)'
              }}></div>
            </div>

            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:'12px', color:'#da3633', fontWeight:'bold', border:'1px solid #da3633', borderRadius:'4px', padding:'2px 6px', display:'inline-block', marginBottom:'6px' }}>
                금지됨
              </div>
              <div style={{ fontSize:'20px', fontWeight:'bold', color:'#fff', marginBottom:'4px' }}>{hero.name}</div>
              <div style={{ fontSize:'13px', color:'#888' }}>{hero.role}</div>
            </div>
          </div>

          <button onClick={onClose} style={{ width: '100%', padding: '12px', background: '#252528', border: 'none', borderTop: '1px solid #333', color: '#ccc', cursor: 'pointer', fontWeight:'bold' }}>
            닫기
          </button>
        </div>
      </div>
    );
  };

  // --- [수정됨] 밴 카드 컴포넌트 (빗금 스타일) ---
  const BanCard = ({ heroId }: { heroId: string }) => {
    const hero = heroes.find(h => h.id === heroId);
    if (!hero) return null;

    return (
      <div 
        onClick={() => setViewingBanHero(hero)}
        title={`BANNED: ${hero.name}`} 
        style={{ 
          position: 'relative', width: '32px', height: '32px', cursor: 'pointer',
          transition: 'transform 0.1s',
          borderRadius: '6px',
          overflow: 'hidden' // 빗금이 튀어나오지 않게
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        {/* 1. 흑백 처리된 영웅 아이콘 */}
        <div style={{ filter: 'grayscale(100%) brightness(0.6)' }}>
          <GameIcon id={heroId} size={32} shape="square" border="1px solid #444" fallback={<span style={{fontSize:'12px'}}>🚫</span>} />
        </div>

        {/* 2. 붉은색 빗금 (CSS로 구현) */}
        <div style={{ 
          position: 'absolute', 
          top: '50%', left: '50%', 
          width: '150%', // 대각선 길이를 커버하기 위해 넉넉하게
          height: '3px', 
          backgroundColor: '#da3633', // 붉은색
          transform: 'translate(-50%, -50%) rotate(45deg)', // 중앙 정렬 후 45도 회전
          boxShadow: '0 0 2px #000', // 가시성을 위한 그림자
          pointerEvents: 'none' // 클릭 통과
        }} />
      </div>
    );
  };

  // --- 전장 현황판 ---
  const ObjectStatBox = ({ stats, color }: { stats: TeamStats, color: string }) => {
    const s = stats || { towers: { top: 0, mid: 0, bot: 0 }, colossus: 0, watcher: 0, fury: 0, nexusHp: 0, maxNexusHp: 5000 };

    const TowerIndicator = ({ label, brokenCount }: { label: string, brokenCount: number }) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color:'#888' }}>
        <span style={{ width:'24px' }}>{label}</span>
        <div style={{ display: 'flex', gap: '2px' }}>
          {[1, 2, 3].map(tier => (
            <div key={tier} style={{
              width: '8px', height: '8px', borderRadius: '1px',
              background: tier <= brokenCount ? '#333' : color, 
              opacity: tier <= brokenCount ? 0.3 : 1,
              border: `1px solid ${tier <= brokenCount ? '#444' : 'transparent'}`
            }} />
          ))}
        </div>
      </div>
    );

    const hpPercent = (s.nexusHp / s.maxNexusHp) * 100;

    return (
      <div style={{ background: '#161b22', border: `1px solid ${color}44`, borderRadius: '6px', padding: '10px', display:'flex', flexDirection:'column', justifyContent:'space-between' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'8px' }}>
          <div style={{ display:'flex', flexDirection:'column', gap:'2px' }}>
            <TowerIndicator label="TOP" brokenCount={s.towers?.top || 0} />
            <TowerIndicator label="MID" brokenCount={s.towers?.mid || 0} />
            <TowerIndicator label="BOT" brokenCount={s.towers?.bot || 0} />
          </div>
          <div style={{ textAlign:'right' }}>
             <div style={{ fontSize:'10px', color:'#888', marginBottom:'2px' }}><Crown size={10} style={{marginRight:2}}/> 수호자</div>
             <div style={{ fontSize:'12px', fontWeight:'bold', color: hpPercent < 30 ? '#da3633' : '#fff' }}>
               {Math.max(0, Math.ceil(s.nexusHp)).toLocaleString()}
             </div>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#ccc', borderTop:'1px dashed #333', paddingTop:'6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }} title="거신병 처치 수">
            <Skull size={12} color="#7ee787" /> <span style={{ fontWeight:'bold' }}>{s.colossus}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }} title="주시자 처치 수">
            <Circle size={12} color="#a371f7" /> <span style={{ fontWeight:'bold' }}>{s.watcher}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }} title="분노 스택">
            <Zap size={12} color="#f1c40f" /> <span style={{ fontWeight:'bold' }}>{s.fury}</span>
          </div>
        </div>
      </div>
    );
  };

  // --- 아이템 아이콘 ---
  const ItemIcon = ({ item, onClick }: { item: Item, onClick: (i: Item) => void }) => {
    const colors = { WEAPON: '#e74c3c', ARMOR: '#2ecc71', ACCESSORY: '#f1c40f', POWER: '#9b59b6' };
    const color = (colors as any)[item.type] || '#555';
    return (
      <div 
        onClick={(e) => { e.stopPropagation(); onClick(item); }}
        style={{ 
          width: '24px', height: '24px', borderRadius: '4px', background: `${color}22`, border: `1px solid ${color}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: color, cursor: 'pointer'
        }}
      >
        {item.type === 'WEAPON' ? <Swords size={12}/> : item.type === 'ARMOR' ? <Shield size={12}/> : item.type === 'POWER' ? <Zap size={12}/> : <Briefcase size={12}/>}
      </div>
    );
  };

  // --- 아이템 상세 팝업 ---
  const ItemDetailPopup = ({ item, onClose }: { item: Item, onClose: () => void }) => {
    if (!item) return null;
    const colors = { WEAPON: '#e74c3c', ARMOR: '#2ecc71', ACCESSORY: '#f1c40f', POWER: '#9b59b6' };
    const color = (colors as any)[item.type] || '#fff';

    return (
      <div 
        onClick={onClose}
        style={{ 
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 11000, 
          display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px',
          backdropFilter: 'blur(3px)'
        }}
      >
        <div 
          onClick={e => e.stopPropagation()}
          style={{ 
            width: '100%', maxWidth: '320px', background: '#1c1c1f', 
            borderRadius: '12px', border: `1px solid ${color}`, overflow: 'hidden',
            boxShadow: `0 10px 40px ${color}33`
          }}
        >
          <div style={{ padding: '15px', background: `${color}22`, borderBottom: `1px solid ${color}44` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <h3 style={{ margin: 0, color: color, fontSize: '16px', display:'flex', alignItems:'center', gap:'8px' }}>
                {item.type === 'WEAPON' ? <Swords size={16}/> : item.type === 'ARMOR' ? <Shield size={16}/> : <Briefcase size={16}/>}
                {item.name}
              </h3>
              <div style={{ color: '#f1c40f', fontWeight: 'bold', fontSize: '13px', display:'flex', alignItems:'center', gap:'4px' }}>
                <Coins size={12}/> {item.cost}
              </div>
            </div>
          </div>
          <div style={{ padding: '15px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
            {item.ad > 0 && <div style={{ color: '#e74c3c' }}>공격력 +{item.ad}</div>}
            {item.ap > 0 && <div style={{ color: '#9b59b6' }}>주문력 +{item.ap}</div>}
            {item.hp > 0 && <div style={{ color: '#2ecc71' }}>체력 +{item.hp}</div>}
            {item.armor > 0 && <div style={{ color: '#3498db' }}>방어력 +{item.armor}</div>}
            {item.crit > 0 && <div style={{ color: '#e67e22' }}>치명타 +{item.crit}%</div>}
            {item.speed > 0 && <div style={{ color: '#fff' }}>이동속도 +{item.speed}</div>}
          </div>
          {item.description && <div style={{ padding: '15px', borderTop: '1px solid #333', color: '#ccc', fontSize: '12px', lineHeight: '1.5', background: '#161b22' }}>{item.description}</div>}
          <button onClick={onClose} style={{ width: '100%', padding: '12px', background: '#252528', border: 'none', borderTop: '1px solid #333', color: '#888', cursor: 'pointer', fontSize: '13px' }}>닫기</button>
        </div>
      </div>
    );
  };

  // --- 플레이어 리스트 행 ---
  const PlayerRow = ({ p, isBlue }: { p: LivePlayer, isBlue: boolean }) => {
    const isSelected = selectedHeroId === p.heroId;
    const hpPercent = (p.currentHp / p.maxHp) * 100;
    const heroName = getHeroName(p.heroId);

    return (
      <div 
        onClick={() => setSelectedHeroId(isSelected ? null : p.heroId)}
        style={{ 
          display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', 
          borderBottom: '1px solid #30363d', cursor: 'pointer',
          background: isSelected ? (isBlue ? 'rgba(88, 166, 255, 0.2)' : 'rgba(232, 64, 87, 0.2)') 
                     : (isBlue ? 'rgba(88, 166, 255, 0.05)' : 'rgba(232, 64, 87, 0.05)'),
          borderLeft: isSelected ? `4px solid ${isBlue ? '#58a6ff' : '#e84057'}` : '4px solid transparent',
          transition: '0.2s'
        }}
      >
        <div style={{ position: 'relative' }}>
          {/* GameIcon 적용 */}
          <GameIcon id={p.heroId} size={36} shape="rounded" border={`1px solid ${isBlue ? '#58a6ff44' : '#e8405744'}`} fallback={<span style={{fontSize:'18px'}}>🧙‍♂️</span>} />

          <div style={{ position: 'absolute', bottom: -4, right: -4, background: '#000', color: '#fff', fontSize: '9px', padding: '1px 4px', borderRadius: '3px', border:'1px solid #555', fontWeight:'bold' }}>{p.level}</div>
          <div style={{ position:'absolute', bottom:-4, left:0, width:'100%', height:'3px', background:'#333', borderRadius:'2px', overflow:'hidden' }}>
            <div style={{ width:`${hpPercent}%`, height:'100%', background: hpPercent < 30 ? '#da3633' : '#2ecc71' }}/>
          </div>
        </div>
        <div style={{ flex: 1, minWidth:0 }}>
          <div style={{ display:'flex', justifyContent:'space-between' }}>
            <div style={{ fontWeight: 'bold', color: '#fff', fontSize:'12px' }}>{heroName}</div>
            <div style={{ fontSize:'12px', fontWeight:'bold', color: '#ccc' }}>{p.kills}/{p.deaths}/{p.assists}</div>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:'2px' }}>
            <div style={{ fontSize:'10px', color: '#888' }}>{p.name}</div>
            <div style={{ fontSize:'10px', color: '#e89d40' }}>{(p.gold/1000).toFixed(1)}k</div>
          </div>
        </div>
      </div>
    );
  };

  // --- 개인 분석 패널 ---
  const InspectorPanel = ({ p }: { p: LivePlayer }) => {
    const heroName = getHeroName(p.heroId);
    const hpPercent = (p.currentHp / p.maxHp) * 100;

    const kda = p.deaths === 0 ? (p.kills + p.assists) : (p.kills + p.assists) / p.deaths;
    let grade = 'C';
    let gradeColor = '#888';
    if (kda > 8) { grade = 'S+'; gradeColor = '#f1c40f'; }
    else if (kda > 5) { grade = 'A'; gradeColor = '#58a6ff'; }
    else if (kda > 3) { grade = 'B'; gradeColor = '#2ecc71'; }

    const personalLogs = [...match.logs].filter(log => log.message.includes(heroName)).reverse();

    return (
      <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'#121212' }}>
        <div style={{ padding:'15px', borderBottom:'1px solid #333', display:'flex', gap:'15px', alignItems:'center' }}>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:'10px', color:'#888', marginBottom:'2px' }}>KDA RATING</div>
            <div style={{ fontSize:'24px', fontWeight:'900', color:gradeColor, lineHeight:'1' }}>{grade}</div>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
              <span style={{ fontSize:'16px', fontWeight:'bold', color:'#fff' }}>{heroName}</span>
              <span style={{ fontSize:'11px', color:'#ccc' }}>{p.currentHp} / {p.maxHp} HP</span>
            </div>
            <div style={{ width:'100%', height:'12px', background:'#333', borderRadius:'3px', marginTop:'4px', overflow:'hidden', border:'1px solid #555' }}>
              <div style={{ width:`${hpPercent}%`, height:'100%', background: hpPercent<30?'#da3633':'#2ecc71', transition:'width 0.3s' }}/>
            </div>
          </div>
        </div>
        <div style={{ padding:'15px', borderBottom:'1px solid #333', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'15px' }}>
          <div>
            <div style={{ fontSize:'11px', color:'#8b949e', marginBottom:'6px', display:'flex', alignItems:'center', gap:'4px' }}><Briefcase size={12}/> 보유 아이템</div>
            <div style={{ display:'flex', gap:'4px' }}>
              {p.items.map((item, idx) => <ItemIcon key={idx} item={item} onClick={setViewingItem} />)}
              {Array(6 - p.items.length).fill(0).map((_, i) => <div key={i} style={{ width:'24px', height:'24px', background:'#222', borderRadius:'4px', border:'1px dashed #444' }}/>)}
            </div>
          </div>
          <div>
            <div style={{ fontSize:'11px', color:'#8b949e', marginBottom:'6px', display:'flex', alignItems:'center', gap:'4px' }}><BarChart2 size={12}/> 누적 딜량</div>
            <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
              <div style={{ flex:1, height:'6px', background:'#333', borderRadius:'3px' }}>
                <div style={{ width:`${(p.totalDamageDealt / maxDamage)*100}%`, height:'100%', background:'#da3633', borderRadius:'3px' }}/>
              </div>
              <span style={{ fontSize:'11px', color:'#da3633', fontWeight:'bold' }}>{p.totalDamageDealt.toLocaleString()}</span>
            </div>
          </div>
        </div>
        <div style={{ flex:1, overflowY:'auto', padding:'10px', background:'#0a0a0a', WebkitOverflowScrolling: 'touch' }}>
          <div style={{ fontSize:'11px', color:'#58a6ff', marginBottom:'8px', fontWeight:'bold', display:'flex', alignItems:'center', gap:'4px' }}><Activity size={12}/> 타임라인</div>
          {personalLogs.length === 0 ? <div style={{ color:'#555', fontSize:'11px', padding:'10px' }}>아직 기록이 없습니다.</div> : personalLogs.map((log, i) => (
            <div key={i} style={{ fontSize:'11px', marginBottom:'4px', color:'#ccc', borderLeft:'2px solid #444', paddingLeft:'8px' }}>
              <span style={{ color:'#666', marginRight:'6px' }}>{formatTime(log.time)}</span>
              {log.message}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const selectedPlayer = [...match.blueTeam, ...match.redTeam].find(p => p.heroId === selectedHeroId);
  const reversedGlobalLogs = [...match.logs].reverse();

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, background: '#050505', zIndex: 10000, display: 'flex', flexDirection: 'column' }}>

        {/* HEADER */}
        <div style={{ height: '50px', background: '#161b22', borderBottom: '1px solid #30363d', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flex:1, justifyContent:'center' }}>
            <div style={{ color: '#58a6ff', fontWeight: 'bold', fontSize: '18px' }}>{match.score.blue}</div>
            <div style={{ background: '#0d1117', padding: '4px 12px', borderRadius: '4px', border: '1px solid #30363d', display: 'flex', alignItems: 'center', gap: '6px', color: '#fff', fontSize: '14px', fontFamily: 'monospace' }}>
              <Clock size={14} color="#8b949e"/> {formatTime(match.currentDuration)}
            </div>
            <div style={{ color: '#e84057', fontWeight: 'bold', fontSize: '18px' }}>{match.score.red}</div>
          </div>
          <button onClick={onClose} style={{ position:'absolute', right:'15px', background: 'none', border: 'none', color: '#8b949e', cursor: 'pointer' }}><X size={24}/></button>
        </div>

        {/* BAN PICK BAR */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems:'center', padding: '8px 15px', background: '#0d1117', borderBottom: '1px solid #30363d' }}>

          {/* Blue Bans */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', color: '#58a6ff', fontWeight: 'bold', display:'flex', gap:'4px' }}>
              <Ban size={12}/> BAN
            </span>
            {match.bans.blue.map(id => <BanCard key={id} heroId={id} />)}
          </div>

          {/* Red Bans */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            {match.bans.red.map(id => <BanCard key={id} heroId={id} />)}
            <span style={{ fontSize: '10px', color: '#e84057', fontWeight: 'bold', display:'flex', gap:'4px' }}>
              BAN <Ban size={12}/> 
            </span>
          </div>

        </div>

        {/* CONTENT */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          <div style={{ flex: 1, overflowY: 'auto', padding: '10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', WebkitOverflowScrolling: 'touch' }}>
            <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
              <div style={{ fontSize:'10px', color:'#58a6ff', fontWeight:'bold', textAlign:'center', marginBottom:'4px' }}>BLUE TEAM</div>
              {match.blueTeam.map((p, i) => <PlayerRow key={i} p={p} isBlue={true} />)}
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
              <div style={{ fontSize:'10px', color:'#e84057', fontWeight:'bold', textAlign:'center', marginBottom:'4px' }}>RED TEAM</div>
              {match.redTeam.map((p, i) => <PlayerRow key={i} p={p} isBlue={false} />)}
            </div>
          </div>

          {/* 전장 현황판 */}
          {!selectedPlayer && (
            <div style={{ padding: '10px 15px', background: '#121212', borderTop: '1px solid #30363d', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'15px' }}>
               <ObjectStatBox stats={match.stats.blue} color="#58a6ff" />
               <ObjectStatBox stats={match.stats.red} color="#e84057" />
            </div>
          )}

          <div style={{ height: selectedPlayer ? '40%' : '35%', borderTop: '1px solid #30363d', display:'flex', flexDirection:'column' }}>
            {selectedPlayer ? (
              <div style={{ flex:1, display:'flex', flexDirection:'column' }}>
                <div onClick={() => setSelectedHeroId(null)} style={{ background:'#21262d', padding:'6px', textAlign:'center', cursor:'pointer', borderBottom:'1px solid #333' }}>
                  <span style={{ fontSize:'11px', color:'#8b949e', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px' }}><X size={12}/> 전체 로그로 돌아가기</span>
                </div>
                <InspectorPanel p={selectedPlayer} />
              </div>
            ) : (
              <div style={{ flex:1, display:'flex', flexDirection:'column', background:'#000' }}>
                <div style={{ padding: '8px 12px', background: '#21262d', borderBottom: '1px solid #333', display: 'flex', alignItems: 'center', justifyContent:'space-between' }}>
                  <span style={{ color: '#8b949e', fontSize: '11px', fontWeight: 'bold', display:'flex', alignItems:'center', gap:'6px' }}><Terminal size={12} /> 전체 게임 로그 (최신순)</span>
                  <span style={{ fontSize:'10px', color:'#555' }}>플레이어를 선택하여 상세정보 확인</span>
                </div>
                <div style={{ flex: 1, padding: '10px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '12px', WebkitOverflowScrolling: 'touch' }}>
                  {reversedGlobalLogs.map((log, i) => (
                    <div key={i} style={{ marginBottom: '4px', display: 'flex', gap: '8px', lineHeight: '1.4' }}>
                      <span style={{ color: '#555', minWidth: '35px' }}>{formatTime(log.time).split(':')[0]}:{formatTime(log.time).split(':')[1]}</span>
                      {log.type === 'START' && <span style={{ color: '#e89d40' }}>⚡ {log.message}</span>}
                      {log.type === 'KILL' && (
                        <span style={{ color: log.team === 'BLUE' ? '#58a6ff' : '#f85149' }}>
                          <Swords size={10} style={{marginRight:'4px', verticalAlign:'middle'}}/>
                          {log.message}
                        </span>
                      )}
                      {log.type === 'TOWER' && <span style={{ color: '#ccc' }}>🔨 {log.message}</span>}
                      {log.type === 'COLOSSUS' && <span style={{ color: '#7ee787' }}>🤖 {log.message}</span>}
                      {log.type === 'WATCHER' && <span style={{ color: '#a371f7' }}>👁️ {log.message}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 아이템 팝업 */}
      {viewingItem && <ItemDetailPopup item={viewingItem} onClose={() => setViewingItem(null)} />}

      {/* 밴 영웅 상세 팝업 */}
      {viewingBanHero && <BanDetailPopup hero={viewingBanHero} onClose={() => setViewingBanHero(null)} />}
    </>
  );
};