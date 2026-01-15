import React from 'react';
import { VisualEffect } from '../../../../../types';

interface Props {
  effects: VisualEffect[];
}

export const EffectLayer: React.FC<Props> = ({ effects }) => {
  if (!effects || effects.length === 0) return null;

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 50 }}>
      {effects.map((ef) => {
        const lifeRatio = ef.duration / ef.maxDuration;
        
        // 투사체 (빛나는 구체)
        if (ef.type === 'PROJECTILE') {
          return (
            <div key={ef.id} style={{
              position: 'absolute',
              left: `${ef.x}%`, top: `${ef.y}%`,
              width: `${ef.size}px`, height: `${ef.size}px`,
              background: ef.color,
              borderRadius: '50%',
              transform: 'translate(-50%, -50%)',
              boxShadow: `0 0 ${ef.size * 2}px ${ef.color}, 0 0 5px white`, // 흰색 광채 추가
              border: '1px solid white'
            }} />
          );
        }

        // 폭발/타격 (퍼져나가는 원)
        if (ef.type === 'EXPLOSION' || ef.type === 'HIT') {
          return (
            <div key={ef.id} style={{
              position: 'absolute',
              left: `${ef.x}%`, top: `${ef.y}%`,
              width: `${ef.size * (2 - lifeRatio)}px`, 
              height: `${ef.size * (2 - lifeRatio)}px`,
              background: ef.color,
              borderRadius: '50%',
              opacity: lifeRatio * 0.8, // 약간 투명하게
              transform: 'translate(-50%, -50%)',
              boxShadow: `0 0 ${ef.size}px ${ef.color}`
            }} />
          );
        }

        // 장판 (은은하게 퍼지는 영역)
        if (ef.type === 'AREA') {
          return (
            <div key={ef.id} style={{
              position: 'absolute',
              left: `${ef.x}%`, top: `${ef.y}%`,
              width: `${ef.size * 3}px`, height: `${ef.size * 3}px`,
              border: `2px solid ${ef.color}`,
              background: `${ef.color}44`, // 반투명 배경
              borderRadius: '50%',
              opacity: lifeRatio,
              transform: 'translate(-50%, -50%)',
              boxShadow: `inset 0 0 10px ${ef.color}`
            }} />
          );
        }

        return null;
      })}
    </div>
  );
};
