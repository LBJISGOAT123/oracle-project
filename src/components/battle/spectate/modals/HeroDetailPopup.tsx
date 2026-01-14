// ==========================================
// FILE PATH: /src/components/battle/spectate/modals/HeroDetailPopup.tsx
// ==========================================
import React, { useMemo } from 'react';
import { X, Sword, Shield, Zap, Activity, Crosshair, Brain, Target, TrendingUp } from 'lucide-react';
import { LivePlayer, Hero, UserProfile } from '../../../../types';
import { GameIcon } from '../../../common/GameIcon';
import { getLevelScaledStats } from '../../../../engine/match/utils/StatUtils';
import { userPool } from '../../../../engine/system/UserManager'; // 유저 정보 조회용

interface Props {
  player: LivePlayer;
  hero: Hero;
  onClose: () => void;
}

// 1. [내부 컴포넌트] 플레이어 분석 패널 (그래프 + 태그)
const PlayerAnalysisPanel = ({ name, liveStats }: { name: string, liveStats: { brain: number, mechanics: number } }) => {
  // 실제 유저 데이터 조회 (없으면 기본값)
  const user = userPool.find(u => u.name === name);
  
  // 데이터가 없으면 라이브 데이터로 추정
  const winRate = user?.winRate || 50;
  const playStyle = user?.playStyle || 'WORKER';
  
  // 스탯 계산 (0~100)
  const combat = Math.min(100, winRate + 40);
  const brain = liveStats.brain; // 라이브 데이터 우선
  const mechanics = liveStats.mechanics;
  const potential = user ? Math.min(100, (user.hiddenMmr / 3000) * 100) : 50;

  const getBarColor = (val: number) => {
    if (val >= 80) return '#e74c3c'; // 최상위 (빨강)
    if (val >= 60) return '#f1c40f'; // 상위 (노랑)
    if (val >= 40) return '#2ecc71'; // 중위 (초록)
    return '#8b949e'; // 하위 (회색)
  };

  const tags = [];
  if (playStyle === 'HARDCORE') tags.push({ label: '🔥 폐인', color: '#da3633' });
  if (playStyle === 'WORKER') tags.push({ label: '💼 직장인', color: '#3498db' });
  if (playStyle === 'STUDENT') tags.push({ label: '🎓 급식', color: '#f1c40f' });
  if (playStyle === 'NIGHT_OWL') tags.push({ label: '🌙 올빼미', color: '#9b59b6' });
  
  if (winRate >= 55) tags.push({ label: '🏆 승리왕', color: '#e74c3c' });
  else if (winRate <= 45) tags.push({ label: '📉 연패중', color: '#7f8c8d' });

  if (brain > 70) tags.push({ label: '🧠 뇌지컬', color: '#2ecc71' });
  if (mechanics > 70) tags.push({ label: '⚡ 피지컬', color: '#e67e22' });

  const StatBar = ({ label, value, icon }: any) => (
    <div style={{ marginBottom: '6px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#ccc', marginBottom: '2px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>{icon} {label}</div>
        <span style={{ fontWeight: 'bold', color: getBarColor(value) }}>{value.toFixed(0)}</span>
      </div>
      <div style={{ width: '100%', height: '5px', background: '#30363d', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ width: `${value}%`, height: '100%', background: getBarColor(value) }} />
      </div>
    </div>
  );

  return (
    <div style={{ background: '#161b22', padding: '12px', borderRadius: '8px', border: '1px solid #30363d', marginBottom: '15px' }}>
      <div style={{ fontSize:'11px', fontWeight:'bold', color:'#fff', marginBottom:'8px', display:'flex', alignItems:'center', gap:'4px' }}>
        <Activity size={12} color="#58a6ff"/> 플레이어 분석
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '12px' }}>
        {tags.map((t, i) => (
          <span key={i} style={{ fontSize: '10px', color: t.color, border: `1px solid ${t.color}44`, background: `${t.color}11`, padding: '1px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
            {t.label}
          </span>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <StatBar label="전투력" value={combat} icon={<TrendingUp size={10}/>} />
        <StatBar label="운영능력" value={brain} icon={<Brain size={10}/>} />
        <StatBar label="컨트롤" value={mechanics} icon={<Zap size={10}/>} />
        <StatBar label="성장력" value={potential} icon={<Target size={10}/>} />
      </div>
      
      <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px dashed #30363d', fontSize: '9px', color: '#666', textAlign: 'center' }}>
        * 최근 50경기 데이터를 기반으로 AI가 분석한 지표입니다.
      </div>
    </div>
  );
};

export const HeroDetailPopup: React.FC<Props> = ({ player, hero, onClose }) => {
  // 스탯 계산 로직 (기본 vs 아이템)
  const stats = useMemo(() => {
    const base = getLevelScaledStats(hero.stats, player.level);
    const bonus = { ad: 0, ap: 0, armor: 0, hp: 0, speed: 0, crit: 0 };

    player.items.forEach(item => {
      bonus.ad += (item.ad || 0);
      bonus.ap += (item.ap || 0);
      bonus.armor += (item.armor || 0);
      bonus.hp += (item.hp || 0);
      bonus.speed += (item.speed || 0);
      bonus.crit += (item.crit || 0);
    });
    return { base, bonus };
  }, [player, hero]);

  // 체력/마나 퍼센트
  const hpPercent = (player.currentHp / player.maxHp) * 100;
  const mpPercent = player.maxMp > 0 ? (player.currentMp / player.maxMp) * 100 : 0;

  const StatRow = ({ label, icon, baseVal, bonusVal, unit = '' }: any) => (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', background:'#1c1c1f', padding:'6px 10px', borderRadius:'4px', marginBottom:'4px', border:'1px solid #30363d' }}>
      <div style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'11px', color:'#aaa' }}>
        {icon} {label}
      </div>
      <div style={{ fontSize:'12px', fontWeight:'bold', fontFamily:'monospace' }}>
        <span style={{ color:'#fff' }}>{Math.floor(baseVal)}</span>
        {bonusVal > 0 && <span style={{ color:'#a371f7' }}> +{Math.floor(bonusVal)}</span>}
        <span style={{ color:'#666', fontSize:'10px' }}>{unit}</span>
      </div>
    </div>
  );

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 20000,
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
    }}>
      <div style={{ 
        width: '100%', maxWidth: '380px', maxHeight: '90vh',
        background: '#0d1117', border: '1px solid #30363d', borderRadius: '16px',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 20px 50px rgba(0,0,0,0.9)'
      }}>
        
        {/* 헤더 (닫기 버튼) */}
        <div style={{ padding: '12px 15px', background: '#161b22', borderBottom: '1px solid #30363d', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, color: '#fff', fontSize: '14px', fontWeight:'bold' }}>선수 상세 정보</h3>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#ccc', cursor:'pointer' }}><X size={18}/></button>
        </div>

        <div style={{ overflowY: 'auto', padding: '15px' }}>
          
          {/* 1. 영웅 프로필 & 체력바 */}
          <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
            <div style={{ position:'relative' }}>
              <GameIcon id={player.heroId} size={64} shape="rounded" border="2px solid #58a6ff" />
              <div style={{ position:'absolute', bottom:-6, left:'50%', transform:'translateX(-50%)', background:'#000', color:'#fff', fontSize:'10px', fontWeight:'bold', padding:'1px 5px', borderRadius:'4px', border:'1px solid #444', whiteSpace:'nowrap' }}>
                Lv.{player.level}
              </div>
            </div>
            
            <div style={{ flex: 1, display:'flex', flexDirection:'column', justifyContent:'center' }}>
              <div style={{ fontSize:'16px', fontWeight:'bold', color:'#fff', marginBottom:'2px' }}>{player.name}</div>
              <div style={{ fontSize:'12px', color:'#888', marginBottom:'6px' }}>{hero.name} ({hero.role})</div>
              
              {/* HP Bar */}
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:'9px', color:'#2ecc71', fontWeight:'bold', marginBottom:'2px' }}>
                <span>HP</span>
                <span>{Math.floor(player.currentHp)}/{player.maxHp}</span>
              </div>
              <div style={{ width:'100%', height:'6px', background:'#1a1a1c', borderRadius:'3px', overflow:'hidden', marginBottom:'4px' }}>
                <div style={{ width:`${hpPercent}%`, height:'100%', background:'#2ecc71', transition:'width 0.2s' }} />
              </div>

              {/* MP Bar */}
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:'9px', color:'#3498db', fontWeight:'bold', marginBottom:'2px' }}>
                <span>MP</span>
                <span>{Math.floor(player.currentMp)}/{player.maxMp}</span>
              </div>
              <div style={{ width:'100%', height:'6px', background:'#1a1a1c', borderRadius:'3px', overflow:'hidden' }}>
                <div style={{ width:`${mpPercent}%`, height:'100%', background:'#3498db', transition:'width 0.2s' }} />
              </div>
            </div>
          </div>

          {/* 2. 플레이어 분석 (요청하신 부분) */}
          <PlayerAnalysisPanel name={player.name} liveStats={player.stats} />

          {/* 3. 전투 스탯 (기본+아이템 분리) */}
          <div style={{ marginBottom: '15px' }}>
            <div style={{ fontSize:'11px', fontWeight:'bold', color:'#8b949e', marginBottom:'6px' }}>전투 스탯 (기본 + 아이템)</div>
            <StatRow label="공격력" icon={<Sword size={12} color="#e74c3c"/>} baseVal={stats.base.ad} bonusVal={stats.bonus.ad} />
            <StatRow label="주문력" icon={<Zap size={12} color="#9b59b6"/>} baseVal={stats.base.ap} bonusVal={stats.bonus.ap} />
            <StatRow label="방어력" icon={<Shield size={12} color="#3498db"/>} baseVal={stats.base.armor} bonusVal={stats.bonus.armor} />
            <StatRow label="이동속도" icon={<Activity size={12} color="#f1c40f"/>} baseVal={stats.base.speed} bonusVal={stats.bonus.speed} />
            <StatRow label="치명타" icon={<Crosshair size={12} color="#e67e22"/>} baseVal={stats.base.crit} bonusVal={stats.bonus.crit} unit="%" />
          </div>

          {/* 4. 아이템 */}
          <div>
            <div style={{ fontSize:'11px', fontWeight:'bold', color:'#8b949e', marginBottom:'6px', display:'flex', justifyContent:'space-between' }}>
                <span>아이템</span>
                <span style={{ color:'#f1c40f' }}>{(player.gold/1000).toFixed(1)}k G</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px' }}>
              {[0,1,2,3,4,5].map(idx => {
                const item = player.items[idx];
                return (
                  <div key={idx} style={{ aspectRatio:'1/1', background:'#161b22', border:'1px solid #333', borderRadius:'4px', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', position:'relative' }}>
                    {item ? (
                        <>
                            <GameIcon id={item.id} size="100%" shape="square" border="none" />
                            {item.type === 'POWER' && <div style={{position:'absolute', inset:0, border:'2px solid #a371f7', borderRadius:'4px'}}/>}
                        </>
                    ) : (
                        <div style={{ fontSize:'8px', color:'#333' }}>-</div>
                    )}
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop:'6px', display:'flex', flexWrap:'wrap', gap:'4px' }}>
                {player.items.map((item, i) => (
                    <span key={i} style={{ fontSize:'9px', color:'#aaa', background:'#1c1c1f', padding:'2px 5px', borderRadius:'3px', border:'1px solid #333' }}>
                        {item.name}
                    </span>
                ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
