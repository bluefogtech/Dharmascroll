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
  // Fetching 3 instead of 5 for much faster initial response
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Seed: ${seed}. Return 3 RANDOM, profound quotes from Indian scriptures (Gita, Upanishads, etc). JSON only. Sanskrit, English, Hindi translations. ID must be unique.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: QUOTE_SCHEMA,
      // Disable thinking for lowest latency on simple text tasks
      thinkingConfig: { thinkingBudget: 0 }
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
    .slice(0, 3)
    .map(([theme]) => theme);

  const themesContext = topThemes.length > 0 
    ? `User interests: ${topThemes.join(", ")}.` 
    : "Diverse spiritual wisdom.";

  // Fetching 6 quotes in the background to build a larger buffer
  const prompt = `Return 6 quotes. ${themesContext} Unique IDs. No duplicates from: ${historyIds.slice(-30).join(",")}. Sanskrit, English, Hindi translations. JSON only.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
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
    console.error("Failed to parse recommendations", e);
    return [];
  }
}