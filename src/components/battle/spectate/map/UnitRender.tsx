import React from 'react';
import { GameIcon } from '../../../common/GameIcon';
import { Plane, Skull } from 'lucide-react';

export const UnitRender = ({ player, isBlue, isSelected, onClick }: any) => {
  const isDead = player.respawnTimer > 0;
  
  // 귀환 체크
  const recallTime = (player as any).currentRecallTime || 0;
  const isRecalling = recallTime > 0 && !isDead;
  const remainingRecall = Math.max(0, 4.0 - recallTime).toFixed(1);

  // 사망 타이머 (올림 처리)
  const deathTimer = Math.ceil(player.respawnTimer);

  return (
    <div 
      id={`unit-${player.heroId}`}
      onClick={onClick}
      style={{
        position: 'absolute',
        left: `${player.x}%`, 
        top: `${player.y}%`,
        // 사망 시에는 위치가 고정되어야 하므로 transition 끔 (떨림 방지)
        transition: (isDead || isRecalling) ? 'none' : 'left 0.5s linear, top 0.5s linear',
        
        width: '32px', height: '32px', 
        zIndex: isDead ? 5 : 10, // 죽은 유닛은 산 유닛보다 아래에
        cursor: 'pointer',
        transform: 'translate(-50%, -50%)',
        opacity: isDead ? 0.6 : 1, // 반투명
        filter: isDead ? 'grayscale(100%) brightness(0.7)' : 'none'
      }}
    >
      {/* 1. 귀환 인디케이터 (파랑) */}
      {isRecalling && (
        <div style={{
          position: 'absolute', top: -25, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(52, 152, 219, 0.9)', color: '#fff',
          padding: '2px 6px', borderRadius: '10px',
          fontSize: '9px', fontWeight: 'bold', whiteSpace: 'nowrap',
          display: 'flex', alignItems: 'center', gap: '2px',
          border: '1px solid #fff', zIndex: 20, boxShadow: '0 0 10px #3498db'
        }}>
          <Plane size={8} style={{ transform:'rotate(-45deg)' }}/> 
          <span>{remainingRecall}s</span>
        </div>
      )}

      {/* 2. 사망 인디케이터 (빨강) - 여기가 핵심! */}
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
        border: isRecalling ? '2px solid #3498db' : (isDead ? '2px solid #555' : `2px solid ${isBlue ? '#58a6ff' : '#e84057'}`),
        background: '#161b22',
        overflow: 'hidden',
        boxShadow: isRecalling ? '0 0 15px #3498db' : (isSelected ? '0 0 0 2px white' : 'none'),
        boxSizing: 'border-box'
      }}>
         <GameIcon id={player.heroId} size="100%" shape="circle" border="none" />
      </div>

      {/* 레벨 뱃지 */}
      <div style={{ 
        position: 'absolute', top: -5, right: -5, 
        background: '#000', color: '#fff', 
        fontSize: '9px', fontWeight: 'bold',
        padding: '1px 4px', borderRadius: '4px', 
        border: '1px solid #555', zIndex: 2 
      }}>
        {player.level}
      </div>

      {/* 체력바 (죽으면 숨김) */}
      {!isDead && (
        <div style={{ 
          position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)', 
          width: '36px', height: '5px', 
          background: '#222', border: '1px solid #000', borderRadius: '2px', overflow: 'hidden'
        }}>
           <div style={{ 
             width: `${(player.currentHp / player.maxHp) * 100}%`, 
             height: '100%', 
             background: isBlue ? '#58a6ff' : '#e84057',
             transition: 'width 0.2s'
           }} />
        </div>
      )}
    </div>
  );
};
