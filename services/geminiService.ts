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
    throw new Error("API_KEY is not defined in the environment.");
  }
  return new GoogleGenAI({ apiKey });
}

/**
 * Executes a function with exponential backoff.
 */
async function withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 2500): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const errorMsg = error?.message || "";
    const isQuota = errorMsg.includes('429') || 
                    errorMsg.toLowerCase().includes('quota') || 
                    errorMsg.toLowerCase().includes('limit') ||
                    errorMsg.toLowerCase().includes('exhausted');

    if (isQuota && retries > 0) {
      console.warn(`DharmaScroll: Quota hit. Background retry in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

export async function fetchInitialQuotes(): Promise<Quote[]> {
  const ai = getAIClient();
  const randomSeed = Math.floor(Math.random() * 1000000);
  const themes = ["Peace", "Action", "Duty", "Knowledge", "Love", "Surrender", "Meditation", "Truth"];
  const randomTheme = themes[Math.floor(Math.random() * themes.length)];
  
  return withRetry(async () => {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `List 3 spiritual quotes from Indian scriptures (Gita, Vedas, Upanishads) about "${randomTheme}". Include Sanskrit, English, Hindi. JSON format.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: QUOTE_SCHEMA,
        temperature: 1.0,
        seed: randomSeed,
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    const text = response.text;
    return text ? JSON.parse(text.trim()) : [];
  });
}

export async function fetchRecommendedQuotes(
  weightedThemes: Record<string, number>,
  historyIds: string[]
): Promise<Quote[]> {
  const ai = getAIClient();
  const topThemes = Object.entries(weightedThemes)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 2)
    .map(([theme]) => theme);

  const themesContext = topThemes.length > 0 
    ? `Focus: ${topThemes.join(", ")}.` 
    : "Diverse wisdom.";

  const randomSeed = Math.floor(Math.random() * 1000000);

  return withRetry(async () => {
    const prompt = `Provide 10 unique spiritual quotes from Indian scriptures. ${themesContext} Skip these IDs: ${historyIds.slice(-40).join(",")}. Include Sanskrit, English, Hindi. JSON format. Seed: ${randomSeed}`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: QUOTE_SCHEMA,
        temperature: 0.9,
        seed: randomSeed,
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    const text = response.text;
    return text ? JSON.parse(text.trim()) : [];
  });
}