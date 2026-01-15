// ==========================================
// FILE PATH: /src/engine/match/ai/tactics/SquadController.ts
// ==========================================
import { LiveMatch, LivePlayer } from '../../../../types';
import { AIUtils } from '../AIUtils';
import { BASES } from '../../constants/MapConstants';

export class SquadController {
  
  static getGroupOrder(player: LivePlayer, match: LiveMatch): { action: string, pos?: {x:number, y:number} } | null {
    const isBlue = match.blueTeam.includes(player);
    const allies = isBlue ? match.blueTeam : match.redTeam;
    
    // 15분 이전에는 라인전 (각자도생)
    if (match.currentDuration < 900) return null;

    // 살아있는 아군 수
    const activeAllies = allies.filter(a => a.currentHp > 0 && a.respawnTimer <= 0);
    if (activeAllies.length < 3) return null; // 3명 미만이면 각자 행동

    // 가장 잘 큰 아군(에이스) 찾기
    const ace = activeAllies.sort((a,b) => b.totalGold - a.totalGold)[0];
    
    // 내가 에이스라면? -> 내가 리더이므로 자유 행동
    if (ace === player) return null;

    // 에이스가 본진에 있으면 집결 해제
    const myBase = isBlue ? BASES.BLUE : BASES.RED;
    if (AIUtils.dist(ace, myBase) < 20) return null;

    // [핵심 수정] 
    // 에이스의 정확히 같은 위치가 아니라, 주변 5~8 거리 내의 랜덤한 위치로 집결시킴
    // 이렇게 해야 5명이 한 점에 겹쳐서 비비는 현상이 사라짐
    const offsetX = (Math.random() - 0.5) * 8;
    const offsetY = (Math.random() - 0.5) * 8;

    return {
        action: 'ASSEMBLE',
        pos: { 
            x: Math.max(5, Math.min(95, ace.x + offsetX)), 
            y: Math.max(5, Math.min(95, ace.y + offsetY)) 
        }
    };
  }
}
