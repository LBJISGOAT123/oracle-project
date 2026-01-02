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

// [핵심] 다양한 주제를 생성하는 함수
const getRichTopicContext = (heroes: Hero[], userPool: any[], battleSettings: BattleSettings) => {
  const rand = Math.random();

  // 1. 유저 저격 (5%) - 징징/잡담 카테고리
  if (rand < 0.05 && userPool.length > 0) {
    // 성적이 안 좋은 유저나, 랭킹이 높은 유저를 타겟팅
    const targetUser = pick(userPool); 
    const isHighRank = targetUser.score > 3000;
    const isFeeder = targetUser.winRate < 45;
    
    let tone = "비난";
    if (isHighRank) tone = "질투/의심 (대리, 버스 의심)";
    else if (isFeeder) tone = "극딜 (트롤 박제)";
    
    return {
      type: 'SNIPING',
      text: `주제: 유저 '${targetUser.name}' 저격. (티어: ${targetUser.getTierName()}). ${tone}하는 내용.`
    };
  } 
  
  // 2. 밸런스 토론 - 특정 영웅/스킬 (25%) - 분석/공략/징징
  else if (rand < 0.40) {
    const h = pick(heroes);
    const skillKeys = ['q', 'w', 'e', 'r'] as const;
    const skill = h.skills[pick(skillKeys)];
    return {
      type: 'BALANCE',
      text: `주제: ${h.name}의 ${skill.name} 스킬이 너무 ${h.recentWinRate > 52 ? '사기(OP)' : '쓰레기'}라는 내용. (승률: ${h.recentWinRate.toFixed(1)}%)`
    };
  }

  // 3. 아이템/시스템 불만 (15%) - 징징/분석
  else if (rand < 0.55) {
    const topic = Math.random() < 0.5 ? '매칭 시스템' : '특정 아이템';
    return {
      type: 'SYSTEM',
      text: `주제: 이 게임의 ${topic}이 엉망이라는 불만 토로. (억까, 팀운, 버그 등)`
    };
  }

  // 4. 개드립/뻘글 (20%) - 유머/잡담
  else if (rand < 0.75) {
    const keywords = ["라면", "여자친구", "군대", "시험", "치킨", "제로투"];
    return {
      type: 'NONSENSE',
      text: `주제: 게임과 관련 없는 ${pick(keywords)} 이야기 또는 웃긴 드립. 짧고 굵게.`
    };
  }

  // 5. 일반적인 게임 이야기 (25%)
  else {
    return {
      type: 'NORMAL',
      text: `주제: 방금 한 게임 썰, 티어 올리는 팁, 혹은 그냥 심심하다는 잡담.`
    };
  }
};

// ------------------------------------------------------------------
// 1. 게시글 생성
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

  if (!aiConfig.apiKey || !aiConfig.enabled) return null;
  if (!userPool || userPool.length === 0) return null;

  // 작성자 선정
  const author = pick(userPool);
  const currentTierName = author.getTierName(tierConfig);
  const mostChamp = heroes.find(h => h.id === author.mainHeroId)?.name || '랜덤';

  // [수정] 풍부한 주제 가져오기
  const contextObj = getRichTopicContext(heroes, userPool, battleSettings);
  
  // 주제에 맞는 카테고리 자동 매핑
  let category = "잡담";
  if (contextObj.type === 'SNIPING') category = Math.random() < 0.5 ? '징징' : '잡담';
  else if (contextObj.type === 'BALANCE') category = Math.random() < 0.4 ? '분석' : '징징';
  else if (contextObj.type === 'NONSENSE') category = Math.random() < 0.6 ? '유머' : '잡담';
  else if (contextObj.type === 'SYSTEM') category = '징징';
  
  // 가끔 카테고리 꼬기 (뻘글인데 공략탭에 쓰는 등 리얼함 추가)
  if (Math.random() < 0.1) category = pick(['공략', '질문', '자랑']);

  const userContext = `[작성자 정보] 닉네임: ${author.name}, 티어: ${currentTierName}, 주챔: ${mostChamp}`;
  const fullContext = `${userContext}\n${contextObj.text}\n(카테고리: ${category} 게시판)`;

  // AI 호출
  const aiResult = await fetchAIPost(aiConfig, fullContext, category);

  if (!aiResult) return null;

  let basePotential = 10;
  const tierWeight = getTierWeight(currentTierName);

  if (category === '공략' || category === '분석') basePotential += 20;
  if (category === '유머' || contextObj.type === 'SNIPING') basePotential += 30; // 저격/유머글은 어그로가 잘 끌림

  return {
    id: uniqueId,
    author: author.name, 
    authorTier: currentTierName,
    title: aiResult.title,
    content: aiResult.content,
    category: category as any,
    views: 1, upvotes: 0, downvotes: 0, 
    comments: 0, commentList: [],
    createdAt: currentTick,
    potential: Math.min(100, Math.max(10, basePotential)), 
    isBest: false,
    displayTime: "방금 전"
  };
}

// ... (나머지 generateCommentAsync, updatePostInteractions 함수는 기존 유지)
// generateCommentAsync와 updatePostInteractions 코드가 없다면 
// 이전 답변의 코드를 참고하여 아래에 붙여넣으세요.
export async function generateCommentAsync(
  post: Post, 
  aiConfig: AIConfig, 
  userPool: any[], 
  tierConfig: TierConfig
): Promise<Comment | null> {
  if (!aiConfig.apiKey || !aiConfig.enabled) return null;
  if (!userPool || userPool.length === 0) return null;

  const commenter = pick(userPool);
  const commenterTier = commenter.getTierName(tierConfig);
  const commentText = await fetchAIComment(aiConfig, post.title, post.content);

  if (!commentText) return null;

  return {
    id: Date.now() + Math.random(), 
    author: commenter.name, 
    authorTier: commenterTier,
    content: commentText, 
    timestamp: "방금 전"
  };
}

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