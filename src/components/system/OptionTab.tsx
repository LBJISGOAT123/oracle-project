// ==========================================
// FILE PATH: /src/components/system/OptionTab.tsx
// ==========================================

import React, { useState, useRef } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { exportSaveFile, importSaveFile } from '../../engine/SaveLoadSystem';
import { Bot, Key, CheckCircle, Download, Upload, Trash2, RefreshCw, Share2, FileJson } from 'lucide-react';

export const OptionTab: React.FC = () => {
  const { gameState, heroes, shopItems, updateAIConfig, resetHeroStats, hardReset, loadModData } = useGameStore();
  const [aiSettings, setAiSettings] = useState(gameState.aiConfig);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modInputRef = useRef<HTMLInputElement>(null);

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

  // [수정] MOD 데이터 내보내기 (데이터 정화 로직 추가)
  const handleExportMod = () => {
    // 1. 영웅 데이터에서 '기록(Record)'과 '랭킹' 정보를 제거하고 순수 '설정'만 추출
    const cleanHeroes = heroes.map(h => ({
      id: h.id,
      name: h.name,
      role: h.role,
      concept: h.concept, // [필수] 대사/컨셉 포함
      stats: h.stats,     // [필수] 마나, 재생 등 모든 스탯 포함
      skills: h.skills    // [필수] 마나 소모량 등 스킬 정보 포함
      // record, tier, rank, recentWinRate 등은 제외됨 (깨끗!)
    }));

    const modData = {
      version: 2, // 버전 업
      heroes: cleanHeroes,
      items: shopItems, // 아이템은 그 자체로 설정이므로 그대로 저장
      settings: {
        battle: gameState.battleSettings, // 넥서스 체력 등
        field: gameState.fieldSettings,   // 정글/오브젝트 설정
        role: gameState.roleSettings,     // 역할군 밸런스
        tier: gameState.tierConfig        // 티어 커트라인 설정도 모드에 포함 (선택적)
      },
      images: gameState.customImages      // 커스텀 이미지 포함
    };

    const json = JSON.stringify(modData, null, 2); // 보기 좋게 정렬
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GodsWar_Mod_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // MOD 데이터 불러오기 (기존 유지)
  const handleImportMod = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm('이 파일을 적용하시겠습니까?\n\n- 영웅 스탯/이름/스킬/사진이 변경됩니다.\n- 진행 중인 승률/전적 데이터는 유지됩니다.')) {
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
    e.target.value = '';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>

      {/* 1. AI 설정 */}
      <div style={{ background: '#161b22', padding: '15px', borderRadius: '8px', border: '1px solid #30363d' }}>
        <h4 style={{ margin:'0 0 15px 0', color:'#58a6ff', display:'flex', alignItems:'center', gap:'6px', fontSize:'14px' }}>
          <Bot size={16}/> 커뮤니티 AI 설정
        </h4>
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
        <button onClick={saveAISettings} className="btn" style={{ width:'100%', background:'#238636', color:'#fff', display:'flex', justifyContent:'center', alignItems:'center', gap:'6px', padding:'10px' }}>
          <CheckCircle size={16}/> 설정 저장
        </button>
      </div>

      <div style={{ borderTop: '1px solid #333', margin: '5px 0' }}></div>

      {/* 2. 파일 관리 */}
      <h4 style={{ margin:'0 0 10px 0', color:'#ccc' }}>파일 관리</h4>

      {/* MOD 데이터 공유 섹션 */}
      <div style={{ background: '#21262d', padding: '15px', borderRadius: '8px', border: '1px dashed #58a6ff', marginBottom: '10px' }}>
        <div style={{ fontSize: '13px', color: '#58a6ff', fontWeight: 'bold', marginBottom: '5px', display:'flex', alignItems:'center', gap:'6px' }}>
          <Share2 size={14}/> 게임 설정(MOD) 공유
        </div>
        <div style={{ fontSize: '11px', color: '#8b949e', marginBottom: '10px' }}>
          영웅, 아이템, 밸런스 설정, 사진만 깔끔하게 저장합니다.<br/>
          <span style={{color:'#e84057'}}>(내 전적, 랭킹, 날짜 등은 포함되지 않습니다.)</span>
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

      {/* 전체 세이브 파일 관리 */}
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

      {/* 3. 게임 초기화 */}
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
  );
};