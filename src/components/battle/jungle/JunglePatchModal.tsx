// ==========================================
// FILE PATH: /src/components/battle/jungle/JunglePatchModal.tsx
// ==========================================
import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../../store/useGameStore';
import { JungleCampType, JungleCampConfig, JungleMonsterStats } from '../../../types/jungle';
import { DEFAULT_JUNGLE_CONFIG } from '../../../data/jungle/jungleDefaults';
import { X, Save, RotateCcw } from 'lucide-react';
import { MonsterEditor } from './MonsterEditor';
import { JungleMapArea } from './JungleMapArea'; // 분리된 모듈

interface Props { campType: JungleCampType; onClose: () => void; }

export const JunglePatchModal: React.FC<Props> = ({ campType, onClose }) => {
  const { gameState, updateFieldSettings } = useGameStore();
  
  const currentJungle = gameState.fieldSettings.jungle as any;
  const currentCamp = currentJungle?.camps?.[campType] || DEFAULT_JUNGLE_CONFIG.camps[campType];

  const [campConfig, setCampConfig] = useState<JungleCampConfig>(JSON.parse(JSON.stringify(currentCamp)));
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(campConfig.monsters[0]?.spotId || null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const selectedMonster = campConfig.monsters.find(m => m.spotId === selectedSpotId);

  const handleMonsterChange = (field: keyof JungleMonsterStats, value: any) => {
    if (!selectedSpotId) return;
    setCampConfig(prev => ({
      ...prev,
      monsters: prev.monsters.map(m => m.spotId === selectedSpotId ? { ...m, stats: { ...m.stats, [field]: value } } : m)
    }));
  };

  const handlePosUpdate = (spotId: string, x: number, y: number) => {
    setCampConfig(prev => ({
        ...prev,
        monsters: prev.monsters.map(m => m.spotId === spotId ? { ...m, x, y } : m)
    }));
    // 위치 이동 시 해당 몹 자동 선택
    setSelectedSpotId(spotId);
  };

  const handleSave = () => {
    const newJungleSettings = {
        ...currentJungle,
        camps: { ...(currentJungle.camps || DEFAULT_JUNGLE_CONFIG.camps), [campType]: campConfig }
    };
    updateFieldSettings({ jungle: newJungleSettings });
    // [수정] 이 부분의 역슬래시가 에러 원인이었습니다.
    alert(`${campConfig.name} 설정이 저장되었습니다.`);
    onClose();
  };

  const handleReset = () => {
    if(confirm('기본 설정으로 초기화하시겠습니까? (위치 포함)')) {
        const resetData = JSON.parse(JSON.stringify(DEFAULT_JUNGLE_CONFIG.camps[campType]));
        setCampConfig(resetData);
        setSelectedSpotId(resetData.monsters[0]?.spotId);
    }
  };

  return (
    <div 
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter:'blur(5px)', padding: isMobile ? '0' : '20px' }}
        onContextMenu={(e) => e.preventDefault()}
    >
      <div style={{ 
          width: '100%', maxWidth: '900px', height: isMobile ? '100vh' : '700px', 
          background: '#161b22', border: isMobile ? 'none' : '1px solid #30363d', 
          borderRadius: isMobile ? '0' : '16px', overflow: 'hidden', display:'flex', flexDirection:'column', boxShadow: '0 20px 60px rgba(0,0,0,0.8)' 
      }}>
        
        {/* 헤더 */}
        <div style={{ padding: '15px 20px', background: '#21262d', borderBottom: '1px solid #30363d', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <h3 style={{ margin: 0, color: '#2ecc71', fontSize: '16px', display:'flex', alignItems:'center', gap:'8px' }}>
            🌲 {isMobile ? campConfig.name.split('(')[0] : campConfig.name}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding:'5px' }}><X size={24}/></button>
        </div>

        {/* 바디 (맵 + 에디터) */}
        <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', display: 'flex', flexDirection: isMobile ? 'column' : 'row' }}>
            
            {/* 1. 맵 영역 (모듈화됨) */}
            <div style={{ 
                flex: isMobile ? 'none' : 1, 
                height: isMobile ? '45vh' : 'auto',
                borderRight: isMobile ? 'none' : '1px solid #30363d', borderBottom: isMobile ? '1px solid #30363d' : 'none',
                background:'#0d1117', position: 'relative'
            }}>
              <JungleMapArea 
                config={campConfig}
                selectedSpotId={selectedSpotId}
                onSelectSpot={setSelectedSpotId}
                onUpdatePos={handlePosUpdate}
                isMobile={isMobile}
              />
            </div>

            {/* 2. 에디터 영역 */}
            <div style={{ flex: isMobile ? 'none' : 1, background: '#161b22', minHeight: isMobile ? 'auto' : '100%', paddingBottom: isMobile ? '80px' : '0' }}>
              {selectedMonster ? (
                <MonsterEditor key={selectedSpotId} stats={selectedMonster.stats} onChange={handleMonsterChange} />
              ) : (
                <div style={{ padding:'40px', color:'#555', textAlign:'center' }}>선택된 몬스터가 없습니다.</div>
              )}
            </div>

        </div>

        {/* 푸터 */}
        <div style={{ padding: '15px', borderTop: '1px solid #30363d', display: 'flex', gap:'10px', flexShrink: 0, background:'#161b22' }}>
          <button onClick={handleReset} style={{ flex:1, background: '#3f1515', color: '#ff6b6b', border: '1px solid #5a1e1e', padding: '12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display:'flex', justifyContent:'center', alignItems:'center', gap:'6px', fontSize:'14px' }}>
            <RotateCcw size={16}/> 초기화
          </button>
          <button onClick={handleSave} style={{ flex:2, background: '#238636', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display:'flex', justifyContent:'center', alignItems:'center', gap:'6px', fontSize:'14px' }}>
            <Save size={16}/> 저장
          </button>
        </div>

      </div>
    </div>
  );
};
