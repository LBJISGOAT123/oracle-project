import { AIConfig } from '../../types';
import { callAI } from './AIClient';

export async function generateAIPost(config: AIConfig, context: string, category: string): Promise<{title: string, content: string} | null> {
  if (!config.apiKey || !config.enabled) return null;

  let persona = "";
  if (category === '공략' || category === '분석') persona = "논리적이고 분석적인 척하는 겜잘알 유저";
  else if (category === '징징' || category === '잡담') persona = "감정적이고 과격한 커뮤니티 유저 (욕설 필터링 없음)";
  else persona = "유머러스하고 드립을 좋아하는 유저";

  const systemPrompt = `
    너는 '신들의 전쟁(Gods' War)'이라는 가상의 AOS 게임 커뮤니티(롤갤, 펨코 느낌) 유저야.
    주어진 [상황 정보]를 바탕으로, [카테고리]에 맞는 **단 하나의 게시글**을 작성해.

    [카테고리]: ${category}
    [작성자 성격]: ${persona}
    [글감 및 상황 정보]: ${context}

    [작성 지침]:
    1. **절대로** 모든 글을 "밸런스 망겜"이나 "운영진 욕"으로 끝내지 마. 주제에 집중해.
    2. 말투: 한국 커뮤니티 말투(반말, 음슴체, 은어, 초성체, 욕설)를 리얼하게 사용해.
    3. 내용: 제목은 어그로 끌리게, 본문은 1~3문장으로 짧게.
    4. 형식: 오직 JSON만 출력해. (마크다운 없이).
    Example: {"title": "야말 템트리 이거 맞냐?", "content": "선템으로 몰왕 갔는데 딜 안 박힘 ㅡㅡ"}
  `;

  return await callAI(config, systemPrompt);
}