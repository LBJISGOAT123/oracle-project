// ==========================================
// FILE PATH: /src/engine/match/utils/SpatialGrid.ts
// ==========================================
import { Vector2 } from '../Vector';

// 맵 크기 100x100 기준
const MAP_SIZE = 100;
// 셀 하나당 크기 (사거리와 비슷한 10~15 정도가 적당)
const CELL_SIZE = 10;
// 행/열 개수 (100 / 10 = 10개)
const COLS = Math.ceil(MAP_SIZE / CELL_SIZE);

export class SpatialGrid {
  private cells: Map<number, any[]> = new Map();

  constructor(units: any[]) {
    // 생성과 동시에 그리드 구축 (O(N) - 매우 빠름)
    this.build(units);
  }

  private build(units: any[]) {
    this.cells.clear();
    for (const unit of units) {
      if (unit.currentHp <= 0) continue; // 죽은 유닛 제외
      
      const index = this.getCellIndex(unit.x, unit.y);
      if (!this.cells.has(index)) {
        this.cells.set(index, []);
      }
      this.cells.get(index)!.push(unit);
    }
  }

  // 좌표를 셀 인덱스로 변환
  private getCellIndex(x: number, y: number): number {
    const col = Math.floor(Math.max(0, Math.min(MAP_SIZE - 1, x)) / CELL_SIZE);
    const row = Math.floor(Math.max(0, Math.min(MAP_SIZE - 1, y)) / CELL_SIZE);
    return row * COLS + col;
  }

  // 내 주변(자신이 속한 셀 + 인접 8개 셀)에 있는 유닛들만 반환
  public getNearbyUnits(me: Vector2): any[] {
    const centerIndex = this.getCellIndex(me.x, me.y);
    const result: any[] = [];

    const row = Math.floor(centerIndex / COLS);
    const col = centerIndex % COLS;

    // 인접 3x3 셀 탐색
    for (let r = row - 1; r <= row + 1; r++) {
      for (let c = col - 1; c <= col + 1; c++) {
        if (r >= 0 && r < COLS && c >= 0 && c < COLS) {
          const idx = r * COLS + c;
          const unitsInCell = this.cells.get(idx);
          if (unitsInCell) {
            // for 루프가 concat보다 빠름
            for (let i = 0; i < unitsInCell.length; i++) {
                result.push(unitsInCell[i]);
            }
          }
        }
      }
    }
    return result;
  }
}
