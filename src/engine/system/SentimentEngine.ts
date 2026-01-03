// ==========================================
// FILE PATH: /src/engine/system/SentimentEngine.ts
// ==========================================
// [수정] ../types -> ../../types
import { GameState, Hero, Post } from '../../types';

export function calculateTargetSentiment(
  gameState: GameState,
  heroes: Hero[],
  posts: Post[]
): number {
  let target = 65; 

  let brokenCount = 0;
  let goldenCount = 0; 

  heroes.forEach(h => {
    const wr = h.recentWinRate;
    if (wr >= 48 && wr <= 52) goldenCount++;
    if (wr > 58 || wr < 42) {
      brokenCount++;
      target -= (Math.abs(wr - 50) - 8) * 2; 
    }
  });

  if (brokenCount === 0) target += 10;
  if (goldenCount >= (heroes.length / 2)) target += 10;

  const izmanKills = parseFloat(gameState.godStats.izmanAvgKills);
  const danteKills = parseFloat(gameState.godStats.danteAvgKills);
  const totalAvgKills = izmanKills + danteKills;

  if (totalAvgKills >= 30) target += 5;
  if (totalAvgKills >= 50) target += 5;
  if (totalAvgKills < 15) target -= 5;

  let totalGold = 0;
  let heroCount = 0;
  heroes.forEach(h => {
    const goldVal = parseInt(h.avgGold.replace(/,/g, '')) || 0;
    if(goldVal > 0) {
        totalGold += goldVal;
        heroCount++;
    }
  });
  const globalAvgGold = heroCount > 0 ? totalGold / heroCount : 0;

  if (globalAvgGold >= 12000) target += 5;
  if (globalAvgGold >= 15000) target += 5;

  const waitTime = gameState.userStatus.avgWaitTime;
  if (waitTime <= 20) target += 5;
  else if (waitTime > 60) target -= 10;

  const recentPosts = posts.slice(0, 30);
  let communityScore = 0;

  recentPosts.forEach(p => {
    if (p.category === '징징' && p.isBest) communityScore -= 2;
    if (p.category === '공략' || p.category === '분석') communityScore += 0.5;
    if (p.category === '자랑' && p.upvotes > 5) communityScore += 0.2;
  });

  target += Math.max(-20, Math.min(15, communityScore));

  return Math.max(0, Math.min(100, target));
}

export function smoothSentiment(current: number, target: number): number {
  const diff = target - current;
  if (Math.abs(diff) < 0.1) return target;
  let speed = 0.05; 
  if (diff > 0) speed = 0.08;
  else speed = 0.03;
  return current + diff * speed;
}