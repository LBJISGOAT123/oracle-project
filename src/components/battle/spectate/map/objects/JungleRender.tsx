import React from 'react';
import { JungleMob } from '../../../../../../types';

export const JungleRender = ({ mobs }: { mobs?: JungleMob[] }) => {
  if (!mobs) return null;

  return (
    <>
      {mobs.map((mob) => {
        if (!mob.isAlive) return null;

        const color = mob.type === 'GOLEM' ? '#d35400' : '#7f8c8d';
        const size = mob.type === 'GOLEM' ? 14 : 10;

        return (
          <div
            key={mob.id}
            style={{
              position: 'absolute',
              left: `${mob.x}%`,
              top: `${mob.y}%`,
              width: `${size}px`,
              height: `${size}px`,
              backgroundColor: '#161b22',
              border: `2px solid ${color}`,
              borderRadius: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '8px',
              color: color,
              fontWeight: 'bold',
              pointerEvents: 'none'
            }}
          >
            {mob.type[0]}
          </div>
        );
      })}
    </>
  );
};
