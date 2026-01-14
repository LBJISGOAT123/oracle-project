// ==========================================
// FILE PATH: /src/engine/match/systems/RecallSystem.ts
// ==========================================
import { LivePlayer, LiveMatch, Hero } from '../../../types';
import { BASES } from '../constants/MapConstants';
import { useGameStore } from '../../../store/useGameStore';
import { attemptBuyItem, updateLivePlayerStats } from './ItemManager';

export class RecallSystem {
  
  /**
   * 귀환 프로세스 업데이트 (매 프레임 호출)
   */
  static update(player: LivePlayer, match: LiveMatch, heroes: Hero[], shopItems: any[], dt: number) {
    const isBlue = match.blueTeam.includes(player);
    const basePos = isBlue ? BASES.BLUE : BASES.RED;
    
    // 1. 쿨타임 감소
    if (player.recallCooldown > 0) {
        player.recallCooldown -= dt;
        if (player.recallCooldown < 0) player.recallCooldown = 0;
        player.isRecalling = false;
        player.currentRecallTime = 0;
        return; // 쿨타임 중엔 귀환 불가
    }

    // 2. 이미 우물이면 귀환 로직 불필요 (즉시 회복 및 아이템 구매)
    const dist = Math.sqrt(Math.pow(player.x - basePos.x, 2) + Math.pow(player.y - basePos.y, 2));
    if (dist <= 5) {
        this.instantRestore(player, isBlue, dt, heroes, shopItems, match);
        player.isRecalling = false;
        player.currentRecallTime = 0;
        return;
    }

    // 3. 귀환 진행 중일 때
    if (player.isRecalling) {
        const settings = useGameStore.getState().gameState.growthSettings;
        const RECALL_DURATION = settings?.recallTime || 10.0;

        player.currentRecallTime += dt;

        // 귀환 완료
        if (player.currentRecallTime >= RECALL_DURATION) {
            player.x = basePos.x;
            player.y = basePos.y;
            player.isRecalling = false;
            player.currentRecallTime = 0;
            
            // 도착 즉시 체력 30% 회복
            player.currentHp = Math.min(player.maxHp, player.currentHp + player.maxHp * 0.3);
        }
    } else {
        // 귀환 중이 아니면 타이머 리셋
        player.currentRecallTime = 0;
    }
  }

  /**
   * 귀환 시작 명령 (AI가 호출)
   */
  static startRecall(player: LivePlayer) {
    if (player.recallCooldown > 0) return; // 쿨타임 중이면 무시
    if (player.isRecalling) return; // 이미 하는 중이면 무시

    player.isRecalling = true;
    player.currentRecallTime = 0;
  }

  /**
   * 피격 시 귀환 취소 (CombatPhase에서 호출)
   */
  static cancelRecall(player: LivePlayer) {
    if (player.isRecalling) {
        player.isRecalling = false;
        player.currentRecallTime = 0;
        player.recallCooldown = 3.0; // 3초간 재귀환 불가
    }
  }

  /**
   * 우물 도착 시 회복 및 아이템 구매
   */
  private static instantRestore(
      p: LivePlayer, isBlue: boolean, dt: number, 
      heroes: Hero[], shopItems: any[], match: LiveMatch
  ) {
      // 고속 회복 (초당 50%)
      p.currentHp = Math.min(p.maxHp, p.currentHp + p.maxHp * 0.5 * dt);
      p.currentMp = Math.min(p.maxMp, p.currentMp + p.maxMp * 0.5 * dt);
      
      // 아이템 구매 시도
      const enemyTeam = isBlue ? match.redTeam : match.blueTeam;
      attemptBuyItem(p, shopItems, heroes, enemyTeam, match.currentDuration);
  }
}
