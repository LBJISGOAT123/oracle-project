// ==========================================
// FILE PATH: /src/engine/match/logics/RoamingLogic.ts
// ==========================================
import { LivePlayer, LiveMatch, Hero } from '../../../types';
import { AIUtils } from '../ai/AIUtils';
import { MacroDecision } from '../ai/MacroBrain';
import { TOWER_COORDS } from '../constants/MapConstants';

export class RoamingLogic {
  
  static checkRoaming(player: LivePlayer, match: LiveMatch, hero: Hero): MacroDecision | null {
    // 1. 기본 조건 체크
    // - 봇(원딜/서폿)은 라인전 단계에서 로밍 잘 안감 (일단 제외)
    // - 정글러는 별도 로직 따름
    if (player.lane === 'BOT' || player.lane === 'JUNGLE') return null;
    
    // - 체력/마나가 충분해야 함 (70% 이상)
    if (AIUtils.hpPercent(player) < 0.7 || AIUtils.mpPercent(player) < 0.4) return null;

    // - 뇌지컬 (Brain) 스탯
    const brain = player.stats.brain; // 0 ~ 100

    // 2. 라인 상황 체크 (Wave Management)
    const isBlue = match.blueTeam.includes(player);
    const minions = match.minions || [];
    
    // 내 라인의 적 미니언 수
    const enemyMinions = minions.filter(m => 
        m.lane === player.lane && 
        m.team !== (isBlue ? 'BLUE' : 'RED') && 
        m.hp > 0
    );

    // [뇌지컬 판단 1] 라인 관리
    // 뇌지컬이 50 이상이면: 적 미니언이 많을 때(받아먹어야 할 때)는 로밍 안 감
    if (brain >= 50 && enemyMinions.length > 2) {
        // 단, 적 미니언이 우리 타워 근처에 있으면 절대 안 감 (뇌지컬 30 이상)
        const myTower = this.getMyTowerPos(player.lane, 1, isBlue);
        const closestMinionDist = enemyMinions.reduce((min, m) => Math.min(min, AIUtils.dist(m, myTower)), 999);
        
        if (closestMinionDist < 20) return null; // 받아먹어라
    }
    // 뇌지컬이 낮으면(50 미만): 라인이 박히든 말든 로밍 갈 수도 있음 (트롤)

    // 3. 로밍 대상 탐색 (Target Selection)
    // 미드는 TOP/BOT 둘 다 가능, 탑은 MID만 (텔레포트 미구현이므로)
    const targetLanes = player.lane === 'MID' ? ['TOP', 'BOT'] : ['MID'];
    
    let bestTarget = null;
    let maxScore = 0;

    const enemies = isBlue ? match.redTeam : match.blueTeam;

    for (const enemy of enemies) {
        if (enemy.currentHp <= 0 || !targetLanes.includes(enemy.lane)) continue;

        let score = 0;

        // A. 적 체력 점수 (딸피일수록 점수 높음)
        const hpPer = AIUtils.hpPercent(enemy);
        if (hpPer < 0.5) score += (1 - hpPer) * 100;
        else if (brain > 60) continue; // 뇌지컬 좋으면 풀피 로밍 안감

        // B. 아군 호응 여부
        // 해당 라인에 아군이 살아있어야 함
        const allyInLane = (isBlue ? match.blueTeam : match.redTeam).find(a => a.lane === enemy.lane && a.currentHp > 0);
        if (!allyInLane) continue; // 아군 없으면 안 감

        // C. 라인 상황 (Overextension)
        // 적이 우리 타워쪽으로 깊숙이 들어와 있으면 점수 대폭 상승
        const enemyDistToMyBase = AIUtils.dist(enemy, AIUtils.getMyBasePos(isBlue));
        if (enemyDistToMyBase < 60) score += 50; // 깊숙함

        // D. 뇌지컬 보정
        // 뇌지컬이 높으면 승산 계산을 더 깐깐하게 함
        if (brain > 70 && hpPer > 0.4 && score < 30) continue;

        if (score > 40 && score > maxScore) {
            maxScore = score;
            bestTarget = enemy;
        }
    }

    if (bestTarget) {
        return {
            action: 'GANK',
            targetPos: { x: bestTarget.x, y: bestTarget.y },
            targetUnit: bestTarget,
            reason: `로밍 (승산: ${Math.floor(maxScore)}%)`
        };
    }

    return null;
  }

  private static getMyTowerPos(lane: string, tier: number, isBlue: boolean) {
    const coords = isBlue ? TOWER_COORDS.BLUE : TOWER_COORDS.RED;
    // @ts-ignore
    return coords[lane][tier-1] || coords.NEXUS;
  }
}
