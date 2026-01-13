// ==========================================
// FILE PATH: /src/utils/ResourceDownloader.ts
// ==========================================
import { INITIAL_CUSTOM_IMAGES } from '../data/initialImages';

const CACHE_NAME = 'gods-war-assets-v1';

export const downloadAllResources = async (
  onProgress: (current: number, total: number) => void
): Promise<boolean> => {
  // 1. 다운로드할 이미지 목록 확보
  const urls = Array.from(new Set(Object.values(INITIAL_CUSTOM_IMAGES))).filter(url => !!url);
  const total = urls.length;
  let count = 0;

  try {
    // 2. 브라우저 캐시 저장소 열기
    const cache = await caches.open(CACHE_NAME);

    // 3. 병렬 처리 대신 안정성을 위해 5개씩 끊어서 다운로드 (배치 처리)
    const BATCH_SIZE = 5;
    
    for (let i = 0; i < total; i += BATCH_SIZE) {
      const batch = urls.slice(i, i + BATCH_SIZE);
      
      await Promise.all(batch.map(async (url) => {
        try {
          // 이미 캐시에 있는지 확인
          const match = await cache.match(url);
          if (!match) {
            // 없으면 네트워크 요청해서 저장
            await cache.add(url);
          }
        } catch (e) {
          console.warn(`이미지 다운로드 실패 (${url}):`, e);
        } finally {
          count++;
          onProgress(count, total);
        }
      }));
    }
    
    return true;
  } catch (e) {
    console.error("리소스 다운로드 시스템 오류:", e);
    alert("이 브라우저는 리소스 저장을 지원하지 않습니다.");
    return false;
  }
};

export const checkCachedStatus = async (): Promise<number> => {
  try {
    const cache = await caches.open(CACHE_NAME);
    const keys = await cache.keys();
    return keys.length;
  } catch {
    return 0;
  }
};
