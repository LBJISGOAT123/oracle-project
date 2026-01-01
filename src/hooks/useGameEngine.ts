// ==========================================
// FILE PATH: /src/hooks/useGameEngine.ts
// ==========================================

import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { saveToSlot, initializeGame } from '../engine/SaveLoadSystem';

export const useGameEngine = () => {
  const store = useGameStore();
  const { gameState, tick, heroes } = store;
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // 시간 및 루프 관리를 위한 Refs
  const requestRef = useRef<number>(0);
  const previousTimeRef = useRef<number | undefined>(undefined);

  // [핵심] gameSpeed를 Ref로 관리하여 useEffect 재실행 방지
  const gameSpeedRef = useRef(gameState.gameSpeed);

  // gameSpeed가 바뀌면 Ref만 업데이트 (루프는 끊기지 않음)
  useEffect(() => {
    gameSpeedRef.current = gameState.gameSpeed;
  }, [gameState.gameSpeed]);

  useEffect(() => {
    initializeGame(heroes);
  }, []); // 마운트 시 1회만 실행

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // [안정적인 게임 루프]
  useEffect(() => {
    if (!gameState.isPlaying) {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      previousTimeRef.current = undefined; // 정지 시 시간 초기화
      return;
    }

    const loop = (time: number) => {
      if (previousTimeRef.current !== undefined) {
        // 1. 실제 경과 시간 계산 (초 단위)
        const realDelta = (time - previousTimeRef.current) / 1000;

        // 2. [중요] 탭 전환 등으로 인한 급격한 시간 점프 방지 (최대 0.1초로 제한)
        // 렉이 걸려도 한 번에 0.1초 이상은 계산하지 않음 -> 부드러움 유지
        const safeDelta = Math.min(realDelta, 0.1); 

        // 3. 배속 적용 (Ref 값 사용)
        const gameDelta = safeDelta * gameSpeedRef.current;

        // 4. 틱 실행
        // (gameDelta가 0보다 클 때만 실행하여 불필요한 연산 방지)
        if (gameDelta > 0) {
            tick(gameDelta);
        }
      }

      previousTimeRef.current = time;
      requestRef.current = requestAnimationFrame(loop);
    };

    requestRef.current = requestAnimationFrame(loop);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [gameState.isPlaying]); // 의존성에서 gameSpeed 제거! (Ref 사용)

  // 자동 저장 (1분 간격)
  useEffect(() => {
    const autoSaveInterval = setInterval(() => { 
      if (gameState.isPlaying) saveToSlot('auto'); 
    }, 60000);
    return () => clearInterval(autoSaveInterval);
  }, [gameState.isPlaying]);

  return { isMobile, store };
};