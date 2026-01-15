// ==========================================
// FILE PATH: /src/engine/match/systems/RecallSystem.ts
// ==========================================
import { LivePlayer, LiveMatch, Hero } from '../../../types';
import { BASES } from '../constants/MapConstants';
import { useGameStore } from '../../../store/useGameStore';
import { attemptBuyItem } from './ItemManager';

export class RecallSystem {
  
  static update(player: LivePlayer, match: LiveMatch, heroes: Hero[], shopItems: any[], dt: number) {
    const isBlue = match.blueTeam.includes(player);
    const basePos = isBlue ? BASES.BLUE : BASES.RED;
    
    // 1. 쿨타임 감소
    if (player.recallCooldown > 0) {
        player.recallCooldown -= dt;
        if (player.recallCooldown < 0) player.recallCooldown = 0;
        player.isRecalling = false;
        player.currentRecallTime = 0;
        return;
    }

    // 2. [우물 도착 상태] 즉시 회복 및 판단 초기화
    const dist = Math.sqrt(Math.pow(player.x - basePos.x, 2) + Math.pow(player.y - basePos.y, 2));
    if (dist <= 5) {
        this.instantRestore(player, isBlue, dt, heroes, shopItems, match);
        
        // [핵심] 귀환/우물 복귀 시 상태 완전 초기화 (새로운 판단 유도)
        player.isRecalling = false;
        player.currentRecallTime = 0;
        (player as any).pathIdx = 0; // 예전 경로 기억 삭제
        
        return;
    }

    // 3. 귀환 채널링 중
    if (player.isRecalling) {
        const settings = useGameStore.getState().gameState.growthSettings;
        const RECALL_DURATION = settings?.recallTime || 8.0; // 10초 -> 8초로 살짝 단축 (답답함 해소)

        player.currentRecallTime += dt;

        // 귀환 완료
        if (player.currentRecallTime >= RECALL_DURATION) {
            player.x = basePos.x;
            player.y = basePos.y;
            player.isRecalling = false;
            player.currentRecallTime = 0;
            
            // 도착 즉시 체력 50% 회복 (빠른 전선 복귀 준비)
            player.currentHp = Math.min(player.maxHp, player.currentHp + player.maxHp * 0.5);
            
            // [핵심] 귀환 완료 시에도 경로 초기화
            (player as any).pathIdx = 0;
        }
    } else {
        player.currentRecallTime = 0;
    }
  }

  static startRecall(player: LivePlayer) {
    if (player.recallCooldown > 0) return; 
    if (player.isRecalling) return; 

    player.isRecalling = true;
    player.currentRecallTime = 0;
  }

  static cancelRecall(player: LivePlayer) {
    if (player.isRecalling) {
        player.isRecalling = false;
        player.currentRecallTime = 0;
        player.recallCooldown = 3.0; 
    }
  }

  private static instantRestore(
      p: LivePlayer, isBlue: boolean, dt: number, 
      heroes: Hero[], shopItems: any[], match: LiveMatch
  ) {
      // 우물 회복 속도: 초당 40% (2.5초면 풀피)
      p.currentHp = Math.min(p.maxHp, p.currentHp + p.maxHp * 0.4 * dt);
      p.currentMp = Math.min(p.maxMp, p.currentMp + p.maxMp * 0.4 * dt);
      
      // 아이템 구매 시도
      const enemyTeam = isBlue ? match.redTeam : match.blueTeam;
      attemptBuyItem(p, shopItems, heroes, enemyTeam, match.currentDuration);
  }
}
