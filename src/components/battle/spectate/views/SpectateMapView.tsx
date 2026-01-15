import React from 'react';
import { SpectateMap } from '../../SpectateMap';
import { TowerRender, NexusRender, MonsterRender } from '../map/MapObjects';
import { UnitRender } from '../map/UnitRender';
import { MinionRender } from '../map/objects/MinionRender';
import { JungleRender } from '../map/objects/JungleRender';
// [수정] ProjectileRender 제거 (VisualSystem으로 통합됨) or 유지 가능
import { LiveMatch } from '../../../../../types';
import { ObjectStatBox, NeutralObjPanel } from '../SpectateUI';
import { useVisualInterpolation } from '../../../../hooks/useVisualInterpolation';
// [신규] 이펙트 레이어 추가
import { EffectLayer } from '../map/EffectLayer';

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
  
  useVisualInterpolation(match);

  if (isMobile && mobileTab !== 'MAP') return null;

  return (
    <div style={{ 
        width: '100%', height: '100%',
        display: 'flex', flexDirection: 'column', 
        background: '#050505',
        overflowY: 'auto', overflowX: 'hidden'
    }}>
      
      <div style={{
          width: '100%', maxWidth: '100vh', aspectRatio: '1/1', 
          margin: '0 auto', position: 'relative', flexShrink: 0 
      }}>
        <div style={{
            width: '100%', paddingBottom: '100%', position: 'relative',
            background: '#161b22', borderBottom: '1px solid #333', overflow: 'hidden' 
        }}>
            <div style={{ position: 'absolute', inset: 0 }}>
                <SpectateMap />
                <JungleRender mobs={match.jungleMobs} />
                
                {['TOP', 'MID', 'BOT'].map(lane => (
                [1, 2, 3].map(tier => (
                    <React.Fragment key={`${lane}-${tier}`}>
                    <TowerRender side="BLUE" lane={lane} tier={tier} stats={match.stats} />
                    <TowerRender side="RED" lane={lane} tier={tier} stats={match.stats} />
                    </React.Fragment>
                ))
                ))}
                
                <NexusRender side="BLUE" stats={match.stats} />
                <NexusRender side="RED" stats={match.stats} />
                <MonsterRender type="colossus" objectives={match.objectives} />
                <MonsterRender type="watcher" objectives={match.objectives} />
                
                <MinionRender minions={match.minions} />
                
                {/* [신규] 이펙트 레이어는 유닛 아래, 바닥 위에 위치 */}
                <EffectLayer effects={match.visualEffects} />

                {[...match.blueTeam, ...match.redTeam].map(p => (
                <UnitRender 
                    key={p.heroId} 
                    player={p} 
                    isBlue={match.blueTeam.includes(p)} 
                    isSelected={selectedHeroId === p.heroId} 
                    onClick={() => onSelectHero(p.heroId)} 
                    currentTime={match.currentDuration} 
                />
                ))}
            </div>
        </div>
      </div>

      <div style={{ padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px', background: '#121212' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
            <ObjectStatBox stats={match.stats.blue} color="#58a6ff" side="BLUE" godName="단테" />
            <ObjectStatBox stats={match.stats.red} color="#e84057" side="RED" godName="이즈마한" />
        </div>
        <NeutralObjPanel colossus={match.objectives?.colossus} watcher={match.objectives?.watcher} />
        <div style={{ textAlign:'center', color:'#555', fontSize:'11px', marginTop:'10px' }}>
            영웅 아이콘을 클릭하면 상세 정보를 볼 수 있습니다.
        </div>
      </div>

    </div>
  );
};
