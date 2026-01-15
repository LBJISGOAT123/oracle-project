// ==========================================
// FILE PATH: /src/hooks/useVisualInterpolation.ts
// ==========================================
import { useEffect, useRef } from 'react';
import { LiveMatch, LivePlayer, Minion } from '../types';

// 설정 상수
const CONFIG = {
  TELEPORT_THRESHOLD: 15, // 이 거리 이상 벌어지면 순간이동 (맵 크기 100 기준 15%)
  LERP_FACTOR_HERO: 0.15, // 영웅 보간 계수 (낮을수록 부드럽지만 반응 느림)
  LERP_FACTOR_MINION: 0.2, // 미니언 보간 계수
  SNAP_DISTANCE: 0.05, // 이 거리 이내면 목표 위치로 즉시 고정 (떨림 방지)
  Z_INDEX_BASE: 10
};

interface VisualState {
  x: number;
  y: number;
}

export const useVisualInterpolation = (match: LiveMatch | undefined) => {
  const requestRef = useRef<number>();
  const visualRef = useRef<Record<string, VisualState>>({});

  useEffect(() => {
    if (!match) return;

    const animate = () => {
      // 1. 영웅 처리
      const allPlayers = [...match.blueTeam, ...match.redTeam];
      allPlayers.forEach(p => {
        updateEntityPosition(`unit-${p.heroId}`, p.x, p.y, 'HERO');
      });

      // 2. 미니언 처리
      if (match.minions) {
        match.minions.forEach(m => {
          updateEntityPosition(`minion-${m.id}`, m.x, m.y, 'MINION');
        });
      }

      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [match]);

  // 개별 엔티티 위치 업데이트 로직
  const updateEntityPosition = (elementId: string, targetX: number, targetY: number, type: 'HERO' | 'MINION') => {
    const el = document.getElementById(elementId);
    if (!el) return;

    let current = visualRef.current[elementId];
    
    // 초기화: 데이터가 없으면 타겟 위치로 즉시 설정
    if (!current) {
      current = { x: targetX, y: targetY };
      visualRef.current[elementId] = current;
    }

    const dx = targetX - current.x;
    const dy = targetY - current.y;
    // 거리 제곱 대신 유클리드 거리 사용 (정확도)
    const dist = Math.sqrt(dx * dx + dy * dy);

    // [핵심 로직 1] 텔레포트 감지 (거리 15 이상이면 즉시 이동)
    if (dist > CONFIG.TELEPORT_THRESHOLD) {
      current.x = targetX;
      current.y = targetY;
    } 
    // [핵심 로직 2] 미세 거리 스냅 (도착 시 떨림 방지)
    else if (dist < CONFIG.SNAP_DISTANCE) {
      current.x = targetX;
      current.y = targetY;
    } 
    // [핵심 로직 3] 부드러운 보간 (Lerp)
    else {
      const factor = type === 'HERO' ? CONFIG.LERP_FACTOR_HERO : CONFIG.LERP_FACTOR_MINION;
      current.x += dx * factor;
      current.y += dy * factor;
    }

    // DOM 직접 업데이트 (리액트 리렌더링 방지)
    el.style.left = `${current.x}%`;
    el.style.top = `${current.y}%`;
    
    // Y축에 따른 Z-Index 정렬 (아래에 있는 유닛이 위에 그려짐 - 원근감)
    el.style.zIndex = `${Math.floor(current.y) + CONFIG.Z_INDEX_BASE}`;
  };
};
