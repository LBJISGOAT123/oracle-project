// src/utils/OpenAIService.ts

// 1. 여기에 OpenAI API 키를 넣으면 진짜 AI가 작동합니다. (없으면 가짜 AI 작동)
const API_KEY = ""; // 예: "sk-proj-..."

export async function fetchAIPost(context: string): Promise<{title: string, content: string} | null> {
  if (!API_KEY) return null; // 키 없으면 null 반환 -> 템플릿 엔진 사용

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo", // or gpt-4
        messages: [
          { role: "system", content: "너는 '신들의 전쟁'이라는 AOS 게임의 악질 유저야. 디시인사이드나 펨코 말투로 짧고 간결하게 글을 써. 반말을 사용해." },
          { role: "user", content: `다음 상황을 보고 게시글 제목과 내용을 JSON 형식으로 만들어줘: ${context}` }
        ],
        temperature: 0.8,
      })
    });

    const data = await response.json();
    const content = data.choices[0].message.content;
    // JSON 파싱 시도 (AI가 텍스트로 줄 수도 있으므로)
    try {
      return JSON.parse(content);
    } catch {
      return { title: "AI 글작성 오류", content: content };
    }
  } catch (e) {
    console.error("AI API Error:", e);
    return null;
  }
}

export async function fetchAIComment(postContent: string): Promise<string | null> {
  if (!API_KEY) return null;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "너는 AOS 게임 커뮤니티 유저야. 거칠고 짧은 말투로 댓글을 달아." },
          { role: "user", content: `다음 글에 달릴 댓글 하나만 써줘: "${postContent}"` }
        ],
        max_tokens: 50
      })
    });
    const data = await response.json();
    return data.choices[0].message.content;
  } catch (e) {
    return null;
  }
}