
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

function getAIClient() {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY is not defined.");
  }
  return new GoogleGenAI({ apiKey });
}

export async function fetchInitialQuotes(): Promise<Quote[]> {
  const ai = getAIClient();
  const seed = Math.floor(Math.random() * 10000);
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Seed: ${seed}. Provide 5 RANDOM, profound, and highly diverse quotes from different Indian scriptures (Vedas, Upanishads, Bhagavad Gita, Yoga Vasistha, Puranas). Ensure they cover different aspects of life (Action, Knowledge, Peace, Devotion, Meditation). Return in JSON format with unique IDs. Include the original Sanskrit, a high-quality English translation, and a high-quality Hindi translation.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: QUOTE_SCHEMA
    }
  });

  const text = response.text;
  if (!text) return [];
  try {
    return JSON.parse(text.trim());
  } catch (e) {
    console.error("Failed to parse initial quotes", e);
    return [];
  }
}

export async function fetchRecommendedQuotes(
  weightedThemes: Record<string, number>,
  historyIds: string[]
): Promise<Quote[]> {
  const ai = getAIClient();
  
  const topThemes = Object.entries(weightedThemes)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([theme]) => theme);

  const themesContext = topThemes.length > 0 
    ? `The user has shown significant interest (dwell time) in these themes: ${topThemes.join(", ")}.` 
    : "Provide a diverse mix of profound spiritual wisdom.";

  const prompt = `Provide 3 profound quotes from Indian scriptures. 
  ${themesContext}
  Randomness factor: ${Date.now()}.
  Avoid duplicate content. Do not use these IDs: ${historyIds.slice(-20).join(", ")}.
  Include original Sanskrit, English translation, Hindi translation, and identifying themes. Return JSON.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: QUOTE_SCHEMA
    }
  });

  const text = response.text;
  if (!text) return [];
  try {
    return JSON.parse(text.trim());
  } catch (e) {
    console.error("Failed to parse recommendations", e);
    return [];
  }
}
