// ==========================================
// FILE PATH: /src/utils/ImageLoader.ts
// ==========================================
import { INITIAL_CUSTOM_IMAGES } from '../data/initialImages';
import { globalImageCache } from './ImageCache';

const CACHE_NAME = 'gods-war-assets-v1';

export const preloadGameImages = async (
  onProgress: (percent: number) => void
): Promise<void> => {
  const imageUrls = Array.from(new Set(Object.values(INITIAL_CUSTOM_IMAGES))).filter(url => !!url);
  const total = imageUrls.length;
  if (total === 0) {
    onProgress(100);
    return;
  }

  let loadedCount = 0;
  
  // 브라우저 캐시 저장소 열기
  let cache: Cache | null = null;
  try {
    cache = await caches.open(CACHE_NAME);
  } catch (e) {
    console.warn("Cache API not supported");
  }

  // [핵심] 병렬 처리 함수
  const loadSingleImage = async (url: string) => {
    // 이미 메모리에 있으면 패스
    if (globalImageCache[url]) {
        return;
    }

    return new Promise<void>(async (resolve) => {
      const img = new Image();
      
      // 1. 캐시 저장소(다운로드된 것) 확인
      if (cache) {
        try {
            const cachedRes = await cache.match(url);
            if (cachedRes) {
                const blob = await cachedRes.blob();
                // Blob URL을 생성하여 즉시 로딩 (네트워크 안 탐)
                img.src = URL.createObjectURL(blob);
            } else {
                img.src = url;
            }
        } catch {
            img.src = url;
        }
      } else {
        img.src = url;
      }

      // 로딩 완료 핸들러
      img.onload = () => {
        globalImageCache[url] = img;
        loadedCount++;
        onProgress(Math.floor((loadedCount / total) * 100));
        resolve();
      };

      img.onerror = () => {
        // 실패해도 진행은 시킴
        loadedCount++;
        onProgress(Math.floor((loadedCount / total) * 100));
        resolve();
      };
    });
  };

  // [핵심] 배치 단위 병렬 처리 (한 번에 10개씩 로딩)
  // 기존에는 1개씩 0.2초 딜레이를 줬으나, 이제는 최대한 빠르게 처리
  const BATCH_SIZE = 10;
  for (let i = 0; i < total; i += BATCH_SIZE) {
    const batch = imageUrls.slice(i, i + BATCH_SIZE);
    await Promise.all(batch.map(url => loadSingleImage(url)));
    // 배치 사이 아주 짧은 대기 (UI 렌더링 갱신용)
    await new Promise(r => setTimeout(r, 10));
  }

  onProgress(100);
};
