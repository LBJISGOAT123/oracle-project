import React from 'react';
import { Item } from '../../../types';
import { GameIcon } from '../../common/GameIcon';
import { Sword, Shield, Coins, Zap, Briefcase, ChevronRight, Footprints, Gem } from 'lucide-react';

interface Props {
  item: Item;
  index: number;
  isMobile: boolean;
  onEdit: (item: Item) => void;
}

const getTypeIcon = (type: string) => {
  switch(type) {
    case 'WEAPON': return <Sword size={14} color="#e74c3c"/>;
    case 'ARMOR': return <Shield size={14} color="#2ecc71"/>;
    case 'ACCESSORY': return <Briefcase size={14} color="#f1c40f"/>;
    case 'POWER': return <Zap size={14} color="#9b59b6"/>;
    case 'BOOTS': return <Footprints size={14} color="#00b894"/>;
    case 'ARTIFACT': return <Gem size={14} color="#a29bfe"/>;
    default: return <Coins size={14} color="#888"/>;
  }
};

const StatBadge = ({ label, val, color }: { label: string, val?: number, color: string }) => {
  if (!val || val === 0) return null;
  return (
    <span style={{ fontSize: '10px', fontWeight: 'bold', color: color, background: \`\${color}11\`, border: \`1px solid \${color}44\`, padding: '1px 5px', borderRadius: '4px', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', fontFamily: 'monospace' }}>
      {label} +{val}
    </span>
  );
};

const ItemStatsRenderer = ({ item }: { item: Item }) => (
  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
    <StatBadge label="AD" val={item.ad} color="#e74c3c" />
    <StatBadge label="AP" val={item.ap} color="#9b59b6" />
    <StatBadge label="HP" val={item.hp} color="#2ecc71" />
    <StatBadge label="DEF" val={item.armor} color="#3498db" />
    <StatBadge label="CRI" val={item.crit} color="#e67e22" />
    <StatBadge label="SPD" val={item.speed} color="#f1c40f" />
    <StatBadge label="MP" val={item.mp} color="#3498db" />
    <StatBadge label="PEN" val={item.pen} color="#da3633" />
    <StatBadge label="REG" val={item.regen} color="#27ae60" />
    <StatBadge label="M.REG" val={item.mpRegen} color="#2980b9" />
  </div>
);

export const ShopItemRow: React.FC<Props> = ({ item, index, isMobile, onEdit }) => {
  if (isMobile) {
    return (
      <div onClick={() => onEdit(item)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderBottom: '1px solid #2c2c2f', background: '#161b22', cursor: 'pointer' }}>
        <div style={{ fontSize: '12px', color: '#555', fontStyle: 'italic', width: '20px', textAlign:'center' }}>{index + 1}</div>
        <GameIcon id={item.id} size={42} shape="rounded" border="1px solid #444" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontWeight: 'bold', color: '#fff', fontSize: '14px' }}>{item.name}</span>
            <span style={{ color: '#f1c40f', fontWeight: 'bold', fontSize: '12px' }}>{item.cost.toLocaleString()}</span>
          </div>
          <ItemStatsRenderer item={item} />
        </div>
        <ChevronRight size={16} color="#444" />
      </div>
    );
  }

  return (
    <div onClick={() => onEdit(item)} style={{ display: 'grid', gridTemplateColumns: '50px 250px 100px 1fr', padding: '10px 15px', borderBottom: '1px solid #2c2c2f', alignItems: 'center', background: '#161b22', cursor: 'pointer', transition: 'background 0.1s' }} onMouseEnter={e => e.currentTarget.style.background = '#21262d'} onMouseLeave={e => e.currentTarget.style.background = '#161b22'}>
      <div style={{ color: '#555', fontStyle: 'italic', fontWeight: 'bold', textAlign:'center' }}>{index + 1}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <GameIcon id={item.id} size={36} shape="rounded" border="1px solid #444" />
        <div>
          <div style={{ fontWeight: 'bold', color: item.type === 'POWER' ? '#9b59b6' : '#fff', fontSize: '13px' }}>{item.name}</div>
          <div style={{ fontSize: '11px', color: '#666', display:'flex', alignItems:'center', gap:'4px' }}>{getTypeIcon(item.type)} {item.type}</div>
        </div>
      </div>
      <div style={{ color: '#f1c40f', fontWeight: 'bold', fontSize: '13px', fontFamily: 'monospace' }}>{item.cost.toLocaleString()} G</div>
      <div><ItemStatsRenderer item={item} /></div>
    </div>
  );
};
