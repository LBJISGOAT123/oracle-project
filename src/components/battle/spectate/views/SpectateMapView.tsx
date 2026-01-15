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
  if (isMobile && mobileTab !== 'MAP') return null;

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#050505', overflowY: 'auto', overflowX: 'hidden' }}>
      
      <div style={{ width: '100%', display: 'flex', justifyContent: 'center', background: '#161b22', borderBottom: '1px solid #333', flexShrink: 0, position: 'relative' }}>
        
        {/* [신규] 알림 컴포넌트 추가 */}
        <InGameAnnouncement />

        <div style={{ width: '100%', maxWidth: '100vh', aspectRatio: '1 / 1', position: 'relative', overflow: 'hidden' }}>
            <SpectateCanvasView match={match} heroes={heroes} onSelectHero={onSelectHero} selectedHeroId={selectedHeroId} />
        </div>
      </div>

      <div style={{ padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px', background: '#121212' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
            <ObjectStatBox stats={match.stats.blue} color="#58a6ff" side="BLUE" godName="단테" />
            <ObjectStatBox stats={match.stats.red} color="#e84057" side="RED" godName="이즈마한" />
        </div>
        <NeutralObjPanel colossus={match.objectives?.colossus} watcher={match.objectives?.watcher} />
        <div style={{ textAlign:'center', color:'#555', fontSize:'11px', marginTop:'10px' }}>
            영웅을 클릭하여 상세 정보를 확인할 수 있습니다.
        </div>
      </div>

    </div>
  );
};
