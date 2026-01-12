import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { saveToSlot, initializeGame } from '../engine/SaveLoadSystem';

export const useGameEngine = () => {
  const store = useGameStore();
  const { gameState, tick, heroes } = store;
  
  const { isPlaying, gameSpeed } = gameState;

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const requestRef = useRef<number>(0);
  const previousTimeRef = useRef<number | undefined>(undefined);
  
  const gameSpeedRef = useRef(gameSpeed || 1);
  const pendingTimeRef = useRef(0);

  // gameSpeed가 변경될 때 ref도 즉시 업데이트
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

  // [메인 게임 루프 - 최적화 적용됨]
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
        pendingTimeRef.current += realDelta * (gameSpeedRef.current || 1);

        // 3. [최적화] 배속에 따른 stepSize 동적 할당
        // 배속이 높을수록 한 번에 크게 계산하여 연산 횟수(렉)를 줄임
        let stepSize = 1.0;
        
        if (gameSpeedRef.current >= 3000) {
            stepSize = 20.0; // 1시간 배속 등: 20초 단위 점프 (연산량 95% 감소)
        } else if (gameSpeedRef.current >= 600) {
            stepSize = 10.0; // 10분 배속: 10초 단위
        } else if (gameSpeedRef.current >= 60) {
            stepSize = 3.0;  // 1분 배속: 3초 단위
        } else if (gameSpeedRef.current >= 3) {
            stepSize = 1.0;  // 3배속
        } else {
            stepSize = 0.5;  // 1배속 (0.5초 단위로 부드럽게)
        }

        // 4. [안전장치] "시간 부채" 탕감 (Lag Cap)
        // CPU가 밀려서 처리해야 할 시간이 너무 많이(5스텝 이상) 쌓이면, 
        // 억지로 다 계산하려다 멈추지 말고 최대치로 제한하여 렉을 방지함.
        if (pendingTimeRef.current > stepSize * 5) {
            pendingTimeRef.current = stepSize * 5;
        }

        // 5. 프레임 버젯 (12ms) - 한 프레임에 너무 많은 연산 방지
        const frameStart = performance.now();

        while (pendingTimeRef.current >= stepSize) {
          try {
            tick(stepSize); // 틱 실행
            pendingTimeRef.current -= stepSize;
          } catch (e) {
            console.error("Tick Error:", e);
            pendingTimeRef.current = 0; // 에러 시 남은 시간 버림
          }

          // 시간이 너무 오래 걸리면 루프 중단 (UI 반응성 확보)
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
  }, [isPlaying]); // gameSpeed는 ref로 관리하므로 의존성 배열에서 제외 가능

  // 자동 저장 (1분 간격)
  useEffect(() => {
    const autoSaveInterval = setInterval(() => { 
      if (isPlaying) saveToSlot('auto'); 
    }, 60000);
    return () => clearInterval(autoSaveInterval);
  }, [isPlaying]);

  return { isMobile, store };
};
