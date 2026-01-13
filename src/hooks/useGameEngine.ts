import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { saveToSlot, initializeGame } from '../engine/SaveLoadSystem';

export const useGameEngine = () => {
  const store = useGameStore();
  const { gameState, tick, heroes } = store;
  const { isPlaying, gameSpeed } = gameState;

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isGameReady, setIsGameReady] = useState(false);
  
  // [NEW] 게임 루프 내부 에러를 UI로 전파하기 위한 상태
  const [runtimeError, setRuntimeError] = useState<Error | null>(null);

  const requestRef = useRef<number>(0);
  const previousTimeRef = useRef<number | undefined>(undefined);
  const gameSpeedRef = useRef(gameSpeed || 1);
  const pendingTimeRef = useRef(0);

  // 에러가 있으면 상위 컴포넌트로 던져서 ErrorBoundary가 잡게 함
  if (runtimeError) {
    throw runtimeError;
  }

  useEffect(() => {
    gameSpeedRef.current = gameSpeed || 1;
  }, [gameSpeed]);

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

  // [메인 게임 루프]
  useEffect(() => {
    // 에러 발생 시 루프 즉시 중단
    if (!isPlaying || !isGameReady || runtimeError) {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      previousTimeRef.current = undefined; 
      pendingTimeRef.current = 0;
      return;
    }

    const loop = (time: number) => {
      if (previousTimeRef.current !== undefined) {
        const realDelta = Math.min((time - previousTimeRef.current) / 1000, 0.1);
        pendingTimeRef.current += realDelta * (gameSpeedRef.current || 1);

        let stepSize = 1.0;
        if (gameSpeedRef.current >= 3000) stepSize = 20.0;
        else if (gameSpeedRef.current >= 600) stepSize = 10.0;
        else if (gameSpeedRef.current >= 60) stepSize = 3.0;
        else if (gameSpeedRef.current >= 3) stepSize = 1.0;
        else stepSize = 0.5;

        if (pendingTimeRef.current > stepSize * 5) {
            pendingTimeRef.current = stepSize * 5;
        }

        const frameStart = performance.now();

        while (pendingTimeRef.current >= stepSize) {
          try {
            // [핵심] 틱 실행 중 에러가 나면 catch 블록으로 이동
            tick(stepSize);
            pendingTimeRef.current -= stepSize;
          } catch (e: any) {
            console.error("CRITICAL TICK ERROR:", e);
            
            // 1. 게임 정지
            store.togglePlay(); 
            
            // 2. 루프 데이터 초기화
            pendingTimeRef.current = 0;
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            
            // 3. 에러 상태 설정 -> 다음 렌더링 때 ErrorBoundary 트리거
            setRuntimeError(e instanceof Error ? e : new Error("Game Loop Error: " + String(e)));
            return; // 루프 종료
          }
          if (performance.now() - frameStart > 12) break;
        }
      }
      previousTimeRef.current = time;
      requestRef.current = requestAnimationFrame(loop);
    };

    requestRef.current = requestAnimationFrame(loop);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [isPlaying, isGameReady, runtimeError]); // runtimeError 의존성 추가

  // 자동 저장
  useEffect(() => {
    const autoSaveInterval = setInterval(() => { 
      if (isPlaying && isGameReady && !runtimeError) saveToSlot('auto'); 
    }, 60000);
    return () => clearInterval(autoSaveInterval);
  }, [isPlaying, isGameReady, runtimeError]);

  return { isMobile, store, isGameReady };
};
