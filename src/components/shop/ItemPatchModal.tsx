// ==========================================
// FILE PATH: /src/components/shop/ItemPatchModal.tsx
// ==========================================

import React, { useState, useEffect, useRef } from 'react';
import { Item } from '../../types';
import { useGameStore } from '../../store/useGameStore';
import { X, Save, Sword, Shield, Zap, Briefcase, Coins, Camera, Trash2 } from 'lucide-react';
import { GameIcon } from '../common/GameIcon'; // GameIcon import

interface Props {
  item?: Item | null; // null이면 '새 아이템 추가', 있으면 '수정'
  onClose: () => void;
}

const DEFAULT_ITEM: Item = {
  id: '',
  name: '',
  cost: 1000,
  ad: 0, ap: 0, hp: 0, armor: 0, crit: 0, speed: 0,
  type: 'WEAPON',
  description: ''
};

export const ItemPatchModal: React.FC<Props> = ({ item, onClose }) => {
  const { addItem, updateItem, setCustomImage, removeCustomImage } = useGameStore();
  const [data, setData] = useState<Item>(DEFAULT_ITEM);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (item) {
      setData({ ...item }); // 기존 아이템 데이터 복사
    } else {
      // 새 아이템일 경우 ID 자동 생성
      setData({ ...DEFAULT_ITEM, id: `i_custom_${Date.now()}` });
    }
  }, [item]);

  const handleSave = () => {
    if (!data.name) {
      alert('아이템 이름을 입력해주세요.');
      return;
    }

    if (item) {
      updateItem(item.id, data);
      alert('아이템 패치가 완료되었습니다.');
    } else {
      addItem(data);
      alert('신규 아이템이 개발되었습니다.');
    }
    onClose();
  };

  const handleChange = (field: keyof Item, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  // 이미지 업로드 핸들러
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setCustomImage(data.id, reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // 타입에 따른 기본 아이콘 반환
  const getDefaultIcon = () => {
    const size = 32;
    const color = '#8b949e';
    switch(data.type) {
      case 'WEAPON': return <Sword size={size} color="#e74c3c"/>;
      case 'ARMOR': return <Shield size={size} color="#2ecc71"/>;
      case 'ACCESSORY': return <Briefcase size={size} color="#f1c40f"/>;
      case 'POWER': return <Zap size={size} color="#9b59b6"/>;
      default: return <Coins size={size} color={color}/>;
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999,
      display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(5px)', padding: '10px'
    }}>
      <div style={{ 
        width: '100%', maxWidth: '500px', background: '#161b22', border: '1px solid #30363d', 
        borderRadius: '16px', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
        display: 'flex', flexDirection: 'column', maxHeight: '90vh'
      }}>

        {/* 헤더 */}
        <div style={{ padding: '15px 20px', borderBottom: '1px solid #30363d', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background:'#21262d' }}>
          <h3 style={{ margin: 0, color: '#fff', display:'flex', alignItems:'center', gap:'8px', fontSize:'16px' }}>
            {item ? '🛠️ 아이템 패치' : '✨ 신규 아이템 개발'}
          </h3>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#8b949e', cursor:'pointer' }}><X size={24}/></button>
        </div>

        {/* 바디 (스크롤 가능) */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>

          {/* 0. 아이콘 및 기본 정보 (레이아웃 변경) */}
          <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', alignItems: 'flex-start' }}>

            {/* 이미지 업로드 영역 */}
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'5px' }}>
              <div 
                style={{ position: 'relative', cursor: 'pointer' }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onClick={() => fileInputRef.current?.click()}
              >
                <GameIcon 
                  id={data.id} 
                  size={80} 
                  fallback={getDefaultIcon()} 
                  shape="rounded" 
                  border="2px solid #30363d"
                />

                {/* 호버 오버레이 */}
                <div style={{
                  position: 'absolute', inset: 0, borderRadius: '12px',
                  background: 'rgba(0,0,0,0.5)', display: isHovered ? 'flex' : 'none',
                  alignItems: 'center', justifyContent: 'center', transition: '0.2s'
                }}>
                  <Camera size={24} color="#fff" />
                </div>

                {/* 카메라 뱃지 */}
                <div style={{ position:'absolute', bottom:-5, right:-5, background:'#58a6ff', borderRadius:'50%', padding:'4px', border:'2px solid #161b22' }}>
                  <Camera size={12} color="#000" />
                </div>

                <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleImageUpload} />
              </div>

              <button 
                onClick={() => removeCustomImage(data.id)}
                style={{ fontSize:'10px', color:'#da3633', background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:'2px' }}
              >
                <Trash2 size={10}/> 사진 삭제
              </button>
            </div>

            {/* 이름 및 가격 입력 */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div className="input-group">
                <label style={{display:'block', fontSize:'11px', color:'#8b949e', marginBottom:'4px'}}>아이템 이름</label>
                <input 
                  type="text" value={data.name} 
                  onChange={(e) => handleChange('name', e.target.value)}
                  style={{ width: '100%', padding: '10px', background: '#0d1117', border: '1px solid #30363d', color: '#fff', borderRadius: '6px', boxSizing:'border-box', fontWeight:'bold' }}
                  placeholder="이름 입력..."
                />
              </div>
              <div className="input-group">
                <label style={{display:'block', fontSize:'11px', color:'#8b949e', marginBottom:'4px'}}>가격 (Gold)</label>
                <input 
                  type="number" value={data.cost} 
                  onChange={(e) => handleChange('cost', Number(e.target.value))}
                  style={{ width: '100%', padding: '10px', background: '#0d1117', border: '1px solid #30363d', color: '#f1c40f', fontWeight:'bold', borderRadius: '6px', boxSizing:'border-box' }}
                />
              </div>
            </div>
          </div>

          {/* 1. 타입 선택 */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{display:'block', fontSize:'11px', color:'#8b949e', marginBottom:'5px'}}>아이템 분류</label>
            <div style={{ display: 'flex', gap: '8px', overflowX:'auto', paddingBottom:'5px' }}>
              {[
                { id: 'WEAPON', label: '무기', icon: Sword, color: '#e74c3c' },
                { id: 'ARMOR', label: '방어구', icon: Shield, color: '#2ecc71' },
                { id: 'ACCESSORY', label: '장신구', icon: Briefcase, color: '#f1c40f' },
                { id: 'POWER', label: '권능', icon: Zap, color: '#9b59b6' },
              ].map(t => (
                <button 
                  key={t.id}
                  onClick={() => handleChange('type', t.id)}
                  style={{ 
                    flex: 1, padding: '10px', borderRadius: '8px', border: `1px solid ${data.type === t.id ? t.color : '#30363d'}`,
                    background: data.type === t.id ? `${t.color}22` : '#0d1117',
                    color: data.type === t.id ? t.color : '#8b949e',
                    cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', fontSize:'11px', fontWeight:'bold', minWidth:'60px'
                  }}
                >
                  <t.icon size={16}/> {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2. 스탯 설정 */}
          <div style={{ background:'#0d1117', padding:'15px', borderRadius:'8px', border:'1px solid #30363d', marginBottom:'20px' }}>
            <label style={{display:'block', fontSize:'12px', color:'#fff', marginBottom:'10px', fontWeight:'bold'}}>능력치 설정</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <StatInput label="공격력 (AD)" value={data.ad} onChange={(v)=>handleChange('ad', v)} color="#e74c3c" />
              <StatInput label="주문력 (AP)" value={data.ap} onChange={(v)=>handleChange('ap', v)} color="#9b59b6" />
              <StatInput label="체력 (HP)" value={data.hp} onChange={(v)=>handleChange('hp', v)} color="#2ecc71" />
              <StatInput label="방어력 (Armor)" value={data.armor} onChange={(v)=>handleChange('armor', v)} color="#3498db" />
              <StatInput label="치명타 (%)" value={data.crit} onChange={(v)=>handleChange('crit', v)} color="#e67e22" />
              <StatInput label="이동속도" value={data.speed} onChange={(v)=>handleChange('speed', v)} color="#fff" />
            </div>
          </div>

          {/* 3. 설명 */}
          <div>
            <label style={{display:'block', fontSize:'11px', color:'#8b949e', marginBottom:'5px'}}>아이템 설명</label>
            <textarea 
              value={data.description || ''} 
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              style={{ width: '100%', padding: '10px', background: '#0d1117', border: '1px solid #30363d', color: '#ccc', borderRadius: '6px', resize:'none', boxSizing:'border-box', fontSize:'12px' }}
              placeholder="아이템에 대한 설명을 입력하세요..."
            />
          </div>

        </div>

        {/* 푸터 */}
        <div style={{ padding: '15px 20px', borderTop: '1px solid #30363d', display: 'flex', justifyContent: 'flex-end', background:'#21262d' }}>
          <button onClick={handleSave} style={{ background: '#238636', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display:'flex', alignItems:'center', gap:'6px' }}>
            <Save size={16}/> {item ? '패치 적용' : '아이템 생성'}
          </button>
        </div>

      </div>
    </div>
  );
};

const StatInput = ({ label, value, onChange, color }: any) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <span style={{ fontSize: '11px', color: '#8b949e' }}>{label}</span>
    <input 
      type="number" value={value} 
      onChange={(e) => onChange(Number(e.target.value))}
      style={{ width: '60px', background: 'none', borderBottom: `1px solid ${color}`, borderTop:'none', borderLeft:'none', borderRight:'none', color: color, textAlign: 'right', fontWeight: 'bold', outline: 'none', padding:'4px 0' }}
    />
  </div>
);