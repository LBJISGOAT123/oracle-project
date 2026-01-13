import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { saveToSlot, loadFromSlot, getSlotsMeta, deleteSlot, SaveMeta } from '../../engine/SaveLoadSystem';
import { Trash2, Clock, Calendar, Loader2 } from 'lucide-react';

interface Props {
  mode: 'SAVE' | 'LOAD'; 
}

export const SaveLoadTab: React.FC<Props> = ({ mode }) => {
  const { heroes } = useGameStore();
  const [slots, setSlots] = useState<Record<string, SaveMeta>>({});
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    setSlots(getSlotsMeta());
  }, []);

  const refreshSlots = () => {
    setSlots(getSlotsMeta());
  };

  const handleSave = async (slotId: string) => {
    if (isProcessing) return;
    setIsProcessing(true);
    
    const success = await saveToSlot(slotId);
    if (success) {
      // [수정] 백틱과 변수 앞의 역슬래시 제거 (올바른 JS 문법)
      alert(`${slotId === 'auto' ? '자동 저장' : `슬롯 ${slotId}`}에 성공적으로 저장되었습니다.`);
      refreshSlots();
    }
    setIsProcessing(false);
  };

  const handleLoad = async (slotId: string) => {
    if (isProcessing) return;
    if (!slots[slotId]) return;

    // [수정] 백틱과 변수 앞의 역슬래시 제거
    if (confirm(`[Slot ${slotId}] 데이터를 불러오시겠습니까?`)) {
      setIsProcessing(true);
      
      const success = await loadFromSlot(slotId, heroes);
      
      // 로드 성공 여부와 관계없이 프로세싱 상태 해제 (화면은 엔진이 이미 갱신함)
      setIsProcessing(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, slotId: string) => {
    e.stopPropagation();
    if (confirm('이 슬롯의 데이터를 삭제하시겠습니까?')) {
      await deleteSlot(slotId);
      refreshSlots();
    }
  };

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
          cursor: isProcessing ? 'wait' : 'pointer',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          transition: '0.2s',
          opacity: (mode === 'LOAD' && isEmpty) || isProcessing ? 0.5 : 1,
          pointerEvents: (mode === 'LOAD' && isEmpty) || isProcessing ? 'none' : 'auto'
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
            <div style={{ fontWeight: 'bold', color: isEmpty ? '#777' : '#fff', fontSize: '14px', marginBottom:'4px' }}>
              {label}
            </div>
            {isEmpty ? (
              <div style={{ fontSize: '12px', color: '#555' }}>비어 있음</div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:'2px' }}>
                <div style={{ fontSize: '12px', color: '#e89d40', fontWeight:'bold', display:'flex', alignItems:'center', gap:'4px' }}>
                   {/* [수정] 여기도 역슬래시 제거 */}
                   <Clock size={12}/> {meta.gameTimeDisplay || `S${meta.season} Day${meta.day}`}
                </div>
                <div style={{ fontSize: '11px', color: '#888', display:'flex', alignItems:'center', gap:'4px' }}>
                   <Calendar size={11}/> {meta.realDateStr || new Date(meta.timestamp).toLocaleString()}
                </div>
                <div style={{ fontSize:'11px', color:'#666' }}>유저 {meta.totalUsers.toLocaleString()}명</div>
              </div>
            )}
          </div>
        </div>

        <div style={{ display:'flex', gap:'10px', alignItems:'center' }}>
            {isProcessing ? <Loader2 size={16} className="animate-spin text-white"/> : (
              <>
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
              </>
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
      
      <style>{`
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </>
  );
};
