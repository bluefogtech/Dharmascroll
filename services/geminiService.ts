
import { GoogleGenAI, Type } from "@google/genai";
import { Quote } from "../types";

// Always initialize with named parameter and direct process.env.API_KEY access
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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

export async function fetchInitialQuotes(): Promise<Quote[]> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: "Provide 5 profound and authentic quotes from Indian scriptures (Vedas, Upanishads, Bhagavad Gita, Puranas). Include the Sanskrit original if possible and identifying themes. Return unique IDs.",
    config: {
      responseMimeType: "application/json",
      responseSchema: QUOTE_SCHEMA
    }
  });

  // Extract text property directly as per guidelines (not a method call)
  const text = response.text;
  return text ? JSON.parse(text.trim()) : [];
}

export async function fetchRecommendedQuotes(
  viewedThemes: string[],
  historyIds: string[]
): Promise<Quote[]> {
  const prompt = `Provide 3 profound quotes from Indian scriptures. 
  The user is particularly interested in these themes: ${viewedThemes.join(", ")}. 
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

  // Extract text property directly as per guidelines (not a method call)
  const text = response.text;
  return text ? JSON.parse(text.trim()) : [];
}
