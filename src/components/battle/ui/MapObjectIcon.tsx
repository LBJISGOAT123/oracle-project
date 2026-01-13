import React from 'react';

interface Props {
  x: number;
  y: number;
  icon: React.ReactElement;
  color: string;
  size: number;
  label?: string;
  onClick: () => void;
}

export const MapObjectIcon: React.FC<Props> = ({ x, y, icon, color, size, label, onClick }) => {
  return (
    <div 
      onClick={onClick}
      style={{
        position: 'absolute', left: `${x}%`, top: `${y}%`,
        transform: 'translate(-50%, -50%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        cursor: 'pointer', zIndex: 10
      }}
      className="map-obj-hover"
    >
      <div style={{
        width: size, height: size, borderRadius: '50%',
        background: '#161b22', border: `2px solid ${color}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: `0 0 10px ${color}66`,
        transition: 'all 0.2s'
      }}>
        {React.cloneElement(icon, { size: size/1.8, color })}
      </div>
      {label && (
        <span style={{ 
          marginTop: '4px', fontSize: '10px', fontWeight: 'bold', 
          color: '#fff', background: 'rgba(0,0,0,0.6)', 
          padding: '1px 6px', borderRadius: '4px', whiteSpace: 'nowrap'
        }}>
          {label}
        </span>
      )}
      <style>{`
        .map-obj-hover:hover > div { transform: scale(1.2); background: #fff !important; }
        .map-obj-hover:hover span { background: #58a6ff !important; }
      `}</style>
    </div>
  );
};
