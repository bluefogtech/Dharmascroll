
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
