// ==========================================
// FILE PATH: /src/utils/AIService.ts
// ==========================================

import { generateAIPost } from './ai/PostGenerator';
import { generateAIComment } from './ai/CommentGenerator';

// 기존 코드와의 호환성을 위해 함수 이름을 유지하며 연결합니다.
export const fetchAIPost = generateAIPost;
export const fetchAIComment = generateAIComment;