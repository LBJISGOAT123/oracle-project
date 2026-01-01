// ==========================================
// FILE PATH: /src/components/common/SaveLoadModal.tsx
// ==========================================

import React, { useState, useEffect } from 'react';
import { X, Save, Upload, Download } from 'lucide-react';
import { saveToSlot, loadFromSlot, getSlotInfo, exportSaveFile, importSaveFile } from '../../engine/SaveLoadSystem';

interface Props { onClose: () => void; }

export const SaveLoadModal: React.FC<Props> = ({ onClose }) => {
  const [slots, setSlots] = useState<any>({});
  const [refreshKey, setRefreshKey] = useState(0); 

  useEffect(() => {
    setSlots({
      auto: getSlotInfo('auto'),
      slot1: getSlotInfo('slot1'),
      slot2: getSlotInfo('slot2'),
      slot3: getSlotInfo('slot3'),
    });
  }, [refreshKey]);

  const handleSave = (slotId: string) => {
    if (saveToSlot(slotId)) {
      alert("저장되었습니다!");
      setSlots(prev => ({ ...prev, [slotId]: getSlotInfo(slotId) })); // 즉시 UI 갱신
    }
  };

  // [수정된 부분] 새로고침 로직 삭제
  const handleLoad = (slotId: string) => {
    if (!slots[slotId]) return;

    if (confirm("정말 이 데이터를 불러오시겠습니까?\n현재 진행 상황은 덮어씌워집니다.")) {
      const success = loadFromSlot(slotId);
      if (success) {
        alert("로드 완료!");
        onClose(); // [중요] 새로고침 없이 모달만 닫습니다.
      } else {
        alert("로드 실패! 데이터가 손상되었을 수 있습니다.");
      }
    }
  };

  // [수정된 부분] 파일 불러오기 핸들러도 동일하게 수정
  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (confirm("파일 데이터를 불러오시겠습니까?")) {
      const success = await importSaveFile(file);
      if (success) {
        alert("파일 로드 완료!");
        onClose(); // [중요] 여기도 새로고침 제거
      }
    }
    e.target.value = ''; // 입력 초기화
  };

  const SlotItem = ({ id, name, color }: any) => {
    const info = slots[id];
    return (
      <div style={{ background: '#21262d', padding: '15px', borderRadius: '8px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: `1px solid ${color}` }}>
        <div>
          <div style={{ fontWeight: 'bold', color: color, marginBottom: '4px' }}>{name}</div>
          {info ? (
            <div style={{ fontSize: '13px', color: '#ccc' }}>
              <div>{info.info}</div>
              <div style={{ fontSize: '11px', color: '#777' }}>{new Date(info.timestamp).toLocaleString()}</div>
            </div>
          ) : (
            <div style={{ fontSize: '13px', color: '#555' }}>비어 있음</div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {id !== 'auto' && (
            <button onClick={() => handleSave(id)} style={{ padding: '8px 12px', background: '#238636', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>
              저장
            </button>
          )}
          <button 
            onClick={() => handleLoad(id)} 
            disabled={!info}
            style={{ padding: '8px 12px', background: info ? '#1f6feb' : '#333', border: 'none', borderRadius: '6px', color: '#fff', cursor: info ? 'pointer' : 'default', fontWeight: 'bold', opacity: info ? 1 : 0.5 }}
          >
            로드
          </button>
        </div>
      </div>
    );
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
      <div className="panel" style={{ width: '500px', background: '#161b22', border: '1px solid #333' }}>

        <div style={{ padding: '15px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, display:'flex', alignItems:'center', gap:'8px' }}><Save size={18}/> 저장 / 불러오기</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><X /></button>
        </div>

        <div style={{ padding: '20px' }}>
          <SlotItem id="auto" name="🔄 자동 저장 (Auto Save)" color="#e89d40" />
          <div style={{ height: '1px', background: '#333', margin: '15px 0' }}></div>
          <SlotItem id="slot1" name="📁 저장 슬롯 1" color="#58a6ff" />
          <SlotItem id="slot2" name="📁 저장 슬롯 2" color="#58a6ff" />
          <SlotItem id="slot3" name="📁 저장 슬롯 3" color="#58a6ff" />

          <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px dashed #333', display: 'flex', justifyContent: 'space-between' }}>
            <button onClick={exportSaveFile} style={{ background: 'none', border: 'none', color: '#8b949e', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px' }}>
              <Download size={14}/> PC 파일로 백업
            </button>
            <label style={{ cursor: 'pointer', color: '#8b949e', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px' }}>
              <Upload size={14}/> PC 파일 불러오기
              <input type="file" style={{ display: 'none' }} accept=".json" onChange={handleFileImport} />
            </label>
          </div>
        </div>

      </div>
    </div>
  );
};