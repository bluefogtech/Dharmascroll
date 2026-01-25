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
  const randomSeed = Math.floor(Math.random() * 2147483647);
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Pick 3 RANDOM and highly diverse profound quotes from different Indian scriptures (Vedas, Upanishads, Puranas, Gita, or Yoga Vasistha). Ensure they are not always from the same book. Today's unique entropy: ${randomSeed}. Provide unique IDs, original Sanskrit, English translation, and Hindi translation. Output JSON only.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: QUOTE_SCHEMA,
      temperature: 1.0,
      seed: randomSeed,
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

  const randomSeed = Math.floor(Math.random() * 2147483647);

  const prompt = `Return 6 quotes. ${themesContext} Unique IDs. Strictly avoid these specific IDs: ${historyIds.slice(-40).join(",")}. Include Sanskrit, English, Hindi translations. JSON only. Entropy: ${randomSeed}`;

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
  if (!text) return [];
  try {
    return JSON.parse(text.trim());
  } catch (e) {
    console.error("Failed to parse recommendations", e);
    return [];
  }
}

export async function generateSpeech(text: string): Promise<string | undefined> {
  const ai = getAIClient();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Zephyr' },
          },
        },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  } catch (error) {
    console.error("TTS generation failed:", error);
    return undefined;
  }
}