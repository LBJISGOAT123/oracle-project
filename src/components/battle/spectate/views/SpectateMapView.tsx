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
      // 1. 영웅 이동 (빠른 반응속도)
      const allPlayers = [...match.blueTeam, ...match.redTeam];
      allPlayers.forEach(p => {
        updateElementPos(`unit-${p.heroId}`, p.x, p.y, 'HERO'); 
      });

      // 2. 미니언 이동 (느긋하고 부드럽게)
      if (match.minions) {
        match.minions.forEach(m => {
          updateElementPos(`minion-${m.id}`, m.x, m.y, 'MINION');
        });
      }

      requestRef.current = requestAnimationFrame(animate);
    };

    /**
     * [이동 로직 튜닝]
     * 유닛 타입에 따라 속도 계수를 다르게 적용하여 끊김 현상 제거
     */
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

      // 1. 순간이동 처리 (화면 밖으로 나갈 정도면 즉시 이동)
      if (dist > 20) {
        current.x = targetX;
        current.y = targetY;
      } 
      // 2. 이동 처리
      else if (dist > 0.01) {
        let speed = 0;

        if (type === 'HERO') {
            // [영웅] 반응성이 중요하므로 기본 속도를 어느 정도 확보
            // 거리의 10%만큼 이동하되, 최소 0.05 속도 보장
            speed = Math.max(0.05, dist * 0.1);
        } else {
            // [미니언] 끊김 방지가 최우선
            // 거리가 짧으므로 속도를 대폭 낮춰서(0.025) 천천히 도달하게 함
            // 이렇게 해야 1초 동안 멈추지 않고 꾸준히 걸어감
            speed = Math.max(0.025, dist * 0.05); 
        }

        // 목적지 도착 판정 (속도보다 거리가 짧으면 도착)
        if (dist <= speed) {
            current.x = targetX;
            current.y = targetY;
        } else {
            // 정규화 벡터 * 속도
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

  return (
    <div style={{ 
        height: '100%', position: 'relative', overflow: 'hidden', background: '#000',
        display: (isMobile && mobileTab !== 'MAP') ? 'none' : 'block'
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
  );
};
