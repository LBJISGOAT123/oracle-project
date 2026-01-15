// ==========================================
// FILE PATH: /src/components/battle/spectate/views/SpectateMapView.tsx
// ==========================================
import React from 'react';
import { LiveMatch } from '../../../../types';
import { useGameStore } from '../../../../store/useGameStore';
import { ObjectStatBox, NeutralObjPanel } from '../SpectateUI';
import { SpectateCanvasView } from './SpectateCanvasView';
import { InGameAnnouncement } from './InGameAnnouncement';

interface Props {
  match: LiveMatch;
  isMobile: boolean;
  mobileTab: 'LIST' | 'MAP';
  selectedHeroId: string | null;
  onSelectHero: (id: string) => void;
  setMobileTab: (t: 'LIST' | 'MAP') => void;
}

export const SpectateMapView: React.FC<Props> = ({ 
  match, isMobile, mobileTab, selectedHeroId, onSelectHero, setMobileTab 
}) => {
  const { heroes } = useGameStore();
  
  // 모바일에서 맵 탭이 아닐 경우 렌더링 안 함
  if (isMobile && mobileTab !== 'MAP') return null;

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#050505', overflow: 'hidden' }}>
      
      {/* 맵 컨테이너 (중앙 정렬, 꽉 채우기) */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        background: '#161b22', 
        position: 'relative',
        overflow: 'hidden'
      }}>
        
        {/* 인게임 알림 오버레이 */}
        <InGameAnnouncement />

        {/* 맵 캔버스 (정사각형 유지하되 화면에 맞춤) */}
        <div style={{ 
          width: '100%', height: '100%', 
          maxWidth: '100vh', maxHeight: '100vw',
          aspectRatio: '1 / 1', 
          position: 'relative' 
        }}>
            <SpectateCanvasView match={match} heroes={heroes} onSelectHero={onSelectHero} selectedHeroId={selectedHeroId} />
        </div>
      </div>

      {/* [수정] 하단 스탯 패널: 모바일에서만 표시 (데스크탑은 좌측 리스트뷰에 이미 있음) */}
      {isMobile && (
        <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '10px', background: '#121212', borderTop: '1px solid #333' }}>
          <div style={{ display: 'flex', gap: '6px' }}>
              <ObjectStatBox stats={match.stats.blue} color="#58a6ff" side="BLUE" godName="단테" />
              <ObjectStatBox stats={match.stats.red} color="#e84057" side="RED" godName="이즈마한" />
          </div>
          <NeutralObjPanel colossus={match.objectives?.colossus} watcher={match.objectives?.watcher} />
          <div style={{ textAlign:'center', color:'#555', fontSize:'11px' }}>
              영웅을 클릭하여 상세 정보를 확인할 수 있습니다.
          </div>
        </div>
      )}

    </div>
  );
};
