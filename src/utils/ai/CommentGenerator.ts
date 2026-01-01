import { AIConfig } from '../../types';
import { callAIString } from './AIClient';

const FALLBACK_COMMENTS = ["ㅋㅋㅋㅋ", "ㄹㅇㅋㅋ", "개웃기네", "???", "ㄴㄴ 아님"];
const pickRandom = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

export async function generateAIComment(config: AIConfig, postTitle: string, postContent: string): Promise<string | null> {
  if (!config.apiKey || !config.enabled) return pickRandom(FALLBACK_COMMENTS);

  const personas = [
    { type: "팩트폭격기", desc: "글 내용의 모순을 찾아내서 논리적으로 반박함. 티어 부심이 심함." },
    { type: "공감러", desc: "글쓴이의 상황에 깊이 공감하며 같이 욕해줌." },
    { type: "비꼬기 장인", desc: "직접적인 욕설 없이 돌려서 까거나, '그래서 티어가?' 시전." },
    { type: "단답형 쿨찐", desc: "아주 짧게 한마디 툭 던짐. 초성체(ㄹㅇㅋㅋ, ㄴㄴ, ㄷㄷ) 애용." },
    { type: "드립충", desc: "상황에 맞는 드립을 침." }
  ];

  const selected = personas[Math.floor(Math.random() * personas.length)];

  const systemPrompt = `
    너는 게임 커뮤니티 댓글 작성자야. 
    [게시글]을 보고 [컨셉]에 맞춰 **아주 짧은 댓글 하나**를 써.

    [게시글 제목]: ${postTitle}
    [게시글 내용]: ${postContent}
    [너의 컨셉]: ${selected.type} (${selected.desc})

    [규칙]:
    1. 무조건 반말/음슴체.
    2. 길이는 5~20자 이내. (길면 안 읽음)
    3. JSON 금지. 텍스트만 출력.
    4. "니가 못해서 그래" 금지. 창의적으로 써.
  `;

  try {
    const aiResponse = await callAIString(config, systemPrompt);
    return aiResponse || pickRandom(FALLBACK_COMMENTS);
  } catch (e) {
    return pickRandom(FALLBACK_COMMENTS);
  }
}