// ==========================================
// FILE PATH: src/utils/ImageLoader.ts
// ==========================================
import { INITIAL_CUSTOM_IMAGES } from '../data/initialImages';

/**
 * [최적화된 하이브리드 로딩]
 * 1. 2.5초간은 정상적으로 로딩 바를 보여줍니다.
 * 2. 2.5초가 지나면 즉시 게임을 시작합니다.
 * 3. [핵심] 게임 시작 후에는 백그라운드에서 이미지를 계속 받지만, 
 *    'onProgress'를 호출하지 않아 렉과 튕김 현상을 방지합니다.
 */
export const preloadGameImages = async (
  onProgress: (percent: number) => void
): Promise<void> => {
  const imageUrls = Array.from(new Set(Object.values(INITIAL_CUSTOM_IMAGES))).filter(url => !!url);
  const total = imageUrls.length;
  let loadedCount = 0;
  
  // [핵심] UI 업데이트 허용 여부 플래그
  let allowUIUpdates = true;

  if (total === 0) {
    onProgress(100);
    return Promise.resolve();
  }

  const updateProgress = () => {
    loadedCount++;
    
    // 게임 화면으로 넘어갔다면, 더 이상 리액트 상태를 건드리지 않음 (렉/튕김 방지)
    if (!allowUIUpdates) return;

    const percent = Math.floor((loadedCount / total) * 100);
    onProgress(percent);
  };

  const loadPromises = imageUrls.map((src) => {
    const downloadJob = new Promise<void>((resolve) => {
      const img = new Image();

      const finish = () => {
        updateProgress();
        resolve(); // 작업 완료 처리
      };

      img.onload = finish;
      img.onerror = () => {
        // 실패해도 조용히 넘어감
        finish();
      };

      img.src = src;

      if (img.complete && img.naturalWidth > 0) {
        finish();
      }
    });

    return downloadJob;
  });

  // [시간 제한 로직]
  const timeoutPromise = new Promise<void>((resolve) => {
    setTimeout(() => {
      // 2.5초가 지나면 UI 업데이트 권한을 박탈하고 게임 시작 신호를 보냄
      allowUIUpdates = false; 
      console.log("🚀 로딩 시간 초과: 게임 강제 진입 (백그라운드 다운로드는 유지됨)");
      resolve();
    }, 2500);
  });

  // 모든 이미지가 로드되거나, 2.5초가 지나면 끝남
  // Promise.all(이미지들) 과 Timeout 중 먼저 끝나는 쪽을 따라감
  await Promise.race([Promise.all(loadPromises), timeoutPromise]);
  
  // 확실하게 100% 찍고 종료
  if (allowUIUpdates) {
      onProgress(100);
  }
};
