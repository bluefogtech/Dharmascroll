import { GoogleGenAI, Type } from "@google/genai";
import { Quote } from "../types";

const QUOTE_SCHEMA = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING },
      text: { type: Type.STRING },
      source: { type: Type.STRING },
      context: { type: Type.STRING },
      sanskrit: { type: Type.STRING },
      themes: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    },
    required: ["id", "text", "source", "themes"]
  }
};

function getAIClient() {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY is not defined. Please add it to your environment variables.");
  }
  return new GoogleGenAI({ apiKey });
}

export async function fetchInitialQuotes(): Promise<Quote[]> {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: "Provide 5 profound and authentic quotes from Indian scriptures (Vedas, Upanishads, Bhagavad Gita, Puranas). Include the Sanskrit original if possible and identifying themes. Return unique IDs.",
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
    console.error("Failed to parse AI response as JSON", text);
    return [];
  }
}

export async function fetchRecommendedQuotes(
  viewedThemes: string[],
  historyIds: string[]
): Promise<Quote[]> {
  const ai = getAIClient();
  const themesStr = viewedThemes.length > 0 ? viewedThemes.join(", ") : "Universal wisdom";
  const prompt = `Provide 3 profound quotes from Indian scriptures. 
  The user is particularly interested in these themes: ${themesStr}. 
  Avoid these IDs already seen: ${historyIds.join(", ")}.
  Include the source and verse info. Sanskrit is preferred too.`;

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
    console.error("Failed to parse recommendation AI response as JSON", text);
    return [];
  }
}