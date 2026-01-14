// ==========================================
// FILE PATH: /src/components/battle/jungle/JunglePatchModal.tsx
// ==========================================
import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../../store/useGameStore';
import { JungleCampType, JungleCampConfig, JungleMonsterStats } from '../../../types/jungle';
import { DEFAULT_JUNGLE_CONFIG } from '../../../data/jungle/jungleDefaults';
import { X, Save, RotateCcw } from 'lucide-react';
import { MonsterEditor } from './MonsterEditor';
import { JungleMapArea } from './JungleMapArea'; 

interface Props { campType: JungleCampType; onClose: () => void; }

export const JunglePatchModal: React.FC<Props> = ({ campType, onClose }) => {
  const { gameState, updateFieldSettings } = useGameStore();
  
  const currentJungle = gameState.fieldSettings.jungle as any;
  // 기존 설정이 있으면 가져오고, 없으면 기본값 사용 (깊은 복사로 참조 끊기)
  const currentCamp = currentJungle?.camps?.[campType] || JSON.parse(JSON.stringify(DEFAULT_JUNGLE_CONFIG.camps[campType]));

  // [수정] 초기 상태 로드 시 좌표 보정 로직 제거 (있는 그대로 로드)
  const [campConfig, setCampConfig] = useState<JungleCampConfig>(currentCamp);
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
    // [수정] 좌표 소수점 1자리까지만 저장 (너무 긴 소수점 방지)
    const fixedX = Number(x.toFixed(1));
    const fixedY = Number(y.toFixed(1));

    setCampConfig(prev => ({
        ...prev,
        monsters: prev.monsters.map(m => m.spotId === spotId ? { ...m, x: fixedX, y: fixedY } : m)
    }));
    setSelectedSpotId(spotId);
  };

  const handleSave = () => {
    const newJungleSettings = {
        ...currentJungle,
        camps: { ...(currentJungle.camps || DEFAULT_JUNGLE_CONFIG.camps), [campType]: campConfig }
    };
    updateFieldSettings({ jungle: newJungleSettings });
    alert(`${campConfig.name} 설정이 저장되었습니다.\n(다음 게임부터 적용됩니다)`);
    onClose();
  };

  const handleReset = () => {
    if(confirm('기본 설정으로 초기화하시겠습니까? (위치 포함)')) {
        // 기본값 깊은 복사
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
        
        <div style={{ padding: '15px 20px', background: '#21262d', borderBottom: '1px solid #30363d', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <h3 style={{ margin: 0, color: '#2ecc71', fontSize: '16px', display:'flex', alignItems:'center', gap:'8px' }}>
            🌲 {isMobile ? campConfig.name.split('(')[0] : campConfig.name}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding:'5px' }}><X size={24}/></button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', display: 'flex', flexDirection: isMobile ? 'column' : 'row' }}>
            
            {/* 1. 맵 영역 */}
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
