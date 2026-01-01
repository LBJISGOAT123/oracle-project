import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { saveToSlot, loadFromSlot, getSlotsMeta, deleteSlot, SaveMeta } from '../../engine/SaveLoadSystem';
import { Trash2 } from 'lucide-react';

interface Props {
  mode: 'SAVE' | 'LOAD'; // 저장 모드인지 불러오기 모드인지 구분
}

export const SaveLoadTab: React.FC<Props> = ({ mode }) => {
  const { heroes } = useGameStore();
  const [slots, setSlots] = useState<Record<string, SaveMeta>>({});

  useEffect(() => {
    setSlots(getSlotsMeta());
  }, []);

  const refreshSlots = () => setSlots(getSlotsMeta());

  const handleSave = (slotId: string) => {
    if (saveToSlot(slotId)) {
      alert(`${slotId === 'auto' ? '자동 저장' : `슬롯 ${slotId}`}에 저장되었습니다.`);
      refreshSlots();
    }
  };

  const handleLoad = (slotId: string) => {
    if (!slots[slotId]) return;
    if (confirm(`[Slot ${slotId}] 데이터를 불러오시겠습니까?\n현재 진행 중인 내용은 사라집니다.`)) {
      if (loadFromSlot(slotId, heroes)) {
        alert('로드 완료! 게임을 재시작합니다.');
        window.location.reload();
      }
    }
  };

  const handleDelete = (e: React.MouseEvent, slotId: string) => {
    e.stopPropagation();
    if (confirm('이 슬롯의 데이터를 삭제하시겠습니까?')) {
      deleteSlot(slotId);
      refreshSlots();
    }
  };

  // 슬롯 아이템 컴포넌트 (내부 사용)
  const SlotItem = ({ id, label, isAuto = false }: { id: string, label: string, isAuto?: boolean }) => {
    const meta = slots[id];
    const isEmpty = !meta;

    return (
      <div 
        onClick={() => mode === 'SAVE' ? handleSave(id) : handleLoad(id)}
        style={{ 
          background: isEmpty ? '#222' : '#2a2a2e', 
          border: '1px solid #444', 
          borderRadius: '8px', 
          padding: '15px', 
          marginBottom: '10px',
          cursor: 'pointer',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          transition: '0.2s',
          opacity: (mode === 'LOAD' && isEmpty) ? 0.5 : 1,
          pointerEvents: (mode === 'LOAD' && isEmpty) ? 'none' : 'auto'
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor = '#58a6ff'}
        onMouseLeave={e => e.currentTarget.style.borderColor = '#444'}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ 
            width: '40px', height: '40px', borderRadius: '50%', 
            background: isAuto ? '#e89d40' : '#58a6ff', color: '#000',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' 
          }}>
            {isAuto ? 'A' : id}
          </div>
          <div>
            <div style={{ fontWeight: 'bold', color: isEmpty ? '#777' : '#fff', fontSize: '14px' }}>
              {label}
            </div>
            {isEmpty ? (
              <div style={{ fontSize: '12px', color: '#555' }}>비어 있음</div>
            ) : (
              <div style={{ fontSize: '11px', color: '#aaa', marginTop: '4px' }}>
                Day {meta.day} • 유저 {meta.totalUsers.toLocaleString()}명 <br/>
                <span style={{ color: '#666' }}>{meta.dateStr}</span>
              </div>
            )}
          </div>
        </div>

        <div style={{ display:'flex', gap:'10px' }}>
            {mode === 'SAVE' && (
                <div style={{ fontSize:'12px', color:'#58a6ff', fontWeight:'bold' }}>
                    {isEmpty ? '저장하기' : '덮어쓰기'}
                </div>
            )}
            {!isEmpty && mode === 'SAVE' && (
                <button onClick={(e) => handleDelete(e, id)} style={{ background:'none', border:'none', color:'#da3633', cursor:'pointer' }}>
                    <Trash2 size={16} />
                </button>
            )}
        </div>
      </div>
    );
  };

  return (
    <>
      <div style={{ fontSize:'12px', color:'#888', marginBottom:'15px', textAlign:'center' }}>
        {mode === 'SAVE' ? '슬롯을 선택하여 저장하세요.' : '불러올 슬롯을 선택하세요.'}
      </div>

      <SlotItem id="auto" label="자동 저장 슬롯 (Auto)" isAuto />
      <div style={{ height:'10px' }}></div>
      <SlotItem id="1" label="저장 슬롯 1" />
      <SlotItem id="2" label="저장 슬롯 2" />
      <SlotItem id="3" label="저장 슬롯 3" />
    </>
  );
};