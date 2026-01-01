// ==========================================
// FILE PATH: /src/components/common/SystemMenu.tsx
// ==========================================

import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { 
  saveToSlot, loadFromSlot, getSlotsMeta, deleteSlot, SaveMeta, 
  exportSaveFile, importSaveFile 
} from '../../engine/SaveLoadSystem';
import { 
  Save, Disc, AlertTriangle, X, Bot, Key, CheckCircle, 
  Download, Upload, Trash2, RefreshCw, Share2, FileJson 
} from 'lucide-react';

interface Props { onClose: () => void; }

export const SystemMenu: React.FC<Props> = ({ onClose }) => {
  const { 
    heroes, gameState, shopItems, // MOD 내보내기용 데이터
    updateAIConfig, resetHeroStats, hardReset, loadModData // 액션들
  } = useGameStore();

  const [activeTab, setActiveTab] = useState<'SAVE' | 'LOAD' | 'OPTION'>('SAVE');
  const [slots, setSlots] = useState<Record<string, SaveMeta>>({});

  // AI 설정 로컬 상태
  const [aiSettings, setAiSettings] = useState(gameState.aiConfig);

  // 파일 입력 참조
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSlots(getSlotsMeta());
  }, []);

  const refreshSlots = () => setSlots(getSlotsMeta());

  // --- 저장/로드 관련 핸들러 ---
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

  // --- 옵션/설정 관련 핸들러 ---
  const saveAISettings = () => {
    updateAIConfig(aiSettings);
    alert("✅ AI 설정이 저장되었습니다!");
  };

  const handleStatReset = () => {
    if (confirm('모든 챔피언의 누적 통계(승률, KDA, 판수)를 0으로 초기화하시겠습니까?')) {
      resetHeroStats();
      alert('통계가 초기화되었습니다.');
    }
  };

  const handleSafeReset = () => {
    if(confirm('현재 게임을 처음부터 다시 시작하시겠습니까?\n(저장된 슬롯과 설정은 유지됩니다.)')) {
      hardReset(); 
      window.location.reload();
    }
  };

  // --- [신규] MOD 데이터 핸들러 ---
  const handleExportMod = () => {
    const modData = {
      version: 1,
      heroes: heroes,
      items: shopItems,
      settings: {
        battle: gameState.battleSettings,
        field: gameState.fieldSettings,
        role: gameState.roleSettings
      },
      images: gameState.customImages
    };

    const json = JSON.stringify(modData);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GodsWar_ModData_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportMod = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm('이 MOD 파일(영웅/아이템/설정/사진)을 적용하시겠습니까?\n\n* 주의: 현재 진행 중인 랭킹이나 승률 데이터는 유지되지만, 영웅의 이름이나 능력치는 변경됩니다.')) {
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target?.result as string);
        if (json.heroes && json.settings) {
          loadModData(json);
          alert('✅ MOD 데이터 적용 완료!\n게임 설정이 변경되었습니다.');
        } else {
          alert('❌ 올바르지 않은 MOD 파일 형식입니다.');
        }
      } catch (err) {
        console.error(err);
        alert('❌ 파일 로드 중 오류가 발생했습니다.');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // 초기화
  };

  // --- UI 컴포넌트 ---
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const SlotItem = ({ id, label, isAuto = false }: { id: string, label: string, isAuto?: boolean }) => {
    const meta = slots[id];
    const isEmpty = !meta;
    return (
      <div 
        onClick={() => activeTab === 'SAVE' ? handleSave(id) : handleLoad(id)}
        style={{ 
          background: isEmpty ? '#222' : '#2a2a2e', border: '1px solid #444', borderRadius: '8px', padding: '15px', marginBottom: '10px',
          cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: '0.2s',
          opacity: (activeTab === 'LOAD' && isEmpty) ? 0.5 : 1, pointerEvents: (activeTab === 'LOAD' && isEmpty) ? 'none' : 'auto'
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor = '#58a6ff'} onMouseLeave={e => e.currentTarget.style.borderColor = '#444'}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: isAuto ? '#e89d40' : '#58a6ff', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>{isAuto ? 'A' : id}</div>
          <div>
            <div style={{ fontWeight: 'bold', color: isEmpty ? '#777' : '#fff', fontSize: '14px' }}>{label}</div>
            {isEmpty ? <div style={{ fontSize: '12px', color: '#555' }}>비어 있음</div> : <div style={{ fontSize: '11px', color: '#aaa', marginTop: '4px' }}>Day {meta.day} • 유저 {meta.totalUsers.toLocaleString()}명 <br/><span style={{ color: '#666' }}>{meta.dateStr}</span></div>}
          </div>
        </div>
        <div style={{ display:'flex', gap:'10px' }}>
            {activeTab === 'SAVE' && <div style={{ fontSize:'12px', color:'#58a6ff', fontWeight:'bold' }}>{isEmpty ? '저장하기' : '덮어쓰기'}</div>}
            {!isEmpty && activeTab === 'SAVE' && <button onClick={(e) => handleDelete(e, id)} style={{ background:'none', border:'none', color:'#da3633', cursor:'pointer' }}><Trash2 size={16} /></button>}
        </div>
      </div>
    );
  };

  return (
    <div onClick={handleBackdropClick} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, backdropFilter: 'blur(5px)', padding: '10px' }}>
      <div className="panel" style={{ width: '100%', maxWidth: '450px', maxHeight: '90vh', background: '#1c1c1f', border: '1px solid #30363d', display:'flex', flexDirection:'column', padding:0, overflow: 'hidden', borderRadius: '12px' }}>

        {/* 헤더 */}
        <div style={{ padding: '15px 20px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#252528', flexShrink: 0 }}>
          <h3 style={{ margin: 0, color: '#fff', fontSize: '16px' }}>시스템 메뉴</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding:'5px' }}><X size={24} /></button>
        </div>

        {/* 탭 버튼 */}
        <div style={{ display: 'flex', background: '#161b22', borderBottom: '1px solid #333', flexShrink: 0 }}>
          {([
            { id: 'SAVE', label: '저장', icon: Save },
            { id: 'LOAD', label: '불러오기', icon: Disc },
            { id: 'OPTION', label: '옵션', icon: AlertTriangle }
          ] as const).map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ flex: 1, padding: '15px', background: 'none', border: 'none', borderBottom: activeTab === t.id ? '2px solid #58a6ff' : '2px solid transparent', color: activeTab === t.id ? '#fff' : '#777', fontWeight: 'bold', cursor: 'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' }}>
              <t.icon size={16} /> {t.label}
            </button>
          ))}
        </div>

        {/* 메인 컨텐츠 */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>

          {(activeTab === 'SAVE' || activeTab === 'LOAD') && (
            <>
              <div style={{ fontSize:'12px', color:'#888', marginBottom:'15px', textAlign:'center' }}>{activeTab === 'SAVE' ? '슬롯을 선택하여 저장하세요.' : '불러올 슬롯을 선택하세요.'}</div>
              <SlotItem id="auto" label="자동 저장 슬롯 (Auto)" isAuto />
              <div style={{ height:'10px' }}></div>
              <SlotItem id="1" label="저장 슬롯 1" />
              <SlotItem id="2" label="저장 슬롯 2" />
              <SlotItem id="3" label="저장 슬롯 3" />
            </>
          )}

          {activeTab === 'OPTION' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
               {/* 1. AI 설정 */}
               <div style={{ background: '#161b22', padding: '15px', borderRadius: '8px', border: '1px solid #30363d' }}>
                  <h4 style={{ margin:'0 0 15px 0', color:'#58a6ff', display:'flex', alignItems:'center', gap:'6px', fontSize:'14px' }}><Bot size={16}/> 커뮤니티 AI 설정</h4>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' }}>
                    <span style={{ fontSize:'13px', color:'#fff' }}>AI 글작성 활성화</span>
                    <input type="checkbox" checked={aiSettings.enabled} onChange={e => setAiSettings({...aiSettings, enabled: e.target.checked})} style={{ transform:'scale(1.2)', cursor:'pointer' }}/>
                  </div>
                  <div style={{ marginBottom:'12px' }}>
                    <div style={{ fontSize:'11px', color:'#8b949e', marginBottom:'4px' }}>AI 모델 제공자</div>
                    <select value={aiSettings.provider} onChange={e => setAiSettings({...aiSettings, provider: e.target.value as any})} style={{ width:'100%', padding:'8px', background:'#0d1117', border:'1px solid #30363d', color:'#fff', borderRadius:'4px' }}>
                      <option value="GEMINI">Google Gemini (무료/빠름)</option>
                      <option value="OPENAI">OpenAI GPT (유료/고성능)</option>
                    </select>
                  </div>
                  <div style={{ marginBottom:'12px' }}>
                    <div style={{ fontSize:'11px', color:'#8b949e', marginBottom:'4px' }}>사용할 모델명</div>
                    <input type="text" value={aiSettings.model} onChange={e => setAiSettings({...aiSettings, model: e.target.value})} placeholder="예: gemini-2.5-flash" style={{ width:'100%', padding:'8px', background:'#0d1117', border:'1px solid #30363d', color:'#fff', borderRadius:'4px', boxSizing:'border-box' }}/>
                  </div>
                  <div style={{ marginBottom:'15px' }}>
                    <div style={{ fontSize:'11px', color:'#8b949e', marginBottom:'4px' }}>API Key</div>
                    <div style={{ display:'flex', alignItems:'center', gap:'8px', background:'#0d1117', border:'1px solid #30363d', borderRadius:'4px', padding:'0 8px' }}>
                      <Key size={14} color="#666"/>
                      <input type="password" value={aiSettings.apiKey} onChange={e => setAiSettings({...aiSettings, apiKey: e.target.value})} placeholder="API 키 입력..." style={{ flex:1, padding:'8px 0', background:'none', border:'none', color:'#fff', outline:'none' }}/>
                    </div>
                  </div>
                  <button onClick={saveAISettings} className="btn" style={{ width:'100%', background:'#238636', color:'#fff', display:'flex', justifyContent:'center', alignItems:'center', gap:'6px', padding:'10px' }}><CheckCircle size={16}/> 설정 저장</button>
               </div>

               <div style={{ borderTop: '1px solid #333', margin: '5px 0' }}></div>

               {/* 2. 파일 관리 */}
               <h4 style={{ margin:'0 0 10px 0', color:'#ccc' }}>파일 관리</h4>

               {/* [신규] MOD 데이터 공유 섹션 */}
               <div style={{ background: '#21262d', padding: '15px', borderRadius: '8px', border: '1px dashed #58a6ff', marginBottom: '10px' }}>
                 <div style={{ fontSize: '13px', color: '#58a6ff', fontWeight: 'bold', marginBottom: '5px', display:'flex', alignItems:'center', gap:'6px' }}>
                   <Share2 size={14}/> 게임 설정(MOD) 공유
                 </div>
                 <div style={{ fontSize: '11px', color: '#8b949e', marginBottom: '10px' }}>
                   내가 만든 영웅, 아이템, 밸런스 설정, 사진을<br/>파일로 저장하여 친구에게 공유할 수 있습니다.<br/>
                   <span style={{color:'#ccc'}}>(랭킹/전적 등 진행 상황은 포함되지 않습니다.)</span>
                 </div>
                 <div style={{ display: 'flex', gap: '10px' }}>
                   <button onClick={handleExportMod} className="btn" style={{ flex: 1, background: '#1f6feb', color: '#fff', border:'none', fontSize:'12px', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px' }}>
                     <Download size={14}/> 설정 내보내기
                   </button>
                   <button onClick={() => modInputRef.current?.click()} className="btn" style={{ flex: 1, background: '#238636', color: '#fff', border:'none', fontSize:'12px', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px' }}>
                     <FileJson size={14}/> 설정 적용하기
                   </button>
                   <input type="file" ref={modInputRef} onChange={handleImportMod} style={{ display: 'none' }} accept=".json" />
                 </div>
               </div>

               {/* 전체 세이브 백업 */}
               <div style={{ display: 'flex', gap: '10px' }}>
                 <button onClick={exportSaveFile} className="btn" style={{ flex:1, background: '#30363d', border:'1px solid #444', color: '#ccc', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize:'12px' }}>
                   <Download size={14} /> 전체 세이브 백업
                 </button>
                 <button onClick={() => fileInputRef.current?.click()} className="btn" style={{ flex:1, background: '#30363d', border:'1px solid #444', color: '#ccc', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize:'12px' }}>
                   <Upload size={14} /> 전체 세이브 복구
                 </button>
                 <input type="file" ref={fileInputRef} onChange={async (e) => {
                   const file = e.target.files?.[0];
                   if(file && await importSaveFile(file, heroes)) {
                      alert('로드 성공!'); window.location.reload();
                   }
                 }} style={{ display: 'none' }} accept=".json" />
               </div>

               <div style={{ borderTop: '1px solid #333', margin: '10px 0' }}></div>

               {/* 3. 초기화 */}
               <h4 style={{ margin:'0 0 10px 0', color:'#da3633' }}>게임 초기화</h4>
               <div style={{ background: '#251010', padding: '15px', borderRadius: '8px', border: '1px solid #4a1e1e', marginBottom: '10px' }}>
                 <div style={{ fontSize: '12px', color: '#ff7b72', marginBottom: '10px', lineHeight: '1.4' }}>
                   <b>현재 진행 중인 게임</b>만 Day 1로 되돌립니다.<br/>
                   <span style={{ color:'#fff', opacity:0.7 }}>* 저장된 슬롯과 AI 설정은 삭제되지 않습니다.</span>
                 </div>
                 <button onClick={handleSafeReset} className="btn" style={{ background: '#da3633', color: '#fff', width: '100%', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' }}>
                   <Trash2 size={16} /> 현재 게임 재시작 (Day 1)
                 </button>
               </div>
               <div style={{ background: '#2d1b08', padding: '15px', borderRadius: '8px', border: '1px solid #633c0d' }}>
                 <div style={{ fontSize: '12px', color: '#e89d40', marginBottom: '10px' }}>
                   현재 진행 상황은 유지하고 통계만 0으로 만듭니다.
                 </div>
                 <button onClick={handleStatReset} className="btn" style={{ background: '#d29922', color: '#000', width: '100%', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', fontWeight:'bold' }}>
                   <RefreshCw size={16} /> 통계만 초기화
                 </button>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};