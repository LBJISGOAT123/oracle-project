// ==========================================
// FILE PATH: /src/components/battle/spectate/map/UnitRender.tsx
// ==========================================
import React from 'react';
import { GameIcon } from '../../../common/GameIcon';
import { Plane, Skull } from 'lucide-react';
import { useGameStore } from '../../../../store/useGameStore';
// [신규] 모듈화된 스킬 말풍선 가져오기
import { SkillBubble } from './objects/SkillBubble';

export const UnitRender = ({ player, isBlue, isSelected, onClick, currentTime }: any) => {
  const { gameState } = useGameStore();
  const maxRecallTime = gameState.growthSettings?.recallTime || 10.0;

  const isDead = player.respawnTimer > 0;
  
  const recallTime = (player as any).currentRecallTime || 0;
  const isRecalling = recallTime > 0 && !isDead;
  
  const remainingRecall = Math.max(0, maxRecallTime - recallTime).toFixed(1);

  const deathTimer = Math.ceil(player.respawnTimer);
  const hasWatcherBuff = player.buffs && player.buffs.includes('WATCHER_BUFF');

  const teamColor = isBlue ? '#58a6ff' : '#e84057';

  return (
    <div 
      id={`unit-${player.heroId}`}
      onClick={onClick}
      style={{
        position: 'absolute',
        left: `${player.x}%`, 
        top: `${player.y}%`,
        transition: (isDead || isRecalling) ? 'none' : 'left 0.5s linear, top 0.5s linear',
        width: '32px', height: '32px', 
        zIndex: isDead ? 5 : 10,
        cursor: 'pointer',
        transform: 'translate(-50%, -50%)',
        opacity: isDead ? 0.6 : 1,
        filter: isDead ? 'grayscale(100%) brightness(0.7)' : 'none'
      }}
    >
      {/* [모듈 사용] 스킬 말풍선 (안전하게 분리됨) */}
      <SkillBubble activeSkill={player.activeSkill} currentTime={currentTime} isDead={isDead} />

      {/* 귀환 인디케이터 */}
      {isRecalling && (
        <div style={{
          position: 'absolute', top: -25, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(0, 0, 0, 0.8)', color: '#3498db',
          padding: '2px 6px', borderRadius: '10px',
          fontSize: '10px', fontWeight: 'bold', whiteSpace: 'nowrap',
          display: 'flex', alignItems: 'center', gap: '2px',
          border: '1px solid #3498db', zIndex: 20
        }}>
          <Plane size={8} style={{ transform:'rotate(-45deg)' }}/> 
          <span>{remainingRecall}s</span>
        </div>
      )}

      {/* 사망 인디케이터 */}
      {isDead && (
        <div style={{
          position: 'absolute', top: -28, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(218, 54, 51, 0.9)', color: '#fff',
          padding: '2px 8px', borderRadius: '12px',
          fontSize: '11px', fontWeight: '900', whiteSpace: 'nowrap',
          display: 'flex', alignItems: 'center', gap: '4px',
          border: '1px solid #fff', zIndex: 20, boxShadow: '0 0 10px #da3633'
        }}>
          <Skull size={10} /> 
          <span>{deathTimer}s</span>
        </div>
      )}

      {/* 유닛 본체 */}
      <div style={{
        width: '100%', height: '100%',
        borderRadius: '50%',
        border: isDead ? '2px solid #555' : `2px solid ${teamColor}`,
        background: '#161b22',
        overflow: 'hidden',
        boxShadow: hasWatcherBuff 
            ? '0 0 15px 5px #a371f7' 
            : (isRecalling ? '0 0 10px rgba(255,255,255,0.5)' : (isSelected ? '0 0 0 2px white' : 'none')),
        boxSizing: 'border-box'
      }}>
         <GameIcon id={player.heroId} size="100%" shape="circle" border="none" />
      </div>

      <div style={{ 
        position: 'absolute', top: -5, right: -5, 
        background: '#000', color: '#fff', 
        fontSize: '9px', fontWeight: 'bold',
        padding: '1px 4px', borderRadius: '4px', 
        border: '1px solid #555', zIndex: 2 
      }}>
        {player.level}
      </div>

      {!isDead && (
        <div style={{ 
          position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)', 
          width: '36px', height: '5px', 
          background: '#222', border: '1px solid #000', borderRadius: '2px', overflow: 'hidden'
        }}>
           <div style={{ 
             width: `${(player.currentHp / player.maxHp) * 100}%`, 
             height: '100%', 
             background: teamColor,
             transition: 'width 0.2s'
           }} />
        </div>
      )}
    </div>
  );
};
