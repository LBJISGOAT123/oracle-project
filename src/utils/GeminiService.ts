// src/utils/GeminiService.ts

// [중요] Google AI Studio API Key 필요
const API_KEY = ""; 
const MODEL_VERSION = "gemini-2.5-flash"; // or gemini-2.0-flash-exp

export async function fetchGeminiPost(context: string, topic: string): Promise<{title: string, content: string} | null> {
  if (!API_KEY) {
    console.warn("Gemini API Key Missing");
    return null;
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_VERSION}:generateContent?key=${API_KEY}`;
    
    // [프롬프트 엔지니어링]
    // AI에게 구체적인 페르소나와 상황을 부여하여 글의 퀄리티를 높임
    const prompt = `
      너는 '신들의 전쟁(Gods' War)'이라는 AOS(MOBA) 게임 커뮤니티의 유저야.
      지금부터 아래 주어진 [상황]과 [주제]에 맞춰서 커뮤니티 게시글을 작성해.
      
      [주제]: ${topic}
      [현재 게임 메타 상황]:
      ${context}

      [작성 지침]:
      1. 말투: 디시인사이드, 펨코, 아카라이브 등 한국 게임 커뮤니티 말투를 사용해. (반말, 은어 사용 가능)
      2. 내용: 무조건적인 욕설이나 비난만 하지 마.
         - '분석' 주제라면 진지하게 스탯이나 아이템 트리를 논해.
         - '질문' 주제라면 뉴비처럼 모르는 걸 물어봐.
         - '유머' 주제라면 게임 상황을 비꼬거나 드립을 쳐.
      3. 길이: 제목은 임팩트 있게 한 줄, 내용은 2~3문장 정도로 짧고 굵게.
      
      [출력 형식 (JSON)]:
      반드시 마크다운 없이 순수 JSON만 출력해.
      {
        "title": "게시글 제목",
        "content": "게시글 본문 내용"
      }
    `;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;
    
    const jsonStr = text.replace(/```json|```/g, "").trim();
    return JSON.parse(jsonStr);

  } catch (e) {
    console.error("Gemini Post Error:", e);
    return null;
  }
}

export async function fetchGeminiComment(postContent: string): Promise<string | null> {
  if (!API_KEY) return null;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_VERSION}:generateContent?key=${API_KEY}`;
    
    const prompt = `
      AOS 게임 커뮤니티 글에 달릴 댓글 하나를 작성해.
      글 내용: "${postContent}"
      
      지침:
      - 글 내용에 동조하거나, 반박하거나, 비꼬는 등 리얼한 반응을 보여줘.
      - "ㅋㅋㅋㅋ" 같은 초성체나 은어를 적절히 섞어.
      - 설명 없이 댓글 내용 텍스트만 출력해.
    `;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text.trim();
  } catch (e) {
    return null;
  }
}