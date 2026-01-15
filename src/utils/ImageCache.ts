// ==========================================
// FILE PATH: /src/utils/ImageCache.ts
// ==========================================

// 이미 로딩 완료된 이미지 객체들을 보관하는 전역 저장소
export const globalImageCache: Record<string, HTMLImageElement> = {};

// 이미지가 캐시에 있는지 확인
export const hasImageInCache = (src: string) => {
  return !!globalImageCache[src];
};

// 캐시된 이미지 가져오기
export const getCachedImage = (src: string) => {
  return globalImageCache[src];
};
