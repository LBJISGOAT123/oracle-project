import { Hero, TierConfig, Post, Comment, AIConfig, BattleSettings, BattlefieldSettings } from '../../types';
import { fetchAIPost, fetchAIComment } from '../../utils/AIService';
// [중요] 유저 객체 안에 함수가 없으므로, 외부 함수를 가져와서 씁니다.
import { getUserTierName } from './UserManager'; 

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const getTierWeight = (tier: string) => {
  if (tier.includes('천상계') || tier.includes('챌린저')) return 50;
  if (tier.includes('마스터') || tier.includes('에이스')) return 30;
  if (tier.includes('조커') || tier.includes('다이아')) return 20;
  if (tier.includes('골드') || tier.includes('플래티넘')) return 10;
  if (tier.includes('실버')) return 5;
  return 0; 
};

const getRichTopicContext = (heroes: Hero[], userPool: any[], battleSettings: BattleSettings) => {
  const rand = Math.random();

  if (rand < 0.05 && userPool.length > 0) {
    const targetUser = pick(userPool); 
    // 여기서는 단순히 이름만 쓰므로 수정 불필요
    const isHighRank = targetUser.score > 3000;
    const isFeeder = targetUser.winRate < 45;

    let tone = "비난";
    if (isHighRank) tone = "질투/의심";
    else if (isFeeder) tone = "극딜";

    return {
      type: 'SNIPING',
      text: `주제: 유저 '${targetUser.name}' 저격. (점수: ${targetUser.score}). ${tone}하는 내용.`
    };
  } 
  else if (rand < 0.40) {
    const h = pick(heroes);
    return { type: 'BALANCE', text: `주제: ${h.name} 밸런스 토론.` };
  }
  else if (rand < 0.55) {
    return { type: 'SYSTEM', text: `주제: 게임 시스템 불만.` };
  }
  else if (rand < 0.75) {
    return { type: 'NONSENSE', text: `주제: 아무말 대잔치.` };
  }
  else {
    return { type: 'NORMAL', text: `주제: 게임 잡담.` };
  }
};

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

  const author = pick(userPool);
  // [수정] author.getTierName() -> getUserTierName(author, tierConfig)
  const currentTierName = getUserTierName(author, tierConfig); 
  const mostChamp = heroes.find(h => h.id === author.mainHeroId)?.name || '랜덤';

  const contextObj = getRichTopicContext(heroes, userPool, battleSettings);
  let category = "잡담";
  if (contextObj.type === 'SNIPING') category = '징징';
  else if (contextObj.type === 'BALANCE') category = '분석';
  else if (contextObj.type === 'NONSENSE') category = '유머';
  else if (contextObj.type === 'SYSTEM') category = '징징';

  if (Math.random() < 0.1) category = pick(['공략', '질문', '자랑']);

  const userContext = `[작성자 정보] 닉네임: ${author.name}, 티어: ${currentTierName}, 주챔: ${mostChamp}`;
  const fullContext = `${userContext}\n${contextObj.text}\n(카테고리: ${category} 게시판)`;

  const aiResult = await fetchAIPost(aiConfig, fullContext, category);
  if (!aiResult) return null;

  let basePotential = 10;
  if (category === '공략' || category === '분석') basePotential += 20;

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

export async function generateCommentAsync(
  post: Post, 
  aiConfig: AIConfig, 
  userPool: any[], 
  tierConfig: TierConfig
): Promise<Comment | null> {
  if (!aiConfig.apiKey || !aiConfig.enabled) return null;
  if (!userPool || userPool.length === 0) return null;

  const commenter = pick(userPool);
  // [수정] 메서드 호출 -> 함수 호출
  const commenterTier = getUserTierName(commenter, tierConfig); 
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

    if (Math.random() < exposure) {
        updatedPost.views += Math.floor(Math.random() * 5) + 1;
        if (Math.random() < 0.1) updatedPost.upvotes++;
    }

    if (!updatedPost.isBest && updatedPost.upvotes >= 10) {
      updatedPost.isBest = true;
      updatedPost.potential += 50; 
      updatedPost.title = `[념글] ${updatedPost.title}`;
    }
    return updatedPost;
  });
}
