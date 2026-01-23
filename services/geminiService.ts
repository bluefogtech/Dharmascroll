
import { GoogleGenAI, Type } from "@google/genai";
import { Quote } from "../types";

const QUOTE_SCHEMA = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING },
      text: { type: Type.STRING },
      hindi: { type: Type.STRING },
      source: { type: Type.STRING },
      context: { type: Type.STRING },
      sanskrit: { type: Type.STRING },
      themes: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    },
    required: ["id", "text", "hindi", "source", "themes"]
  }
};

const SYSTEM_INSTRUCTION = "You are a specialized API that provides profound spiritual quotes from Indian scriptures (Vedas, Upanishads, Bhagavad Gita). Return ONLY valid JSON matching the provided schema. Always include Sanskrit, high-quality English, and high-quality Hindi translations. Ensure quotes are diverse and short.";

function getAIClient() {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY is not defined.");
  }
  return new GoogleGenAI({ apiKey });
}

export async function fetchInitialQuotes(): Promise<Quote[]> {
  const ai = getAIClient();
  const seed = Math.floor(Math.random() * 100000);
  
  // Fetching only 2 quotes for near-instant first load
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Batch: 1. Random Seed: ${seed}. Return 2 highly diverse quotes.`,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: QUOTE_SCHEMA,
      thinkingConfig: { thinkingBudget: 0 } // Dramatically reduces latency
    }
  });

  const text = response.text;
  if (!text) return [];
  try {
    return JSON.parse(text.trim());
  } catch (e) {
    console.error("Initial fetch parse error", e);
    return [];
  }
}

export async function fetchRecommendedQuotes(
  weightedThemes: Record<string, number>,
  historyIds: string[],
  count: number = 5
): Promise<Quote[]> {
  const ai = getAIClient();
  
  const topThemes = Object.entries(weightedThemes)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 2)
    .map(([theme]) => theme);

  const prompt = `Return ${count} quotes. ${topThemes.length ? 'Focus on: ' + topThemes.join(', ') : 'Random variety'}. Exclude: ${historyIds.slice(-20).join(',')}.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: QUOTE_SCHEMA,
      thinkingConfig: { thinkingBudget: 0 }
    }
  });

  const text = response.text;
  if (!text) return [];
  try {
    return JSON.parse(text.trim());
  } catch (e) {
    console.error("Recommended fetch parse error", e);
    return [];
  }
}
