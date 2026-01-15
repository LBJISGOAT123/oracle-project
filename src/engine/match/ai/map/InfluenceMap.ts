// ==========================================
// FILE PATH: /src/engine/match/ai/map/InfluenceMap.ts
// ==========================================
import { LiveMatch, LivePlayer } from '../../../../types';
import { TOWER_COORDS } from '../../constants/MapConstants';

// 맵을 20x20 그리드로 나눔 (100 좌표계 기준, 1칸 = 5)
const GRID_SIZE = 20;
const CELL_SIZE = 100 / GRID_SIZE;

export class InfluenceMap {
  // 팀별 위험지도 (값이 높을수록 위험)
  static getDangerMap(match: LiveMatch, isBlueTeam: boolean): number[][] {
    const grid = Array(GRID_SIZE).fill(0).map(() => Array(GRID_SIZE).fill(0));
    const enemyTeam = isBlueTeam ? match.redTeam : match.blueTeam;
    const enemyTowers = isBlueTeam ? match.stats.red.towers : match.stats.blue.towers;
    const enemyTowerCoords = isBlueTeam ? TOWER_COORDS.RED : TOWER_COORDS.BLUE;

    // 1. 적 영웅의 영향력 (위험)
    enemyTeam.forEach(e => {
      if (e.currentHp <= 0) return;
      const gx = Math.floor(e.x / CELL_SIZE);
      const gy = Math.floor(e.y / CELL_SIZE);
      // 영웅 주변 3x3 칸에 위험도 전파
      this.addInfluence(grid, gx, gy, 50, 2); 
    });

    // 2. 적 타워의 영향력 (극도로 위험 - 다이브 방지)
    const lanes = ['top', 'mid', 'bot'] as const;
    lanes.forEach(lane => {
        const broken = (enemyTowers as any)[lane];
        // @ts-ignore
        const coords = enemyTowerCoords[lane.toUpperCase()];
        coords.forEach((pos:any, idx:number) => {
            if (idx >= broken) { // 살아있는 타워
                const gx = Math.floor(pos.x / CELL_SIZE);
                const gy = Math.floor(pos.y / CELL_SIZE);
                this.addInfluence(grid, gx, gy, 200, 2); // 타워는 매우 위험 (200점)
            }
        });
    });

    return grid;
  }

  // 3. 최적의 안전 이동 위치 찾기
  static getOptimalPos(player: LivePlayer, match: LiveMatch, targetPos: {x:number, y:number}): {x:number, y:number} {
    const isBlue = match.blueTeam.includes(player);
    const dangerMap = this.getDangerMap(match, isBlue);
    
    const startX = Math.floor(player.x / CELL_SIZE);
    const startY = Math.floor(player.y / CELL_SIZE);
    
    let bestScore = -9999;
    let bestPos = { x: player.x, y: player.y };

    // 주변 1칸(8방향) 탐색
    for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
            const nx = startX + dx;
            const ny = startY + dy;
            
            if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
                const danger = dangerMap[ny][nx];
                const worldX = (nx * CELL_SIZE) + (CELL_SIZE/2);
                const worldY = (ny * CELL_SIZE) + (CELL_SIZE/2);
                
                // 목표지점까지의 거리 (가까울수록 좋음)
                const distToTarget = Math.sqrt(Math.pow(targetPos.x - worldX, 2) + Math.pow(targetPos.y - worldY, 2));
                
                // 점수 = (목표 접근성 * 2) - (위험도 * 뇌지컬 가중치)
                const brainFactor = player.stats.brain / 20; // 멍청하면 위험도 무시
                const score = (100 - distToTarget) - (danger * brainFactor);

                if (score > bestScore) {
                    bestScore = score;
                    bestPos = { x: worldX, y: worldY };
                }
            }
        }
    }
    return bestPos;
  }

  private static addInfluence(grid: number[][], x: number, y: number, value: number, radius: number) {
    for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
                // 거리에 따른 감쇠
                const dist = Math.abs(dx) + Math.abs(dy);
                const decay = Math.max(0, value - (dist * (value / (radius + 1))));
                grid[ny][nx] += decay;
            }
        }
    }
  }
}
