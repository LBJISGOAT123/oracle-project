// ==========================================
// FILE PATH: /src/hooks/useGameEngine.ts
// ==========================================

import { useEffect, useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { saveToSlot, initializeGame } from '../engine/SaveLoadSystem';

export const useGameEngine = () => {
  const store = useGameStore();
  const { gameState, tick, heroes } = store;
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    initializeGame(heroes);
  }, []); 

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // [핵심 수정] 배속에 따른 가변 인터벌(Interval) 로직
  useEffect(() => {
    let interval: any;

    if (gameState.isPlaying) {
      const speed = gameState.gameSpeed;
      let delayMs = 1000; // 기본: 1초에 한 번
      let delta = 1;      // 기본: 1초 진행

      // 배속일 때는 화면을 더 자주(0.1초마다) 갱신하여 부드럽게 보이게 함
      if (speed === 60) {
        delayMs = 100; // 0.1초마다 실행 (10 FPS)
        delta = 6;     // 0.1초당 6초 진행 => 1초에 60초(1분)
      } else if (speed === 600) {
        delayMs = 100; // 0.1초마다 실행 (10 FPS)
        delta = 60;    // 0.1초당 60초 진행 => 1초에 600초(10분)
      }

      interval = setInterval(() => { 
        tick(delta); 
      }, delayMs);
    }
    return () => clearInterval(interval);
  }, [gameState.isPlaying, gameState.gameSpeed, tick]);

  // 자동 저장 (1분마다)
  useEffect(() => {
    const autoSaveInterval = setInterval(() => { 
      if (gameState.isPlaying) saveToSlot('auto'); 
    }, 60000);
    return () => clearInterval(autoSaveInterval);
  }, [gameState.isPlaying]);

  return { isMobile, store };
};