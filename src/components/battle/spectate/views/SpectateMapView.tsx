// ==========================================
// FILE PATH: /src/components/battle/spectate/views/SpectateMapView.tsx
// ==========================================
import React, { useEffect, useRef } from 'react';
import { SpectateMap } from '../../SpectateMap';
import { TowerRender, NexusRender, MonsterRender } from '../map/MapObjects';
import { UnitRender } from '../map/UnitRender';
import { MinionRender } from '../map/objects/MinionRender';
import { JungleRender } from '../map/objects/JungleRender';
import { ProjectileRender } from '../map/objects/ProjectileRender';
import { LiveMatch } from '../../../../../types';
import { ObjectStatBox, NeutralObjPanel } from '../SpectateUI'; // UI 컴포넌트 재사용

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
  
  const visualRef = useRef<Record<string, {x: number, y: number}>>({});
  const requestRef = useRef<number>();

  useEffect(() => {
    const animate = () => {
      const allPlayers = [...match.blueTeam, ...match.redTeam];
      allPlayers.forEach(p => {
        updateElementPos(`unit-${p.heroId}`, p.x, p.y, 'HERO'); 
      });

      if (match.minions) {
        match.minions.forEach(m => {
          updateElementPos(`minion-${m.id}`, m.x, m.y, 'MINION');
        });
      }
      requestRef.current = requestAnimationFrame(animate);
    };

    const updateElementPos = (elementId: string, targetX: number, targetY: number, type: 'HERO' | 'MINION') => {
      const el = document.getElementById(elementId);
      if (!el) return;

      let current = visualRef.current[elementId];
      if (!current) {
        current = { x: targetX, y: targetY };
        visualRef.current[elementId] = current;
      }

      const dx = targetX - current.x;
      const dy = targetY - current.y;
      const dist = Math.sqrt(dx*dx + dy*dy);

      if (dist > 20) {
        current.x = targetX;
        current.y = targetY;
      } else if (dist > 0.01) {
        let speed = type === 'HERO' ? Math.max(0.05, dist * 0.1) : Math.max(0.025, dist * 0.05);
        if (dist <= speed) {
            current.x = targetX;
            current.y = targetY;
        } else {
            current.x += (dx / dist) * speed;
            current.y += (dy / dist) * speed;
        }
      }

      el.style.left = `${current.x}%`;
      el.style.top = `${current.y}%`;
      el.style.zIndex = `${Math.floor(current.y)}`;
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => { if(requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [match]); 

  if (isMobile && mobileTab !== 'MAP') return null;

  return (
    <div style={{ 
        width: '100%',
        height: '100%',
        display: 'flex', 
        flexDirection: 'column', // 세로 배치로 변경
        background: '#050505',
        overflowY: 'auto', // 전체 스크롤 허용
        overflowX: 'hidden'
    }}>
      
      {/* 1. 맵 영역 */}
      <div style={{
          width: '100%',
          maxWidth: '100vh', 
          aspectRatio: '1/1', 
          margin: '0 auto',
          position: 'relative',
          flexShrink: 0 // 스크롤 시 맵 크기 유지
      }}>
        <div style={{
            width: '100%',
            paddingBottom: '100%',
            position: 'relative',
            background: '#161b22',
            borderBottom: '1px solid #333',
            overflow: 'hidden' 
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
                {[...match.blueTeam, ...match.redTeam].map(p => (
                <UnitRender 
                    key={p.heroId} 
                    player={p} 
                    isBlue={match.blueTeam.includes(p)} 
                    isSelected={selectedHeroId === p.heroId} 
                    onClick={() => onSelectHero(p.heroId)} 
                />
                ))}
                <ProjectileRender projectiles={match.projectiles} />
            </div>
        </div>
      </div>

      {/* 2. 하단 정보 패널 (스크롤로 보임) */}
      <div style={{ padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px', background: '#121212' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
            <ObjectStatBox stats={match.stats.blue} color="#58a6ff" side="BLUE" godName="단테" />
            <ObjectStatBox stats={match.stats.red} color="#e84057" side="RED" godName="이즈마한" />
        </div>
        <NeutralObjPanel colossus={match.objectives?.colossus} watcher={match.objectives?.watcher} />
        
        {/* 안내 문구 */}
        <div style={{ textAlign:'center', color:'#555', fontSize:'11px', marginTop:'10px' }}>
            영웅 아이콘을 클릭하면 상세 정보를 볼 수 있습니다.
        </div>
      </div>

    </div>
  );
};
