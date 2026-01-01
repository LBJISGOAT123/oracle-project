// ==========================================
// FILE PATH: /src/engine/SentimentEngine.ts
// ==========================================

import { GameState, Hero, Post } from '../types';

/**
 * 목표 민심(Target Sentiment)을 계산합니다. (v2.0 Science Logic)
 * - 아무것도 안 해도 기본적으로 60~70점(보통~좋음)을 유지합니다.
 * - 특정 조건(경제 호황, 황금 밸런스, 꿀잼 전투)을 달성하면 90점 이상으로 치솟습니다.
 * - 명백한 관리 소홀(서버 터짐, 승률 60% 방치)일 때만 떨어집니다.
 */
export function calculateTargetSentiment(
  gameState: GameState,
  heroes: Hero[],
  posts: Post[]
): number {
  // [기본 점수]: 65점 (시작부터 '약간 좋음' 상태)
  let target = 65; 

  // --------------------------------------------------------
  // 1. ⚖️ 밸런스 (Balance) - "억까 방지"
  // --------------------------------------------------------
  let brokenCount = 0; // 생태계 교란종 수
  let goldenCount = 0; // 황금 밸런스 수

  heroes.forEach(h => {
    const wr = h.recentWinRate;

    // 황금 밸런스 (48~52%): 아주 이상적인 구간
    if (wr >= 48 && wr <= 52) goldenCount++;

    // 허용 범위 (45~55%): 이 구간은 "정상"으로 간주 (감점 없음)

    // 심각한 불균형 (58% 초과 or 42% 미만): 이때만 유저들이 화냄
    if (wr > 58 || wr < 42) {
      brokenCount++;
      target -= (Math.abs(wr - 50) - 8) * 2; // 격차만큼 감점
    }
  });

  // [평화 보너스] 문제아가 하나도 없으면 관리 능력을 칭찬함 (+10)
  if (brokenCount === 0) target += 10;

  // [황금기 보너스] 절반 이상의 영웅이 황금 밸런스면 극찬 (+10)
  if (goldenCount >= (heroes.length / 2)) target += 10;


  // --------------------------------------------------------
  // 2. ⚔️ 도파민 지수 (Excitement) - "킬이 많이 나야 재밌다"
  // --------------------------------------------------------
  const izmanKills = parseFloat(gameState.godStats.izmanAvgKills);
  const danteKills = parseFloat(gameState.godStats.danteAvgKills);
  const totalAvgKills = izmanKills + danteKills;

  // 평균 30킬 이상이면 "화끈한 메타" (+5)
  if (totalAvgKills >= 30) target += 5;
  // 평균 50킬 이상이면 "대유잼 시대" (+10)
  if (totalAvgKills >= 50) target += 5;

  // 반대로 15킬 미만이면 "수면제 메타" (-5)
  if (totalAvgKills < 15) target -= 5;


  // --------------------------------------------------------
  // 3. 💰 경제 지수 (Economy) - "돈이 잘 벌려야 재밌다"
  // --------------------------------------------------------
  // 모든 영웅의 평균 골드 획득량 계산
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

  // 평균 1.2만 골드 이상 벌리면 "성장이 시원시원하다" (+5)
  if (globalAvgGold >= 12000) target += 5;
  // 평균 1.5만 골드 이상이면 "혜자 게임" (+5)
  if (globalAvgGold >= 15000) target += 5;


  // --------------------------------------------------------
  // 4. ⏳ 쾌적함 지수 (Quality of Service)
  // --------------------------------------------------------
  const waitTime = gameState.userStatus.avgWaitTime;

  // 매칭 20초 이내: "갓서버" (+5)
  if (waitTime <= 20) target += 5;
  // 매칭 60초 초과: "망겜소리 나옴" (-10)
  else if (waitTime > 60) target -= 10;


  // --------------------------------------------------------
  // 5. 🗣️ 커뮤니티 여론 (Public Opinion)
  // --------------------------------------------------------
  const recentPosts = posts.slice(0, 30);
  let communityScore = 0;

  recentPosts.forEach(p => {
    // 징징글이 념글(Best) 갔을 때만 타격 (일반 징징글은 무시)
    if (p.category === '징징' && p.isBest) communityScore -= 2;

    // 분석/공략글은 유저들의 학구열을 의미함 (상승)
    if (p.category === '공략' || p.category === '분석') communityScore += 0.5;

    // 칭찬/자랑글이 많으면 분위기 좋음
    if (p.category === '자랑' && p.upvotes > 5) communityScore += 0.2;
  });

  // 커뮤니티 영향력 제한 (-20 ~ +15)
  target += Math.max(-20, Math.min(15, communityScore));


  // 최종 범위 제한 (0 ~ 100)
  return Math.max(0, Math.min(100, target));
}

/**
 * 민심 변동 관성 로직
 * - 급격하게 변하지 않고 서서히 변합니다.
 * - 떨어질 때는 천천히 떨어지지만, 회복은 조금 더 빠릅니다.
 */
export function smoothSentiment(current: number, target: number): number {
  const diff = target - current;

  // 이미 목표치 근처면 고정
  if (Math.abs(diff) < 0.1) return target;

  let speed = 0.05; // 기본 변화 속도

  // 민심이 오를 때는 약간 더 빠르게 반영 (유저들이 좋은 패치엔 반응이 빠름)
  if (diff > 0) speed = 0.08;
  // 민심이 떨어질 때는 조금 천천히 (방어 기제)
  else speed = 0.03;

  return current + diff * speed;
}