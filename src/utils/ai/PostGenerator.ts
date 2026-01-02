// ==========================================
// FILE PATH: /src/utils/ai/PostGenerator.ts
// ==========================================

import { AIConfig } from '../../types';
import { callAI } from './AIClient';

export async function generateAIPost(config: AIConfig, context: string, category: string): Promise<{title: string, content: string} | null> {
  // AI 설정이 없거나 꺼져있으면 중단
  if (!config.apiKey || !config.enabled) return null;

  // 1. 카테고리 및 문맥에 따른 페르소나(성격) 설정
  let persona = "일반적인 게임 유저";
  let extraInstruction = "";

  // 문맥에 '저격'이 포함되어 있으면 카테고리보다 우선하여 저격러 페르소나 적용
  if (context.includes('저격') || context.includes('SNIPING')) {
    persona = "집요한 저격러. 증거를 대라는 식의 말투나 비꼬는 말투 사용.";
    extraInstruction = "상대 닉네임을 거론하며 공개적으로 망신을 주려는 톤으로 작성해. '대리냐?', '사람이냐?' 같은 공격적인 질문을 던져.";
  } 
  else if (category === '공략' || category === '분석') {
    persona = "논리적이고 분석적인 척하는 '겜잘알' 유저. 수치와 데이터를 언급하길 좋아함.";
    extraInstruction = "마치 자신이 프로게이머인 것처럼 훈수 두는 말투를 사용해. '이건 팩트임', '반박시 니말맞' 같은 표현 사용.";
  } 
  else if (category === '징징') {
    persona = "화가 잔뜩 난 다혈질 유저. 억울함을 호소하거나 운영진/팀원을 탓함.";
    extraInstruction = "거친 어조를 사용하고, '망겜', '억까', '밸런스 꼬라지' 같은 단어를 사용해 분노를 표출해.";
  } 
  else if (category === '유머') {
    persona = "커뮤니티 드립 장인. 짧고 강렬한 '뻘글'이나 '드립'을 잘 침.";
    extraInstruction = "진지한 내용은 빼고, 피식하게 만드는 짧은 문장 위주로 써. 초성체(ㅋㅋㅋㅋ, ㄹㅇㅋㅋ)를 적극 활용해.";
  } 
  else if (category === '질문') {
    persona = "게임을 갓 시작한 뉴비 혹은 모르는게 생긴 유저.";
    extraInstruction = "겸손하게 물어보거나, 혹은 핑프(검색 안하고 물어보는) 컨셉으로 질문해.";
  }
  else {
    persona = "심심한 유저. 의식의 흐름대로 글을 씀.";
    extraInstruction = "일상적인 말투로 작성해. 별 내용 없는 잡담처럼.";
  }

  // 2. AI에게 보낼 시스템 프롬프트 구성
  const systemPrompt = `
    너는 '신들의 전쟁(Gods' War)'이라는 가상의 AOS(MOBA) 게임 커뮤니티(한국의 디시인사이드 롤갤, 펨코, 아카라이브 느낌)의 유저야.
    주어진 [상황 정보]를 바탕으로, [카테고리]에 맞는 **단 하나의 게시글**을 작성해.

    [카테고리]: ${category}
    [작성자 컨셉]: ${persona}
    [글감 및 상황 정보]: ${context}

    [작성 지침]:
    1. **말투**: 한국 인터넷 커뮤니티 말투(음슴체, 반말, 은어, 초성체 'ㅋㅋ', 'ㄹㅇ', 'ㄷㄷ', 'ㄴㄴ')를 자연스럽게 사용해.
    2. **내용**: 
       - 제목은 클릭을 유도하도록 자극적이거나(어그로), 아주 무심하게(쿨찐) 지어.
       - 본문은 1~4문장 내외로 짧게. 너무 길면 안 읽음.
       - ${extraInstruction}
    3. **형식**: 오직 JSON만 출력해. (마크다운 코드블럭 없이).
    
    Example Input: 징징 / 야스오 Q 너프좀
    Example Output: {"title": "아니 야스오 Q 딜 실화냐?", "content": "스치면 반피 나가는게 게임이냐? 운영자 일 안함? ㅡㅡ"}
  `;

  // 3. AI 호출 및 결과 반환
  return await callAI(config, systemPrompt);
}