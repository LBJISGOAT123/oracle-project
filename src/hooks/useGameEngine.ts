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

  useEffect(() => {
    if (!isPlaying || !isGameReady || runtimeError) {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      previousTimeRef.current = undefined; 
      return;
    }

    const loop = (time: number) => {
      if (previousTimeRef.current !== undefined) {
        // 델타 타임 계산 (최대 0.1초 제한)
        const realDelta = Math.min((time - previousTimeRef.current) / 1000, 0.1);
        const gameDelta = realDelta * (gameSpeed || 1);

        try {
          // [원복] 매 프레임마다 즉시 tick 호출
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

  useEffect(() => {
    const autoSaveInterval = setInterval(() => { 
      if (isPlaying && isGameReady && !runtimeError) saveToSlot('auto'); 
    }, 60000);
    return () => clearInterval(autoSaveInterval);
  }, [isPlaying, isGameReady, runtimeError]);

  return { isMobile, store, isGameReady };
};
