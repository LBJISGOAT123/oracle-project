// ==========================================
// FILE PATH: /src/hooks/useGameEngine.ts
// ==========================================

import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { saveToSlot, initializeGame } from '../engine/SaveLoadSystem';

export const useGameEngine = () => {
  const store = useGameStore();
  const { gameState, tick, heroes } = store;
  
  // 구조 분해 할당
  const { isPlaying, gameSpeed } = gameState;

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const requestRef = useRef<number>(0);
  const previousTimeRef = useRef<number | undefined>(undefined);
  
  const gameSpeedRef = useRef(gameSpeed || 1);

  // [최적화] 남은 연산량을 저장하는 버퍼
  const pendingTimeRef = useRef(0);

  useEffect(() => {
    gameSpeedRef.current = gameSpeed || 1;
  }, [gameSpeed]);

  useEffect(() => {
    initializeGame(heroes);
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // [메인 게임 루프 - 고성능 최적화 버전]
  useEffect(() => {
    if (!isPlaying) {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      previousTimeRef.current = undefined; 
      pendingTimeRef.current = 0;
      return;
    }

    const loop = (time: number) => {
      if (previousTimeRef.current !== undefined) {
        // 1. 실제 경과 시간 (최대 0.1초 제한으로 탭 전환 시 폭주 방지)
        const realDelta = Math.min((time - previousTimeRef.current) / 1000, 0.1);
        
        // 2. 게임 내 흘러야 할 시간 누적
        // (배속이 3600이면 0.01초만에 36초가 쌓임)
        pendingTimeRef.current += realDelta * (gameSpeedRef.current || 1);

        // 3. [최적화] 배속에 따른 정밀도 조절 (Dynamic Step)
        // 1배속: 1초 단위 계산 (정밀)
        // 3600배속: 5초 단위 계산 (성능 우선)
        let stepSize = 1.0;
        if (gameSpeedRef.current >= 1000) stepSize = 5.0; 
        else if (gameSpeedRef.current >= 60) stepSize = 3.0;

        // 4. [최적화] 프레임 버젯 (Frame Budget)
        // 한 프레임에 12ms 이상 쓰지 않도록 제한 (렉 방지)
        const frameStart = performance.now();

        while (pendingTimeRef.current >= stepSize) {
          try {
            tick(stepSize); // 틱 실행
            pendingTimeRef.current -= stepSize;
          } catch (e) {
            console.error("Tick Error:", e);
            pendingTimeRef.current = 0; // 에러 시 남은 시간 버림
          }

          // 시간이 너무 오래 걸리면 루프 중단하고 다음 프레임에 이어서 함
          if (performance.now() - frameStart > 12) {
            break;
          }
        }
      }

      previousTimeRef.current = time;
      requestRef.current = requestAnimationFrame(loop);
    };

    requestRef.current = requestAnimationFrame(loop);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying]); 

  // 자동 저장 (1분 간격)
  useEffect(() => {
    const autoSaveInterval = setInterval(() => { 
      if (isPlaying) saveToSlot('auto'); 
    }, 60000);
    return () => clearInterval(autoSaveInterval);
  }, [isPlaying]);

  return { isMobile, store };
};