// ==========================================
// FILE PATH: /src/components/shop/ShopTab.tsx
// ==========================================

import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { Coins, Plus, Trash2, Shield, Sword, Zap, Briefcase, BarChart2, ShoppingCart, Edit2 } from 'lucide-react';
import { ItemStatsView } from './ItemStatsView'; 
import { ItemPatchModal } from './ItemPatchModal';
import { Item } from '../../types';

export const ShopTab: React.FC = () => {
  const { shopItems, deleteItem } = useGameStore();
  const [mode, setMode] = useState<'MANAGE' | 'STATS'>('MANAGE');
  const [filter, setFilter] = useState<string>('ALL');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const filteredItems = filter === 'ALL' ? shopItems : shopItems.filter(i => i.type === filter);

  const handleCreate = () => {
    setEditingItem(null); 
    setIsModalOpen(true);
  };

  const handleEdit = (item: Item) => {
    setEditingItem(item); 
    setIsModalOpen(true);
  };

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'WEAPON': return <Sword size={14} color="#e74c3c"/>;
      case 'ARMOR': return <Shield size={14} color="#2ecc71"/>;
      case 'ACCESSORY': return <Briefcase size={14} color="#f1c40f"/>;
      case 'POWER': return <Zap size={14} color="#9b59b6"/>;
      default: return <Coins size={14}/>;
    }
  };

  // 스탯 뱃지 컴포넌트
  const StatBadge = ({ label, val, color }: { label: string, val: number, color: string }) => {
    if (val <= 0) return null;
    return (
      <span style={{ 
        fontSize: '10px', fontWeight: 'bold', color: color, 
        background: `${color}11`, border: `1px solid ${color}33`, 
        padding: '2px 5px', borderRadius: '4px', whiteSpace: 'nowrap'
      }}>
        {label} +{val}
      </span>
    );
  };

  return (
    <div style={{ paddingBottom: '80px' }}>

      {/* 상단 헤더 */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px', background:'#21262d', padding:'10px 15px', borderRadius:'12px', border:'1px solid #30363d' }}>
        <h2 style={{ margin:0, color:'#fff', display:'flex', alignItems:'center', gap:'10px', fontSize:'16px' }}>
          <Coins color="#f1c40f" size={20}/> 
          {isMobile ? '상점' : '아이템 상점'}
        </h2>

        <div style={{ display:'flex', background:'#0d1117', padding:'3px', borderRadius:'8px', border:'1px solid #30363d' }}>
          <button 
            onClick={() => setMode('MANAGE')}
            style={{ 
              display:'flex', alignItems:'center', gap:'6px', padding:'6px 12px', borderRadius:'6px', border:'none', cursor:'pointer', fontWeight:'bold', fontSize:'11px',
              background: mode === 'MANAGE' ? '#58a6ff' : 'transparent', color: mode === 'MANAGE' ? '#000' : '#8b949e'
            }}
          >
            <ShoppingCart size={14}/> 관리
          </button>
          <button 
            onClick={() => setMode('STATS')}
            style={{ 
              display:'flex', alignItems:'center', gap:'6px', padding:'6px 12px', borderRadius:'6px', border:'none', cursor:'pointer', fontWeight:'bold', fontSize:'11px',
              background: mode === 'STATS' ? '#58a6ff' : 'transparent', color: mode === 'STATS' ? '#000' : '#8b949e'
            }}
          >
            <BarChart2 size={14}/> 통계
          </button>
        </div>
      </div>

      {mode === 'STATS' && <ItemStatsView />}

      {mode === 'MANAGE' && (
        <>
          {/* 필터 버튼 */}
          <div style={{ display:'flex', gap:'5px', marginBottom:'15px', overflowX:'auto', paddingBottom:'5px' }}>
            {['ALL', 'WEAPON', 'ARMOR', 'ACCESSORY', 'POWER'].map(f => (
              <button 
                key={f} 
                onClick={() => setFilter(f)}
                style={{ 
                  background: filter === f ? '#30363d' : '#161b22', border: '1px solid #30363d',
                  color: filter === f ? '#fff' : '#888',
                  padding: '6px 10px', borderRadius: '6px', cursor:'pointer', fontWeight:'bold', fontSize:'11px', whiteSpace:'nowrap'
                }}
              >
                {f}
              </button>
            ))}
          </div>

          {/* 아이템 리스트 (모바일 최적화 적용) */}
          <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
            {filteredItems.map(item => (
              <div key={item.id} style={{ 
                background:'#161b22', border:'1px solid #30363d', borderRadius:'10px', padding:'10px', 
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap:'10px'
              }}>

                {/* 1. 좌측: 아이콘 + 기본 정보 */}
                <div style={{ display:'flex', alignItems:'center', gap:'10px', minWidth: isMobile ? '100px' : '150px' }}>
                  <div style={{ width:'36px', height:'36px', background:'#0d1117', borderRadius:'8px', border:'1px solid #444', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    {getTypeIcon(item.type)}
                  </div>
                  <div>
                    <div style={{ fontWeight:'bold', color: item.type === 'POWER' ? '#9b59b6' : '#fff', fontSize:'13px', lineHeight:'1.2' }}>{item.name}</div>
                    <div style={{ fontSize:'11px', color:'#f1c40f', fontWeight:'bold' }}>{item.cost.toLocaleString()} G</div>
                  </div>
                </div>

                {/* 2. 중앙: 스탯 (모바일에서는 옆으로 배치) */}
                <div style={{ 
                  flex: 1, display: 'flex', flexWrap: 'wrap', gap: '4px', 
                  justifyContent: isMobile ? 'flex-start' : 'center',
                  alignContent: 'center'
                }}>
                  <StatBadge label="AD" val={item.ad} color="#e74c3c" />
                  <StatBadge label="AP" val={item.ap} color="#9b59b6" />
                  <StatBadge label="HP" val={item.hp} color="#2ecc71" />
                  <StatBadge label="DEF" val={item.armor} color="#3498db" />
                  <StatBadge label="CRI" val={item.crit} color="#e67e22" />
                  <StatBadge label="SPD" val={item.speed} color="#fff" />
                </div>

                {/* 3. 우측: 버튼 */}
                <div style={{ display:'flex', gap:'4px', flexShrink:0 }}>
                  <button onClick={() => handleEdit(item)} style={{ background:'#21262d', border:'1px solid #333', color:'#ccc', cursor:'pointer', width:'28px', height:'28px', borderRadius:'6px', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <Edit2 size={14}/>
                  </button>
                  <button onClick={() => deleteItem(item.id)} style={{ background:'#3f1515', border:'1px solid #5a1e1e', color:'#ff6b6b', cursor:'pointer', width:'28px', height:'28px', borderRadius:'6px', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <Trash2 size={14}/>
                  </button>
                </div>

              </div>
            ))}

            {/* 아이템 추가 버튼 (맨 아래) */}
            <div onClick={handleCreate} style={{ 
              border:'2px dashed #30363d', borderRadius:'10px', 
              display:'flex', alignItems:'center', justifyContent:'center', 
              padding:'12px', cursor:'pointer', color:'#555', transition:'0.2s', marginTop:'5px'
            }}
            onMouseEnter={e => {e.currentTarget.style.borderColor = '#58a6ff'; e.currentTarget.style.color = '#58a6ff'}}
            onMouseLeave={e => {e.currentTarget.style.borderColor = '#30363d'; e.currentTarget.style.color = '#555'}}
            >
              <div style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'13px', fontWeight:'bold' }}>
                <Plus size={16}/> 아이템 추가
              </div>
            </div>
          </div>
        </>
      )}

      {/* 모달 렌더링 */}
      {isModalOpen && (
        <ItemPatchModal 
          item={editingItem} 
          onClose={() => setIsModalOpen(false)} 
        />
      )}
    </div>
  );
};