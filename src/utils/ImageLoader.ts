// ==========================================
// FILE PATH: src/utils/ImageLoader.ts
// ==========================================
import { INITIAL_CUSTOM_IMAGES } from '../data/initialImages';

export const preloadGameImages = async (
  onProgress: (percent: number) => void
): Promise<void> => {
  // 1. 사용자 대기 시간 0초 (즉시 시작)
  onProgress(100);

  // 2. 백그라운드 캐싱 (속도 조절)
  const imageUrls = Array.from(new Set(Object.values(INITIAL_CUSTOM_IMAGES))).filter(url => !!url);
  if (imageUrls.length === 0) return;

  let index = 0;
  
  const loadNext = () => {
    if (index >= imageUrls.length) return;

    // [핵심] 동시에 여러 개를 요청하지 않고, 하나씩 순차적으로 요청합니다.
    const img = new Image();
    img.src = imageUrls[index];
    
    index++;
    
    // [수정] 50ms -> 200ms로 텀을 늘려서
    // 화면에 있는 '진짜 필요한 이미지'가 다운로드될 대역폭을 확보해줍니다.
    setTimeout(loadNext, 200);
  };

  // 게임 시작 후 2초 뒤부터 천천히 받기 시작
  setTimeout(loadNext, 2000);
};
