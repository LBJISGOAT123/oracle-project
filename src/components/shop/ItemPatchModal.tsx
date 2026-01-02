// ==========================================
// FILE PATH: /src/components/shop/ItemPatchModal.tsx
// ==========================================

import React, { useState, useEffect, useRef } from 'react';
import { Item } from '../../types';
import { useGameStore } from '../../store/useGameStore';
// [수정] Trash2 -> Trash 로 변경 (흰 화면 해결의 핵심)
import { X, Save, Trash, Sliders } from 'lucide-react';
import { GameIcon } from '../common/GameIcon';

interface Props {
  item?: Item | null;
  onClose: () => void;
}

// 전체 스탯 설정 정의
const ALL_STATS: Record<string, { label: string, color: string, max: number, step: number, unit: string }> = {
  ad: { label: '공격력 (AD)', color: '#e74c3c', max: 300, step: 1, unit: '' },
  ap: { label: '주문력 (AP)', color: '#9b59b6', max: 500, step: 1, unit: '' },
  crit: { label: '치명타 (CRI)', color: '#e67e22', max: 100, step: 1, unit: '%' },
  pen: { label: '관통력 (PEN)', color: '#da3633', max: 100, step: 1, unit: '' },

  hp: { label: '체력 (HP)', color: '#2ecc71', max: 2000, step: 10, unit: '' },
  armor: { label: '방어력 (DEF)', color: '#3498db', max: 200, step: 1, unit: '' },
  regen: { label: '체력 재생', color: '#27ae60', max: 100, step: 1, unit: '/s' },

  mp: { label: '마나 (MP)', color: '#3498db', max: 2000, step: 10, unit: '' },
  mpRegen: { label: '마나 재생', color: '#2980b9', max: 50, step: 1, unit: '/s' },
  speed: { label: '이동속도', color: '#f1c40f', max: 150, step: 1, unit: '' },
};

// 분류별 허용 스탯 정의
const TYPE_ALLOWED_STATS: Record<string, string[]> = {
  WEAPON: ['ad', 'crit', 'pen', 'speed', 'hp'], 
  ARMOR: ['hp', 'armor', 'regen', 'mp'],        
  ARTIFACT: ['ap', 'mp', 'mpRegen', 'pen', 'hp'], 
  BOOTS: ['speed', 'armor', 'pen'],             
  ACCESSORY: Object.keys(ALL_STATS),            
  POWER: Object.keys(ALL_STATS),                
};

const DEFAULT_ITEM: Item = {
  id: '', name: '', cost: 1000,
  ad: 0, ap: 0, hp: 0, armor: 0, crit: 0, speed: 0,
  mp: 0, regen: 0, mpRegen: 0, pen: 0,
  type: 'WEAPON', description: ''
};

// 스탯 에디터 컴포넌트
const StatEditor = ({ 
  statKey, data, activeStat, setActiveStat, handleChange 
}: { 
  statKey: string, 
  data: Item, 
  activeStat: string | null, 
  setActiveStat: (key: string | null) => void, 
  handleChange: (field: keyof Item, value: number) => void 
}) => {
  const config = ALL_STATS[statKey];
  const value = (data as any)[statKey] || 0;
  const isActive = activeStat === statKey;

  return (
    <div 
      onClick={() => setActiveStat(isActive ? null : statKey)}
      style={{
        background: isActive ? '#1f242e' : '#161b22',
        border: isActive ? `1px solid ${config.color}` : '1px solid #30363d',
        borderRadius: '10px', padding: '12px',
        cursor: 'pointer', transition: 'all 0.2s',
        display: 'flex', flexDirection: 'column', gap: '8px'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '11px', color: isActive ? config.color : '#888', fontWeight: 'bold' }}>
          {config.label}
        </span>
        <span style={{ fontSize: '16px', fontWeight: '900', color: value > 0 ? config.color : '#555', fontFamily: 'monospace' }}>
          {value > 0 ? '+' : ''}{value}{config.unit}
        </span>
      </div>

      {isActive && (
        <div onClick={(e) => e.stopPropagation()} style={{ marginTop: '10px', animation: 'fadeIn 0.2s' }}>
          <input 
            type="range" min={0} max={config.max} step={config.step} value={value}
            onChange={(e) => handleChange(statKey as keyof Item, Number(e.target.value))}
            style={{ width: '100%', accentColor: config.color, height: '20px', cursor: 'pointer', marginBottom: '10px', touchAction: 'none' }}
          />
          <div style={{ display: 'flex', gap: '5px', justifyContent: 'flex-end' }}>
            <button onClick={() => handleChange(statKey as keyof Item, Math.max(0, value - (config.step*10)))} className="mini-btn">--</button>
            <button onClick={() => handleChange(statKey as keyof Item, Math.max(0, value - config.step))} className="mini-btn">-</button>
            <button onClick={() => handleChange(statKey as keyof Item, Math.min(config.max, value + config.step))} className="mini-btn">+</button>
            <button onClick={() => handleChange(statKey as keyof Item, Math.min(config.max, value + (config.step*10)))} className="mini-btn">++</button>
          </div>
        </div>
      )}
    </div>
  );
};

export const ItemPatchModal: React.FC<Props> = ({ item, onClose }) => {
  // deleteItem을 안전하게 가져옵니다. (없으면 undefined)
  const store = useGameStore();
  const { addItem, updateItem, setCustomImage, removeCustomImage } = store;
  // deleteItem이 없을 경우를 대비해 any로 처리하거나 방어 코드 작성
  const deleteItem = (store as any).deleteItem;

  const [data, setData] = useState<Item>(DEFAULT_ITEM);
  const [activeStat, setActiveStat] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (item) setData({ ...DEFAULT_ITEM, ...item });
    else setData({ ...DEFAULT_ITEM, id: `i_custom_${Date.now()}` });
  }, [item]);

  const handleSave = () => {
    if (!data.name) return alert('아이템 이름을 입력해주세요.');
    item ? updateItem(item.id, data) : addItem(data);
    onClose();
  };

  const handleDelete = () => {
    if (!item) return;
    if (!deleteItem) {
      alert("삭제 기능이 스토어에 연결되지 않았습니다. (store/itemSlice.ts 확인)");
      return;
    }
    if (confirm(`정말 '${item.name}' 아이템을 삭제하시겠습니까?`)) {
      deleteItem(item.id);
      onClose();
    }
  };

  const handleChange = (field: keyof Item, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') setCustomImage(data.id, reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const visibleStats = TYPE_ALLOWED_STATS[data.type] || Object.keys(ALL_STATS);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999,
      display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(5px)', padding: '15px'
    }}>
      <div style={{ 
        width: '100%', maxWidth: '500px', background: '#0d1117', border: '1px solid #30363d', 
        borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh',
        boxShadow: '0 20px 60px rgba(0,0,0,0.8)'
      }}>

        {/* 1. 상단 정보 */}
        <div style={{ padding: '20px', borderBottom: '1px solid #30363d', background: '#161b22', display: 'flex', gap: '15px' }}>
          <div onClick={() => fileInputRef.current?.click()} className="group" style={{ position: 'relative', cursor: 'pointer', flexShrink: 0 }}>
            <GameIcon id={data.id} size={72} shape="rounded" border="2px solid #30363d" />
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', opacity: 0, transition: '0.2s', color: '#fff', fontSize: '10px', fontWeight: 'bold' }} className="hover-show">변경</div>
            <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleImageUpload} />
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <input 
              type="text" value={data.name} onChange={(e) => handleChange('name', e.target.value)}
              placeholder="아이템 이름"
              style={{ background: 'transparent', border: 'none', borderBottom: '1px solid #30363d', color: '#fff', fontSize: '16px', fontWeight: 'bold', padding: '5px 0', width: '100%', outline: 'none' }}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '10px', color: '#888' }}>가격</label>
                <input 
                  type="number" value={data.cost} onChange={(e) => handleChange('cost', Number(e.target.value))}
                  style={{ background: '#0d1117', border: '1px solid #30363d', color: '#f1c40f', borderRadius: '4px', width: '100%', padding: '6px', fontWeight: 'bold', fontSize: '13px' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '10px', color: '#888' }}>분류</label>
                <select 
                  value={data.type} onChange={(e) => handleChange('type', e.target.value)}
                  style={{ background: '#0d1117', border: '1px solid #30363d', color: '#ccc', borderRadius: '4px', width: '100%', padding: '6px', fontSize: '12px' }}
                >
                  <option value="WEAPON">⚔️ 무기</option>
                  <option value="ARMOR">🛡️ 방어구</option>
                  <option value="ARTIFACT">🔮 마도구</option>
                  <option value="BOOTS">👞 신발</option>
                  <option value="ACCESSORY">💍 장신구</option>
                  <option value="POWER">⚡ 권능</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* 2. 스탯 에디터 */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          <div style={{ marginBottom: '20px' }}>
            <textarea 
              value={data.description || ''} onChange={(e) => handleChange('description', e.target.value)}
              placeholder="설명..." rows={2}
              style={{ width: '100%', background: '#161b22', border: '1px solid #30363d', borderRadius: '8px', padding: '10px', color: '#ccc', fontSize: '12px', resize: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {visibleStats.map(key => (
              <StatEditor key={key} statKey={key} data={data} activeStat={activeStat} setActiveStat={setActiveStat} handleChange={handleChange} />
            ))}
          </div>

          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}>
            <button onClick={() => removeCustomImage(data.id)} style={{ background: 'none', border: 'none', color: '#666', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Trash size={12}/> 사진 초기화
            </button>
          </div>
        </div>

        {/* 3. 푸터 (삭제 버튼 포함) */}
        <div style={{ padding: '15px 20px', borderTop: '1px solid #30363d', background: '#161b22', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            {item && (
              <button 
                onClick={handleDelete}
                style={{ 
                  padding: '10px 16px', background: '#3f1515', border: '1px solid #5a1e1e', 
                  color: '#ff6b6b', borderRadius: '8px', cursor: 'pointer', 
                  fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' 
                }}
              >
                <Trash size={16}/> 삭제
              </button>
            )}
          </div>

          <div style={{ display:'flex', gap:'10px' }}>
            <button onClick={onClose} style={{ padding: '10px 20px', background: 'transparent', border: '1px solid #30363d', color: '#ccc', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>취소</button>
            <button onClick={handleSave} style={{ padding: '10px 24px', background: '#238636', border: 'none', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Save size={16}/> {item ? '수정' : '생성'}
            </button>
          </div>
        </div>

      </div>
      <style>{`
        .hover-show:hover { opacity: 1 !important; }
        .mini-btn {
          background: #30363d; border: none; color: #fff; 
          padding: 4px 8px; border-radius: 4px; 
          cursor: pointer; display: flex; alignItems: center; justifyContent: center;
          font-size: 11px; font-weight: bold;
        }
        .mini-btn:hover { background: #444; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};
