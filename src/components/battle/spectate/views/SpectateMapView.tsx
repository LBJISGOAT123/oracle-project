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
      // 1. 영웅 이동 보간
      const allPlayers = [...match.blueTeam, ...match.redTeam];
      allPlayers.forEach(p => {
        updateElementPos(`unit-${p.heroId}`, p.x, p.y, 'HERO'); 
      });

      // 2. 미니언 이동 보간
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
        // 이동 속도 조절
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

  // 모바일에서 탭이 MAP이 아니면 렌더링 안함 (성능 최적화)
  if (isMobile && mobileTab !== 'MAP') return null;

  return (
    <div style={{ 
        width: '100%',
        height: '100%',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#050505',
        overflow: 'hidden',
        position: 'relative' // 부모 기준
    }}>
      {/* 
         [문제 1 해결] 
         aspectRatio: '1 / 1' -> 정사각형 비율 고정
         maxHeight: '100%' -> 높이가 화면을 넘어가지 않음
         maxWidth: '100%' -> 가로가 화면을 넘어가지 않음
         이 조합으로 항상 화면 내 최대 크기의 정사각형이 됨
      */}
      <div style={{ 
          position: 'relative', 
          aspectRatio: '1 / 1',
          height: 'auto',
          width: 'auto',
          maxHeight: '100%',
          maxWidth: '100%',
          background: '#161b22',
          overflow: 'hidden',
          border: '1px solid #333',
          boxShadow: '0 0 50px rgba(0,0,0,0.5)'
      }}>
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
            onClick={() => { onSelectHero(p.heroId); if(isMobile) setMobileTab('LIST'); }} 
          />
        ))}

        <ProjectileRender projectiles={match.projectiles} />
      </div>
    </div>
  );
};
