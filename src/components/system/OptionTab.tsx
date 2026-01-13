import React, { useState, useRef, useEffect } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { exportSaveFile, importSaveFile } from '../../engine/SaveLoadSystem';
// [신규] 다운로더 임포트
import { downloadAllResources, checkCachedStatus } from '../../utils/ResourceDownloader';
import { 
  Bot, Key, CheckCircle, Download, Upload, Trash2, RefreshCw, 
  Map as MapIcon, Image as ImageIcon, Database, CloudLightning, Loader2 
} from 'lucide-react';

export const OptionTab: React.FC = () => {
  const { gameState, heroes, shopItems, updateAIConfig, resetHeroStats, hardReset, loadModData, setCustomImage, removeCustomImage } = useGameStore();
  const [aiSettings, setAiSettings] = useState(gameState.aiConfig);
  
  // [신규] 다운로드 상태 관리
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [cachedCount, setCachedCount] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modInputRef = useRef<HTMLInputElement>(null);
  const mapInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    checkCachedStatus().then(setCachedCount);
  }, []);

  const handleDownloadResources = async () => {
    if (isDownloading) return;
    if (!confirm("게임에 필요한 모든 이미지를 다운로드하시겠습니까?\n(약 5~10MB 소요)")) return;

    setIsDownloading(true);
    setProgress(0);

    const success = await downloadAllResources((current, total) => {
      setProgress((current / total) * 100);
    });

    if (success) {
      alert("✅ 모든 리소스 다운로드 완료!\n이제 로딩 없이 쾌적하게 플레이할 수 있습니다.");
      checkCachedStatus().then(setCachedCount);
    }
    setIsDownloading(false);
  };

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

  // 기존 함수들 유지
  const handleExportMod = () => {
    const cleanHeroes = heroes.map(h => ({
      id: h.id, name: h.name, role: h.role, concept: h.concept, stats: h.stats, skills: h.skills
    }));
    const modData = {
      version: 2,
      heroes: cleanHeroes, items: shopItems,
      settings: { battle: gameState.battleSettings, field: gameState.fieldSettings, role: gameState.roleSettings, tier: gameState.tierConfig },
      images: gameState.customImages
    };
    const json = JSON.stringify(modData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `GodsWar_Mod_${new Date().toISOString().slice(0,10)}.json`;
    a.click(); URL.revokeObjectURL(url);
  };

  const handleImportMod = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!confirm('이 파일을 적용하시겠습니까?')) { e.target.value = ''; return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target?.result as string);
        if (json.heroes && json.settings) {
          loadModData(json);
          alert('✅ MOD 데이터 적용 완료!');
        } else alert('❌ 올바르지 않은 MOD 파일 형식입니다.');
      } catch (err) { console.error(err); alert('❌ 파일 로드 중 오류가 발생했습니다.'); }
    };
    reader.readAsText(file); e.target.value = '';
  };

  const handleMapUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if(file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if(typeof reader.result === 'string') {
          setCustomImage('map_bg', reader.result); 
          alert("✅ 전장 맵 스킨이 적용되었습니다!");
        }
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleMapReset = () => {
    if(confirm("맵 스킨을 기본값으로 되돌리시겠습니까?")) {
      removeCustomImage('map_bg');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>

      {/* 1. [신규] 리소스 다운로드 섹션 */}
      <div style={{ background: '#161b22', padding: '15px', borderRadius: '8px', border: '1px solid #30363d' }}>
        <h4 style={{ margin:'0 0 10px 0', color:'#f1c40f', display:'flex', alignItems:'center', gap:'6px', fontSize:'14px' }}>
          <CloudLightning size={16}/> 게임 리소스 최적화
        </h4>
        <div style={{ fontSize: '11px', color: '#8b949e', marginBottom: '10px' }}>
          이미지가 느리게 뜬다면 리소스를 미리 다운로드하세요.<br/>
          현재 저장된 리소스: <span style={{color:'#fff', fontWeight:'bold'}}>{cachedCount}개</span>
        </div>
        
        {isDownloading ? (
          <div style={{ background:'#0d1117', borderRadius:'6px', padding:'10px', border:'1px solid #30363d' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'6px', fontSize:'12px', color:'#fff' }}>
              <span>Downloading...</span>
              <span>{progress.toFixed(0)}%</span>
            </div>
            <div style={{ width:'100%', height:'6px', background:'#333', borderRadius:'3px', overflow:'hidden' }}>
              <div style={{ width:`${progress}%`, height:'100%', background:'#f1c40f', transition:'width 0.1s' }}></div>
            </div>
          </div>
        ) : (
          <button 
            onClick={handleDownloadResources} 
            className="btn" 
            style={{ width:'100%', background: '#d29922', color: '#000', border:'none', fontSize:'13px', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', padding:'10px' }}
          >
            <Database size={16}/> 리소스 전체 다운로드 (Fast Load)
          </button>
        )}
      </div>

      <div style={{ borderTop: '1px solid #333', margin: '5px 0' }}></div>

      {/* 2. 맵 스킨 설정 */}
      <div style={{ background: '#161b22', padding: '15px', borderRadius: '8px', border: '1px solid #30363d' }}>
        <h4 style={{ margin:'0 0 10px 0', color:'#2ecc71', display:'flex', alignItems:'center', gap:'6px', fontSize:'14px' }}>
          <MapIcon size={16}/> 전장(Map) 스킨 설정
        </h4>
        <div style={{ fontSize: '11px', color: '#8b949e', marginBottom: '10px' }}>
          AI로 생성한 맵 이미지를 업로드하면 관전 배경에 적용됩니다.
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => mapInputRef.current?.click()} className="btn" style={{ flex: 2, background: '#238636', color: '#fff', border:'none', fontSize:'12px', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px' }}>
            <ImageIcon size={14}/> 맵 이미지 업로드
          </button>
          <button onClick={handleMapReset} className="btn" style={{ flex: 1, background: '#3f1515', color: '#ff6b6b', border:'1px solid #5a1e1e', fontSize:'12px', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px' }}>
            <Trash2 size={14}/> 초기화
          </button>
          <input type="file" ref={mapInputRef} onChange={handleMapUpload} style={{ display: 'none' }} accept="image/*" />
        </div>
      </div>

      <div style={{ borderTop: '1px solid #333', margin: '5px 0' }}></div>

      {/* 3. AI 설정 */}
      <div style={{ background: '#161b22', padding: '15px', borderRadius: '8px', border: '1px solid #30363d' }}>
        <h4 style={{ margin:'0 0 15px 0', color:'#58a6ff', display:'flex', alignItems:'center', gap:'6px', fontSize:'14px' }}>
          <Bot size={16}/> 커뮤니티 AI 설정
        </h4>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' }}>
          <span style={{ fontSize:'13px', color:'#fff' }}>AI 글작성 활성화</span>
          <input type="checkbox" checked={aiSettings.enabled} onChange={e => setAiSettings({...aiSettings, enabled: e.target.checked})} style={{ transform:'scale(1.2)', cursor:'pointer' }}/>
        </div>
        <div style={{ marginBottom:'12px' }}>
          <div style={{ fontSize:'11px', color:'#8b949e', marginBottom:'4px' }}>API Key</div>
          <input type="password" value={aiSettings.apiKey} onChange={e => setAiSettings({...aiSettings, apiKey: e.target.value})} placeholder="API 키 입력..." style={{ width:'100%', padding:'8px', background:'#0d1117', border:'1px solid #30363d', color:'#fff', borderRadius:'4px', boxSizing:'border-box' }}/>
        </div>
        <button onClick={saveAISettings} className="btn" style={{ width:'100%', background:'#1f6feb', color:'#fff', display:'flex', justifyContent:'center', alignItems:'center', gap:'6px', padding:'10px' }}>
          <CheckCircle size={16}/> 설정 저장
        </button>
      </div>

      <div style={{ borderTop: '1px solid #333', margin: '5px 0' }}></div>

      {/* 4. 파일 관리 */}
      <h4 style={{ margin:'0 0 10px 0', color:'#ccc' }}>파일 관리</h4>
      <div style={{ display: 'flex', gap: '10px', marginBottom:'10px' }}>
        <button onClick={handleExportMod} className="btn" style={{ flex: 1, background: '#30363d', color: '#ccc', border:'1px solid #444', fontSize:'12px', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px' }}>
          <Download size={14}/> MOD 내보내기
        </button>
        <button onClick={() => modInputRef.current?.click()} className="btn" style={{ flex: 1, background: '#30363d', color: '#ccc', border:'1px solid #444', fontSize:'12px', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px' }}>
          <Upload size={14}/> MOD 적용
        </button>
        <input type="file" ref={modInputRef} onChange={handleImportMod} style={{ display: 'none' }} accept=".json" />
      </div>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button onClick={exportSaveFile} className="btn" style={{ flex:1, background: '#30363d', border:'1px solid #444', color: '#ccc', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize:'12px' }}>
          <Download size={14} /> 세이브 백업
        </button>
        <button onClick={() => fileInputRef.current?.click()} className="btn" style={{ flex:1, background: '#30363d', border:'1px solid #444', color: '#ccc', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize:'12px' }}>
          <Upload size={14} /> 세이브 복구
        </button>
        <input type="file" ref={fileInputRef} onChange={async (e) => {
          const file = e.target.files?.[0];
          if(file && await importSaveFile(file, heroes)) { alert('로드 성공!'); window.location.reload(); }
        }} style={{ display: 'none' }} accept=".json" />
      </div>

      <div style={{ borderTop: '1px solid #333', margin: '10px 0' }}></div>

      {/* 5. 초기화 */}
      <h4 style={{ margin:'0 0 10px 0', color:'#da3633' }}>위험 구역</h4>
      <div style={{ display:'flex', gap:'10px' }}>
        <button onClick={handleSafeReset} className="btn" style={{ flex:1, background: '#da3633', color: '#fff', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' }}>
          <Trash2 size={16} /> 게임 재시작
        </button>
        <button onClick={handleStatReset} className="btn" style={{ flex:1, background: '#d29922', color: '#000', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', fontWeight:'bold' }}>
          <RefreshCw size={16} /> 통계 초기화
        </button>
      </div>
    </div>
  );
};
