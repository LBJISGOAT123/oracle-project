// ==========================================
// FILE PATH: /src/engine/match/utils/SpatialGrid.ts
// ==========================================

// 맵 크기 100x100 기준
const MAP_SIZE = 100;
// 셀 하나당 크기 (원거리 미니언 사거리가 16 정도이므로 20으로 설정하면 인접 셀 1칸만 봐도 충분)
const CELL_SIZE = 20;
const COLS = Math.ceil(MAP_SIZE / CELL_SIZE);

export class SpatialGrid {
  // 1차원 배열로 2차원 그리드 표현 (메모리 효율 극대화)
  private cells: any[][] = [];

  constructor() {
    // 미리 배열 공간 확보
    for (let i = 0; i < COLS * COLS; i++) {
        this.cells[i] = [];
    }
  }

  // 매 프레임 초기화 (clear) - 배열을 새로 만드는게 아니라 길이만 0으로 (GC 방지)
  clear() {
    for (let i = 0; i < this.cells.length; i++) {
        this.cells[i].length = 0; 
    }
  }

  insert(unit: any) {
    if (unit.hp <= 0) return;
    const index = this.getCellIndex(unit.x, unit.y);
    if (this.cells[index]) {
        this.cells[index].push(unit);
    }
  }

  // 주변 유닛 가져오기 (자신이 속한 셀 + 인접 8개 셀)
  getNearbyUnits(unit: any): any[] {
    const x = unit.x;
    const y = unit.y;
    
    const col = Math.floor(x / CELL_SIZE);
    const row = Math.floor(y / CELL_SIZE);
    
    const result: any[] = [];

    // 3x3 범위 탐색 (경계 검사 포함)
    for (let r = row - 1; r <= row + 1; r++) {
        if (r < 0 || r >= COLS) continue;
        for (let c = col - 1; c <= col + 1; c++) {
            if (c < 0 || c >= COLS) continue;
            
            const index = r * COLS + c;
            const cellUnits = this.cells[index];
            // 루프 언롤링 효과를 위해 concat 대신 push loop 사용
            for (let k = 0; k < cellUnits.length; k++) {
                result.push(cellUnits[k]);
            }
        }
    }
    return result;
  }

  private getCellIndex(x: number, y: number): number {
    const col = Math.floor(Math.max(0, Math.min(MAP_SIZE - 0.1, x)) / CELL_SIZE);
    const row = Math.floor(Math.max(0, Math.min(MAP_SIZE - 0.1, y)) / CELL_SIZE);
    return row * COLS + col;
  }
}
