// ==========================================
// FILE PATH: /src/components/shop/ShopTab.tsx
// ==========================================

import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { 
  Coins, Plus, Shield, Sword, Zap, Briefcase, 
  BarChart2, ShoppingCart, Search, ChevronRight, Footprints, Gem 
} from 'lucide-react'; // Trash 제거됨
import { ItemStatsView } from './ItemStatsView'; 
import { ItemPatchModal } from './ItemPatchModal';
import { Item } from '../../types';
import { GameIcon } from '../common/GameIcon';

export const ShopTab: React.FC = () => {
  const { shopItems } = useGameStore();
  const [mode, setMode] = useState<'MANAGE' | 'STATS'>('MANAGE');
  const [filter, setFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const filteredItems = shopItems.filter(i => {
    const matchFilter = filter === 'ALL' || i.type === filter;
    const matchSearch = i.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchFilter && matchSearch;
  });

  // 가격순 정렬
  filteredItems.sort((a, b) => a.cost - b.cost);

  const handleCreate = () => { setEditingItem(null); setIsModalOpen(true); };
  const handleEdit = (item: Item) => { setEditingItem(item); setIsModalOpen(true); };

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
      <span style={{ 
        fontSize: '10px', fontWeight: 'bold', color: color, 
        background: `${color}11`, border: `1px solid ${color}44`, 
        padding: '1px 5px', borderRadius: '4px', whiteSpace: 'nowrap',
        display: 'inline-flex', alignItems: 'center', fontFamily: 'monospace'
      }}>
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

  const DesktopRow = ({ item, index }: { item: Item, index: number }) => (
    <div 
      onClick={() => handleEdit(item)}
      style={{ 
        // [수정] 그리드 컬럼에서 삭제 버튼 공간 제거 (80px -> 제거)
        display: 'grid', gridTemplateColumns: '50px 250px 100px 1fr', 
        padding: '10px 15px', borderBottom: '1px solid #2c2c2f', 
        alignItems: 'center', background: '#161b22', cursor: 'pointer',
        transition: 'background 0.1s'
      }}
      onMouseEnter={e => e.currentTarget.style.background = '#21262d'}
      onMouseLeave={e => e.currentTarget.style.background = '#161b22'}
    >
      <div style={{ color: '#555', fontStyle: 'italic', fontWeight: 'bold', textAlign:'center' }}>{index + 1}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <GameIcon id={item.id} size={36} shape="rounded" border="1px solid #444" />
        <div>
          <div style={{ fontWeight: 'bold', color: item.type === 'POWER' ? '#9b59b6' : '#fff', fontSize: '13px' }}>{item.name}</div>
          <div style={{ fontSize: '11px', color: '#666', display:'flex', alignItems:'center', gap:'4px' }}>
            {getTypeIcon(item.type)} {item.type}
          </div>
        </div>
      </div>
      <div style={{ color: '#f1c40f', fontWeight: 'bold', fontSize: '13px', fontFamily: 'monospace' }}>
        {item.cost.toLocaleString()} G
      </div>
      <div><ItemStatsRenderer item={item} /></div>
      
      {/* [수정] 삭제 버튼 제거됨 */}
    </div>
  );

  const MobileRow = ({ item, index }: { item: Item, index: number }) => (
    <div onClick={() => handleEdit(item)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderBottom: '1px solid #2c2c2f', background: '#161b22', cursor: 'pointer' }}>
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
      {/* [수정] 삭제 버튼 제거됨 */}
    </div>
  );

  return (
    <div style={{ paddingBottom: '80px', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ background:'#161b22', borderRadius:'12px', border:'1px solid #30363d', padding: '12px 15px', marginBottom: '10px', display:'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? '10px' : '15px', justifyContent:'space-between', alignItems: isMobile ? 'stretch' : 'center' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
            <Coins color="#f1c40f" size={20}/>
            <h2 style={{ margin:0, color:'#fff', fontSize: '16px', fontWeight:'800' }}>아이템 상점</h2>
        </div>
        <div style={{ display:'flex', background:'#0d1117', padding:'3px', borderRadius:'6px', border:'1px solid #30363d' }}>
            <button onClick={() => setMode('MANAGE')} style={{ flex:1, padding:'6px 12px', borderRadius:'4px', border:'none', background: mode === 'MANAGE' ? '#58a6ff' : 'transparent', color: mode === 'MANAGE' ? '#000' : '#8b949e', fontWeight:'bold', fontSize:'12px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px' }}><ShoppingCart size={14}/> 관리</button>
            <button onClick={() => setMode('STATS')} style={{ flex:1, padding:'6px 12px', borderRadius:'4px', border:'none', background: mode === 'STATS' ? '#58a6ff' : 'transparent', color: mode === 'STATS' ? '#000' : '#8b949e', fontWeight:'bold', fontSize:'12px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px' }}><BarChart2 size={14}/> 통계</button>
        </div>
      </div>

      {mode === 'STATS' && <ItemStatsView />}

      {mode === 'MANAGE' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#1c1c1f', border: '1px solid #30363d', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '10px 15px', borderBottom: '1px solid #30363d', display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '10px', background: '#252528' }}>
            <div style={{ display: 'flex', gap: '5px', overflowX: 'auto', scrollbarWidth: 'none' }}>
              {['ALL', 'WEAPON', 'ARMOR', 'ARTIFACT', 'BOOTS', 'ACCESSORY', 'POWER'].map(f => (
                <button key={f} onClick={() => setFilter(f)} style={{ background: filter === f ? '#30363d' : 'transparent', color: filter === f ? '#fff' : '#888', border: '1px solid', borderColor: filter === f ? '#555' : 'transparent', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px', whiteSpace: 'nowrap' }}>
                  {f === 'ALL' ? '전체' : f}
                </button>
              ))}
            </div>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={14} color="#666" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              <input type="text" placeholder="아이템 검색..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ width: '100%', background: '#161b22', border: '1px solid #444', borderRadius: '4px', padding: '6px 10px 6px 30px', color: '#fff', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <button onClick={handleCreate} style={{ background: '#238636', border: '1px solid #2ea043', borderRadius: '4px', color: '#fff', fontSize: '12px', fontWeight: 'bold', padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap', justifyContent:'center' }}><Plus size={14}/> 신규 등록</button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {!isMobile && (
              // [수정] 헤더 그리드 조정 (80px 삭제)
              <div style={{ display: 'grid', gridTemplateColumns: '50px 250px 100px 1fr', padding: '10px 15px', borderBottom: '1px solid #30363d', background: '#161b22', fontSize: '11px', fontWeight: 'bold', color: '#8b949e', position: 'sticky', top: 0 }}>
                <div style={{ textAlign:'center' }}>No.</div>
                <div>아이템 정보</div>
                <div>가격</div>
                <div>능력치 (Stats)</div>
                {/* 관리(삭제) 탭 헤더 제거됨 */}
              </div>
            )}
            {filteredItems.length > 0 ? (
              filteredItems.map((item, idx) => (
                isMobile ? <MobileRow key={item.id} item={item} index={idx} /> : <DesktopRow key={item.id} item={item} index={idx} />
              ))
            ) : <div style={{ padding: '40px', textAlign: 'center', color: '#555', fontSize: '13px' }}>검색된 아이템이 없습니다.</div>}
          </div>
        </div>
      )}

      {isModalOpen && <ItemPatchModal item={editingItem} onClose={() => setIsModalOpen(false)} />}
    </div>
  );
};
