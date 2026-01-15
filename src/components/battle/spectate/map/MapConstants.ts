// ==========================================
// FILE PATH: /src/components/battle/spectate/map/MapConstants.ts
// ==========================================

// [핵심] 뷰(View) 전용 상수를 따로 만들지 않고, 엔진의 상수를 그대로 내보냅니다.
// 이제 화면에 그리는 좌표와 AI가 계산하는 좌표는 완벽하게 동일합니다.
export { TOWER_COORDS, BASES, POI } from '../../../../engine/match/constants/MapConstants';
