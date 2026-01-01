// ==========================================
// FILE PATH: /src/engine/CommunityEngine.ts
// ==========================================

import { Hero, TierConfig, Post, Comment, AIConfig, BattleSettings, BattlefieldSettings } from '../types';
import { fetchAIPost, fetchAIComment } from '../utils/AIService';

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// 티어별 가중치 (잠재력 계산용)
const getTierWeight = (tier: string) => {
  if (tier.includes('천상계') || tier.includes('챌린저')) return 50;
  if (tier.includes('마스터') || tier.includes('에이스')) return 30;
  if (tier.includes('조커') || tier.includes('다이아')) return 20;
  if (tier.includes('골드') || tier.includes('플래티넘')) return 10;
  if (tier.includes('실버')) return 5;
  return 0; 
};

const getRandomTopicContext = (heroes: Hero[], battleSettings: BattleSettings) => {
  const rand = Math.random();
  if (rand < 0.3) {
    const h1 = pick(heroes);
    const h2 = pick(heroes.filter(h => h.id !== h1.id));
    const gap = h1.recentWinRate - h2.recentWinRate;
    const winner = gap > 0 ? h1.name : h2.name;
    return `주제: '${h1.name}' vs '${h2.name}' 성능 비교. (팩트: ${winner} 승률이 더 높음)`;
  }
  else if (rand < 0.6) {
    const h = pick(heroes);
    const skillKeys = ['q', 'w', 'e', 'r'] as const;
    const skillKey = pick(skillKeys);
    const skill = h.skills[skillKey];
    return `주제: ${h.name}의 ${skillKey.toUpperCase()}스킬('${skill.name}')에 대한 평가. (수치: 기본데미지 ${skill.val}, 쿨타임 ${skill.cd}초)`;
  }
  else if (rand < 0.8) {
    const object = Math.random() < 0.5 ? '거신병' : '주시자';
    const stat = object === '거신병' ? battleSettings.izman.towerAtk : battleSettings.izman.servantGold;
    return `주제: 게임 내 ${object} 밸런스 토론. (관련 수치: ${stat})`;
  }
  else {
    return `주제: 방금 겪은 랭크 게임 썰`;
  }
};

// ------------------------------------------------------------------
// 1. 게시글 생성 (오직 외부 AI & 실제 유저만 사용)
// ------------------------------------------------------------------
export async function generatePostAsync(
  uniqueId: number, 
  heroes: Hero[], 
  tierConfig: TierConfig, 
  currentTick: number, 
  aiConfig: AIConfig,
  userPool: any[], 
  battleSettings: BattleSettings,
  fieldSettings: BattlefieldSettings
): Promise<Post | null> {

  // [핵심] AI가 꺼져있거나 유저가 없으면 생성 안함
  if (!aiConfig.apiKey || !aiConfig.enabled) return null;
  if (!userPool || userPool.length === 0) return null;

  // 실제 유저 풀에서 작성자 선정
  let author: any;
  let selectedCategory = "잡담";

  if (Math.random() < 0.2) { 
    // 랭커가 글 쓸 확률
    const rankers = [...userPool].sort((a,b) => b.score - a.score).slice(0, 50);
    author = pick(rankers);
    const rand = Math.random();
    if (rand < 0.4) selectedCategory = '공략';
    else if (rand < 0.7) selectedCategory = '분석';
    else selectedCategory = '자랑';
  } else {
    // 일반 유저
    author = pick(userPool);
    const rand = Math.random();
    if (rand < 0.3) selectedCategory = '징징';
    else if (rand < 0.5) selectedCategory = '유머';
    else if (rand < 0.6) selectedCategory = '질문';
    else selectedCategory = '잡담'; 
  }

  // AI에게 보낼 컨텍스트 생성
  const mostChamp = heroes.find(h => h.id === author.mainHeroId)?.name || '알수없음';
  const currentTierName = author.getTierName(tierConfig);
  const dynamicTopic = getRandomTopicContext(heroes, battleSettings);

  const userContext = `[작성자 정보] 닉네임: ${author.name}, 티어: ${currentTierName}, 주챔피언: ${mostChamp}`;
  const fullContext = `${userContext}\n${dynamicTopic}\n카테고리: ${selectedCategory}\n(JSON만 출력)`;

  // 외부 AI 호출
  const aiResult = await fetchAIPost(aiConfig, fullContext, selectedCategory);

  if (!aiResult) return null;

  let basePotential = 10;
  const tierWeight = getTierWeight(currentTierName);

  if (selectedCategory === '공략') basePotential += tierWeight * 1.5;
  if (selectedCategory === '질문') basePotential += 30; // 질문글은 댓글 유도용

  return {
    id: uniqueId,
    author: author.name, 
    authorTier: currentTierName, // [중요] 실제 유저의 현재 티어 사용
    title: aiResult.title,
    content: aiResult.content,
    category: selectedCategory as any,
    views: 1, upvotes: 0, downvotes: 0, 
    comments: 0, commentList: [],
    createdAt: currentTick,
    potential: Math.min(100, Math.max(10, basePotential)), 
    isBest: false,
    displayTime: "방금 전"
  };
}

// ------------------------------------------------------------------
// 2. 댓글 생성 (오직 외부 AI & 실제 유저만 사용)
// ------------------------------------------------------------------
export async function generateCommentAsync(
  post: Post, 
  aiConfig: AIConfig, 
  userPool: any[], 
  tierConfig: TierConfig
): Promise<Comment | null> {

  // [핵심] AI 미설정시 생성 거부
  if (!aiConfig.apiKey || !aiConfig.enabled) return null;
  if (!userPool || userPool.length === 0) return null;

  // [핵심] 댓글 작성자도 '실제 유저' 중에서 뽑음 (가짜 유저 생성 X)
  const commenter = pick(userPool);

  // [중요] 해당 유저 객체의 메소드를 통해 실시간 티어를 가져옴
  const commenterTier = commenter.getTierName(tierConfig);

  const commentText = await fetchAIComment(aiConfig, post.title, post.content);

  if (!commentText) return null;

  return {
    id: Date.now() + Math.random(), 
    author: commenter.name, 
    authorTier: commenterTier, // 실제 유저의 티어
    content: commentText, 
    timestamp: "방금 전"
  };
}

// ------------------------------------------------------------------
// 3. 인터랙션 업데이트
// ------------------------------------------------------------------
export function updatePostInteractions(posts: Post[], currentTick: number): Post[] {
  return posts.map(post => {
    const age = currentTick - post.createdAt;
    if (age > 1440) return post; 

    const updatedPost = { ...post };

    if (age < 1) updatedPost.displayTime = "방금 전";
    else if (age < 60) updatedPost.displayTime = `${Math.floor(age)}분 전`;
    else updatedPost.displayTime = `${Math.floor(age / 60)}시간 전`;

    let exposure = (post.potential / (age * 1.5 + 20)); 
    if (post.isBest) exposure *= 3.0; 

    let newViews = 0;
    if (Math.random() < exposure) {
        newViews = Math.floor(Math.random() * 8) + 1;
        updatedPost.views += newViews;
    }

    if (newViews > 0) {
        let conversionRate = post.potential / 1500; 
        if (post.upvotes > 5) conversionRate *= 1.2;

        let dislikeRate = 0.001; 
        if (post.category === '징징') dislikeRate = 0.08; 

        for (let i = 0; i < newViews; i++) {
            if (Math.random() < conversionRate) updatedPost.upvotes += 1;
            if (Math.random() < dislikeRate) updatedPost.downvotes += 1;
        }

        // [중요] 댓글 자동 생성 부분 삭제됨. 
        // 댓글은 오직 gameSlice의 비동기 AI 호출을 통해서만 생성됩니다.
    }

    if (updatedPost.downvotes > updatedPost.upvotes * 3) {
        updatedPost.potential = Math.max(0, updatedPost.potential - 10); 
    }

    if (!updatedPost.isBest && updatedPost.upvotes >= 10) {
      updatedPost.isBest = true;
      updatedPost.potential += 60; 
      updatedPost.title = `[념글] ${updatedPost.title}`;
    }

    return updatedPost;
  });
}