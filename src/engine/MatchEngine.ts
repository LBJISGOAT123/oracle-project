// ==========================================
// FILE PATH: /src/engine/MatchEngine.ts
// ==========================================

// 이제 실제 로직은 아래 파일들로 분리되었습니다.
// 이 파일은 하위 호환성을 위해 함수들을 다시 내보내기만 합니다.

export { createLiveMatches } from './match/MatchCreator';
export { updateLiveMatches } from './match/MatchUpdater';
export { finishMatch } from './match/MatchSettlement';