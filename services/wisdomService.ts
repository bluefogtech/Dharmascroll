
import { Quote } from "../types";
import * as supabaseService from "./supabaseService";

/**
 * DharmaScroll Wisdom Service - Supabase Exclusive
 * 
 * This service fetches scripture content exclusively from your Supabase instance.
 * Configuration must be provided via the .env file.
 */

export async function getQuotes(isInitial = true, context?: { weights: Record<string, number>, history: string[] }): Promise<Quote[]> {
  const supabaseReady = supabaseService.isSupabaseConfigured();

  if (!supabaseReady) {
    throw new Error(
      "Configuration Required: The Supabase URL or Anon Key is missing. Please provide valid credentials in your .env file to load scripture wisdom."
    );
  }

  try {
    console.log("DharmaScroll: Fetching from Supabase...");
    const quotes = isInitial 
      ? await supabaseService.fetchInitialQuotes() 
      : await supabaseService.fetchRecommendedQuotes(context!.weights, context!.history);
      
    if (!quotes || quotes.length === 0) {
      throw new Error("Wisdom Vault is Empty: Successfully connected to Supabase, but the 'quotes' table returned no results.");
    }
    
    return quotes;
  } catch (err: any) {
    console.error("Supabase Operation Failed:", err);
    const message = err.message || "Unable to connect to the wisdom database.";
    throw new Error(message);
  }
}

/**
 * Fetches Bhagavad Gita quotes from the dedicated Supabase table.
 * Returns all verses in canonical order (chapter, verse) so they can be
 * displayed sequentially in the UI. This does NOT affect the existing
 * quotes page logic.
 */
export async function getGitaQuotes(): Promise<Quote[]> {
  const supabaseReady = supabaseService.isSupabaseConfigured();

  if (!supabaseReady) {
    throw new Error(
      "Configuration Required: The Supabase URL or Anon Key is missing. Please provide valid credentials in your .env file to load Bhagavad Gita verses."
    );
  }

  try {
    console.log("DharmaScroll: Fetching Bhagavad Gita verses from Supabase...");
    const quotes = await supabaseService.fetchBhagavadGitaVerses();

    if (!quotes || quotes.length === 0) {
      throw new Error("Bhagavad Gita table is empty: Connected to Supabase, but 'bhagavad_gita_verses_ai_gen_gpt5_4' returned no results.");
    }

    return quotes;
  } catch (err: any) {
    console.error("Supabase getGitaQuotes failed:", err);
    const message = err.message || "Unable to connect to the Bhagavad Gita table.";
    throw new Error(message);
  }
}
