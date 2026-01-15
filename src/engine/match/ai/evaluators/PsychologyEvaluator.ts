// ==========================================
// FILE PATH: /src/engine/match/ai/evaluators/PsychologyEvaluator.ts
// ==========================================
import { LivePlayer, LiveMatch } from '../../../../types';

export class PsychologyEvaluator {
  
  /**
   * 플레이어의 현재 심리 상태(Morale)를 배율로 반환합니다.
   * 1.0 = 평정심
   * > 1.0 = 고양됨 (적극적, 공격적)
   * < 1.0 = 위축됨 (소극적, 방어적)
   */
  static getMorale(player: LivePlayer, match: LiveMatch): number {
    let morale = 1.0;

    // 1. KDA 기반 자신감
    const kda = player.deaths === 0 ? player.kills : player.kills / player.deaths;
    
    if (kda > 3.0) morale += 0.2; // 캐리 중
    if (kda > 5.0) morale += 0.3; // 학살 중 (매우 공격적)
    if (player.deaths > player.kills + 2) morale -= 0.2; // 말림
    if (player.deaths > 5 && player.kills === 0) morale -= 0.3; // 멘탈 붕괴

    // 2. 연속 킬/데스 (Streak)
    if (player.killStreak >= 3) morale += 0.2; // 신남
    
    // 3. 팀 상황 (골드 차이)
    // 정확한 골드 차이 계산은 무거우므로 타워 수로 대략 판단
    const isBlue = match.blueTeam.includes(player);
    const myStats = isBlue ? match.stats.blue : match.stats.red;
    const enemyStats = isBlue ? match.stats.red : match.stats.blue;
    
    const myTowers = myStats.towers.top + myStats.towers.mid + myStats.towers.bot;
    const enemyTowers = enemyStats.towers.top + enemyStats.towers.mid + enemyStats.towers.bot;

    if (enemyTowers - myTowers >= 2) morale += 0.1; // 우리가 유리함
    if (myTowers - enemyTowers >= 2) morale -= 0.1; // 우리가 불리함 (사려야 함)

    // 4. 뇌지컬에 따른 멘탈 보정
    const brain = player.stats.brain;
    
    // 뇌지컬이 높으면(>70): 불리해도 침착함 (morale 감점 완화)
    if (brain > 70 && morale < 1.0) {
        morale = (morale + 1.0) / 2; // 회복 탄력성
    }
    // 뇌지컬이 낮으면(<30): 유리하면 던짐 (morale 과도 상승)
    else if (brain < 30 && morale > 1.2) {
        morale += 0.3; // 뇌절 모드
    }

    // 최소 0.5 ~ 최대 2.0 제한
    return Math.max(0.5, Math.min(2.0, morale));
  }
}
