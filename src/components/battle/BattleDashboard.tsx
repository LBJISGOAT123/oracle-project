// ==========================================
// FILE PATH: /src/components/battle/BattleDashboard.tsx
// ==========================================

import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { Sword, Shield, Settings } from 'lucide-react';

// [중요] 새로 생성한 모듈 파일들 import
import { SiegeSettingsPanel } from './dashboard/SiegeSettingsPanel';
import { MinionCard } from './dashboard/MinionCard'; // (GodPanel 내부에서 사용됨, 여기서 직접 쓰진 않음)
import { GodPanel } from './dashboard/GodPanel';
import { GlobalBattleStats } from './dashboard/GlobalBattleStats';

export const BattleDashboard: React.FC = () => {
  const { gameState, updateBattleSettings } = useGameStore();
  const { battleSettings, godStats } = gameState;

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!battleSettings) return <div className="panel">시스템 로딩 중...</div>;

  const handleGodChange = (god: 'izman' | 'dante', field: string, value: any) => {
    updateBattleSettings({ [god]: { ...battleSettings[god], [field]: value } });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '25px', paddingBottom: '80px' }}>
      
      {/* 헤더 영역 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: isMobile ? '0 5px' : '0' }}>
        <div style={{ background: '#58a6ff22', padding: '10px', borderRadius: '12px', border: '1px solid #58a6ff44' }}>
          <Settings size={24} color="#58a6ff" />
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: isMobile ? '18px' : '22px', fontWeight: '800', letterSpacing: '-0.5px', color:'#fff' }}>전장 오버라이드</h2>
          <p style={{ margin: 0, fontSize: isMobile ? '11px' : '13px', color: '#8b949e' }}>
            진영별 밸런스 및 하수인 스펙을 실시간으로 제어합니다.
          </p>
        </div>
      </div>

      {/* 전체 통계 */}
      <GlobalBattleStats stats={godStats} isMobile={isMobile} />

      {/* [확인] 공성 설정 패널 - 통계 바로 아래에 배치 */}
      <SiegeSettingsPanel />

      {/* 양 진영 패널 */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '25px' }}>
        <GodPanel 
          side="RED" settings={battleSettings.izman} stats={godStats}
          color="#ff4d4d" glowColor="rgba(255, 77, 77, 0.1)"
          onChange={(field: string, val: any) => handleGodChange('izman', field, val)}
          icon={<Sword size={20} />} isMobile={isMobile}
        />
        <GodPanel 
          side="BLUE" settings={battleSettings.dante} stats={godStats}
          color="#4d94ff" glowColor="rgba(77, 148, 255, 0.1)"
          onChange={(field: string, val: any) => handleGodChange('dante', field, val)}
          icon={<Shield size={20} />} isMobile={isMobile}
        />
      </div>
    </div>
  );
};
