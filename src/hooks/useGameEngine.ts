import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { saveToSlot, initializeGame } from '../engine/SaveLoadSystem';

export const useGameEngine = () => {
  const store = useGameStore();
  const { gameState, tick, heroes } = store;
  const { isPlaying, gameSpeed } = gameState;

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isGameReady, setIsGameReady] = useState(false);
  const [runtimeError, setRuntimeError] = useState<Error | null>(null);

  const requestRef = useRef<number>(0);
  const previousTimeRef = useRef<number | undefined>(undefined);
  
  // 에러 발생 시 ErrorBoundary로 전파
  if (runtimeError) {
    throw runtimeError;
  }

  useEffect(() => {
    const init = async () => {
      try {
        await initializeGame(heroes);
      } catch (e: any) {
        console.error("Init Error:", e);
        setRuntimeError(e instanceof Error ? e : new Error(String(e)));
      } finally {
        setIsGameReady(true);
      }
    };
    init();
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // [최적화된 메인 게임 루프]
  useEffect(() => {
    if (!isPlaying || !isGameReady || runtimeError) {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      previousTimeRef.current = undefined; 
      return;
    }

    const loop = (time: number) => {
      if (previousTimeRef.current !== undefined) {
        // 1. 실제 경과 시간 계산 (최대 0.1초로 제한하여 탭 비활성 후 복귀 시 급발진 방지)
        const realDelta = Math.min((time - previousTimeRef.current) / 1000, 0.1);
        
        // 2. 게임 속도 적용
        const gameDelta = realDelta * (gameSpeed || 1);

        try {
          // [핵심 변경] 여기서 루프를 돌지 않고, 전체 시간을 한 번에 엔진으로 넘깁니다.
          // 엔진 내부에서 필요한 만큼 쪼개서 연산하고, 렌더링은 1회만 발생시킵니다.
          tick(gameDelta);
        } catch (e: any) {
          console.error("CRITICAL TICK ERROR:", e);
          store.togglePlay(); 
          if (requestRef.current) cancelAnimationFrame(requestRef.current);
          setRuntimeError(e instanceof Error ? e : new Error("Game Loop Error: " + String(e)));
          return;
        }
      }
      previousTimeRef.current = time;
      requestRef.current = requestAnimationFrame(loop);
    };

    requestRef.current = requestAnimationFrame(loop);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [isPlaying, isGameReady, runtimeError, gameSpeed]); // gameSpeed 의존성 추가

  // 자동 저장 (1분 간격)
  useEffect(() => {
    const autoSaveInterval = setInterval(() => { 
      if (isPlaying && isGameReady && !runtimeError) saveToSlot('auto'); 
    }, 60000);
    return () => clearInterval(autoSaveInterval);
  }, [isPlaying, isGameReady, runtimeError]);

  return { isMobile, store, isGameReady };
};
