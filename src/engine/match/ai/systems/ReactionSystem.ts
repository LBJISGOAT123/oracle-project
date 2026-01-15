// ==========================================
// FILE PATH: /src/engine/match/ai/systems/ReactionSystem.ts
// ==========================================
import { LivePlayer } from '../../../../types';

const threatMemory = new WeakMap<LivePlayer, { id: string, detectedAt: number }[]>();

export class ReactionSystem {
  
  static canReactToThreat(player: LivePlayer, threatId: string, currentTime: number): boolean {
    let threats = threatMemory.get(player);
    if (!threats) {
      threats = [];
      threatMemory.set(player, threats);
    }

    let memory = threats.find(t => t.id === threatId);
    
    if (!memory) {
      memory = { id: threatId, detectedAt: currentTime };
      threats.push(memory);
      if (threats.length > 10) threats.shift();
    }

    const mechanics = player.stats.mechanics;
    
    // [밸런스 패치] 반응 속도 공식 완화
    // 기존: 0.6초 - (mechanics * 0.005) -> 피지컬 50일 때 0.35초 (느림)
    // 변경: 0.5초 - (mechanics * 0.004) -> 피지컬 50일 때 0.3초, 피지컬 80이면 0.18초
    // "보고 피했다" 소리 나오게 상향
    const reactionDelay = Math.max(0.1, 0.5 - (mechanics * 0.004)); 

    return (currentTime - memory.detectedAt) >= reactionDelay;
  }

  static getAimError(player: LivePlayer): { x: number, y: number } {
    const mechanics = player.stats.mechanics;
    
    // 피지컬 70 이상이면 오차 없음 (기존 80에서 완화)
    if (mechanics >= 70) return { x: 0, y: 0 };

    const errorMagnitude = (70 - mechanics) * 0.05; 
    const angle = Math.random() * Math.PI * 2;
    
    return {
        x: Math.cos(angle) * errorMagnitude,
        y: Math.sin(angle) * errorMagnitude
    };
  }
}
