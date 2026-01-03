// ==========================================
// FILE PATH: /src/engine/match/systems/DecisionEngine.ts
// ==========================================
import { LivePlayer, LiveMatch, Hero } from '../../../types';
import { getDistance, BASES, POI } from '../../data/MapData';

export type ActionType = 'FARM' | 'TRADE' | 'GANK' | 'OBJECTIVE' | 'RECALL';

export interface Decision {
  action: ActionType;
  targetPos: { x: number, y: number };
  targetUnit?: LivePlayer;
  reason: string;
}

export const makeDecision = (
  player: LivePlayer, 
  match: LiveMatch, 
  heroes: Hero[]
): Decision => {
  const isBlue = match.blueTeam.includes(player);
  const enemies = isBlue ? match.redTeam : match.blueTeam;
  const myBase = isBlue ? BASES.BLUE : BASES.RED;

  // 1. [생존 본능] 체력이 25% 미만이거나 돈이 많으면 집으로
  if (player.currentHp < player.maxHp * 0.25 || player.gold > 2500) {
    return { action: 'RECALL', targetPos: myBase, reason: '재정비' };
  }

  // 2. [오브젝트 합류] 용/바론이 살아있고, 내가 정글/미드/봇이면 합류
  // (거신병은 탑/미드/정글, 주시자는 봇/미드/정글)
  const isJungler = player.lane === 'JUNGLE';
  const isMid = player.lane === 'MID';

  if (match.objectives.watcher.status === 'ALIVE') {
    if (isJungler || isMid || player.lane === 'BOT') {
        return { action: 'OBJECTIVE', targetPos: POI.DRAGON, reason: '주시자(용) 합류' };
    }
  }
  if (match.objectives.colossus.status === 'ALIVE') {
    if (isJungler || isMid || player.lane === 'TOP') {
        // 거신병은 15분 이후에만 관심 (초반엔 무리)
        if (match.currentDuration > 900) { 
            return { action: 'OBJECTIVE', targetPos: POI.BARON, reason: '거신병(바론) 합류' };
        }
    }
  }

  // 3. [전투] 주변(시야 15)에 적이 있는가?
  let closestEnemy = null;
  let minDist = 15; 

  for (const e of enemies) {
    if (e.currentHp > 0 && e.respawnTimer <= 0) {
      const d = getDistance(player, e);
      if (d < minDist) {
        minDist = d;
        closestEnemy = e;
      }
    }
  }

  if (closestEnemy) {
    // 쫄지 말고 싸움 (단, 체력 차이가 너무 심하면 도망가는 로직 추가 가능)
    return { 
        action: 'TRADE', 
        targetPos: {x: closestEnemy.x, y: closestEnemy.y}, 
        targetUnit: closestEnemy, 
        reason: '교전' 
    };
  }

  // 4. [갱킹] 정글러는 할 거 없으면 갱킹 각 봄
  if (isJungler && player.currentHp > player.maxHp * 0.7) {
    // 적 라이너 중 피가 없는 놈 찾기
    const gankTarget = enemies.find(e => e.lane !== 'JUNGLE' && e.currentHp > 0 && e.currentHp < e.maxHp * 0.5);
    if (gankTarget && Math.random() < 0.05) { // 너무 자주 가면 동선 낭비니 확률 조절
        return { 
            action: 'GANK', 
            targetPos: {x: gankTarget.x, y: gankTarget.y}, 
            targetUnit: gankTarget, 
            reason: '갱킹' 
        };
    }
  }

  // 5. [기본] 라인 복귀 및 파밍 (MatchUpdater/PlayerSystem에서 경로 처리함)
  return { action: 'FARM', targetPos: {x: player.x, y: player.y}, reason: '라인전' };
};