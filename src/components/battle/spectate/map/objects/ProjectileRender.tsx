import React from 'react';
import { Projectile } from '../../../../../../types';

export const ProjectileRender = ({ projectiles }: { projectiles?: Projectile[] }) => {
  if (!projectiles) return null;

  return (
    <>
      {projectiles.map((p) => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: '6px',
            height: '6px',
            backgroundColor: '#f1c40f',
            borderRadius: '50%',
            boxShadow: '0 0 4px #f1c40f',
            transform: 'translate(-50%, -50%)',
            zIndex: 20,
            pointerEvents: 'none'
          }}
        />
      ))}
    </>
  );
};
