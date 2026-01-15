// ==========================================
// FILE PATH: /src/engine/match/ai/systems/MapAwareness.ts
// ==========================================
import { LivePlayer, LiveMatch } from '../../../../types';
import { AIUtils } from '../AIUtils';

export class MapAwareness {
  
  /**
   * [육감 (Sixth Sense)]
   * 시야에 보이지 않는 적(MIA)에 대한 공포감을 계산합니다.
   * - 뇌지컬 높음: 안 보이면 "매복해 있겠구나" 하고 사림 (Danger Score 높음)
   * - 뇌지컬 낮음: 안 보이면 "집 갔겠지" 하고 던짐 (Danger Score 0)
   */
  static getHiddenThreatScore(player: LivePlayer, match: LiveMatch): number {
    const brain = player.stats.brain; // 0 ~ 100
    
    // 뇌지컬 40 이하는 맵리딩 안함
    if (brain < 40) return 0;

    const isBlue = match.blueTeam.includes(player);
    const enemies = isBlue ? match.redTeam : match.blueTeam;
    
    // 시야에서 사라진 적 카운트
    // (여기서는 시야 시스템이 단순하므로, 나와 거리가 먼 적을 MIA로 간주)
    const visibleRange = 25;
    const missingEnemies = enemies.filter(e => 
        e.currentHp > 0 && 
        e.respawnTimer <= 0 && 
        AIUtils.dist(player, e) > visibleRange
    );

    if (missingEnemies.length === 0) return 0;

    // 뇌지컬에 따른 위협 가중치
    // brain 100 -> 적 1명당 위협도 50
    // brain 50  -> 적 1명당 위협도 20
    const threatPerEnemy = (brain - 30) * 0.8;
    
    // 아군 영토(타워 근처)에 있으면 위협 감소
    const myBase = isBlue ? {x:0, y:100} : {x:100, y:0}; // 대략적 본진 방향
    const safety = 100 - AIUtils.dist(player, myBase);
    
    // 최종 위험 점수 (내가 적진 깊숙이 있을수록 공포감이 커짐)
    let dangerScore = missingEnemies.length * threatPerEnemy;
    
    // 우리 진영이면 안 무서움
    if (safety > 70) dangerScore *= 0.1;
    
    return dangerScore;
  }
}
