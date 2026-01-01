import { AIConfig } from '../../types';

// 공통 JSON 응답용
export async function callAI(config: AIConfig, prompt: string) {
  try {
    if (config.provider === 'GEMINI') {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${config.apiKey}`;
      const response = await fetch(url, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error.message);
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      const jsonStr = text.replace(/```json|```/g, "").trim();
      return JSON.parse(jsonStr);
    }

    if (config.provider === 'OPENAI') {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${config.apiKey}` },
        body: JSON.stringify({
          model: config.model,
          messages: [{ role: "system", content: "Reply in JSON only." }, { role: "user", content: prompt }],
          temperature: 0.9,
        })
      });
      const data = await response.json();
      return JSON.parse(data.choices[0].message.content);
    }
  } catch (e) {
    console.error("AI Error:", e);
    return null;
  }
  return null;
}

// 공통 텍스트 응답용
export async function callAIString(config: AIConfig, prompt: string) {
  try {
    if (config.provider === 'GEMINI') {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${config.apiKey}`;
      const response = await fetch(url, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text.trim();
    } 

    if (config.provider === 'OPENAI') {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${config.apiKey}` },
        body: JSON.stringify({
          model: config.model,
          messages: [
            { role: "system", content: "You are a user of a Korean gaming community." }, 
            { role: "user", content: prompt }
          ],
          temperature: 1.0,
          max_tokens: 100
        })
      });
      const data = await response.json();
      return data.choices[0].message.content.trim();
    }
  } catch (e) { return null; }
  return null;
}