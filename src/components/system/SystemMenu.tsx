// ==========================================
// FILE PATH: /src/components/common/SystemMenu.tsx
// ==========================================

import React, { useState } from 'react';
import { Save, Disc, AlertTriangle, X } from 'lucide-react';

// 분리한 컴포넌트 import
import { OptionTab } from '../system/OptionTab';
import { SaveLoadTab } from '../system/SaveLoadTab';

interface Props { onClose: () => void; }

export const SystemMenu: React.FC<Props> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'SAVE' | 'LOAD' | 'OPTION'>('SAVE');

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      onClick={handleBackdropClick} 
      style={{
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
        backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999,
        backdropFilter: 'blur(5px)',
        padding: '10px' 
      }}
    >
      <div className="panel" style={{ 
        width: '100%', maxWidth: '450px', maxHeight: '90vh',
        background: '#1c1c1f', border: '1px solid #30363d', 
        display:'flex', flexDirection:'column', padding:0,
        overflow: 'hidden', borderRadius: '12px'
      }}>

        {/* 헤더 */}
        <div style={{ 
          padding: '15px 20px', borderBottom: '1px solid #333', 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
          background: '#252528', flexShrink: 0 
        }}>
          <h3 style={{ margin: 0, color: '#fff', fontSize: '16px' }}>시스템 메뉴</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding:'5px' }}>
            <X size={24} />
          </button>
        </div>

        {/* 탭 버튼 */}
        <div style={{ display: 'flex', background: '#161b22', borderBottom: '1px solid #333', flexShrink: 0 }}>
          {([
            { id: 'SAVE', label: '저장', icon: Save },
            { id: 'LOAD', label: '불러오기', icon: Disc },
            { id: 'OPTION', label: '옵션', icon: AlertTriangle }
          ] as const).map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                flex: 1, padding: '15px', background: 'none', border: 'none',
                borderBottom: activeTab === t.id ? '2px solid #58a6ff' : '2px solid transparent',
                color: activeTab === t.id ? '#fff' : '#777', fontWeight: 'bold', cursor: 'pointer',
                display:'flex', alignItems:'center', justifyContent:'center', gap:'8px'
              }}
            >
              <t.icon size={16} /> {t.label}
            </button>
          ))}
        </div>

        {/* 메인 컨텐츠 영역 (분리된 컴포넌트 렌더링) */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {activeTab === 'SAVE' && <SaveLoadTab mode="SAVE" />}
          {activeTab === 'LOAD' && <SaveLoadTab mode="LOAD" />}
          {activeTab === 'OPTION' && <OptionTab />}
        </div>

      </div>
    </div>
  );
};