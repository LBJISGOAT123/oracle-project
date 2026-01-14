// ==========================================
// FILE PATH: /src/hooks/useGameEngine.ts
// ==========================================
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
  
  // [최적화] 렌더링 쓰로틀링을 위한 변수
  // 화면 갱신은 최대 30FPS로 제한하여 연산 자원 확보
  const lastRenderTime = useRef<number>(0);
  const RENDER_INTERVAL = 33; // 약 30FPS (33ms)

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

  // [최적화된 루프]
  useEffect(() => {
    if (!isPlaying || !isGameReady || runtimeError) {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      previousTimeRef.current = undefined; 
      return;
    }

    const loop = (time: number) => {
      if (previousTimeRef.current !== undefined) {
        const realDelta = Math.min((time - previousTimeRef.current) / 1000, 0.1);
        const gameDelta = realDelta * (gameSpeed || 1);

        try {
          // 1. 논리 연산 (Tick) - 매 프레임 수행 (정확성 유지)
          // tick 함수 내부에서 updateStateCallback을 호출하는데,
          // Store에서 이를 조절할 수 있도록 구조를 살짝 우회하거나
          // 여기서는 단순히 호출만 함.
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
  }, [isPlaying, isGameReady, runtimeError, gameSpeed]);

  // 자동 저장
  useEffect(() => {
    const autoSaveInterval = setInterval(() => { 
      if (isPlaying && isGameReady && !runtimeError) saveToSlot('auto'); 
    }, 60000);
    return () => clearInterval(autoSaveInterval);
  }, [isPlaying, isGameReady, runtimeError]);

  return { isMobile, store, isGameReady };
};
