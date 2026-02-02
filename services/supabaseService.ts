import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.47.10';
import { Quote } from "../types";

// Hardcoded configuration as per user request to ensure reliability
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabaseInstance: SupabaseClient | null = null;

/**
 * Checks if Supabase is configured correctly.
 */
export function isSupabaseConfigured(): boolean {
  return !!SUPABASE_URL && !!SUPABASE_KEY;
}

/**
 * Lazily initializes and returns the Supabase client.
 */
function getSupabase(): SupabaseClient {
  if (supabaseInstance) return supabaseInstance;
  try {
    supabaseInstance = createClient(SUPABASE_URL, SUPABASE_KEY);
    return supabaseInstance;
  } catch (err: any) {
    throw new Error(`Supabase Client Initialization Failed: ${err.message}`);
  }
}

/**
 * Shuffles an array in place using Fisher-Yates algorithm.
 */
function shuffleArray<T>(array: T[]): T[] {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

/**
 * Maps a database record to the Quote type.
 * Ensures 'book' and 'reference' are combined for full visibility.
 */
function mapRecordToQuote(record: any): Quote {
  const book = record.book || record.source || '';
  const ref = record.reference || record.quote_reference || '';
  
  // Combine book and reference into a single descriptive source string
  const combinedSource = [book, ref].filter(Boolean).join(' • ');

  return {
    id: record.id?.toString() || Math.random().toString(36).substr(2, 9),
    text: record.english || record.text || record.quote_text || '',
    hindi: record.hindi || '',
    tamil: record.tamil || '',
    source: combinedSource || 'Indian Scripture',
    context: record.context || '', 
    themes: Array.isArray(record.tags) 
      ? record.tags 
      : (typeof record.tags === 'string' 
          ? record.tags.split(',').map((s: string) => s.trim()) 
          : (record.themes || [])),
    sanskrit: record.sanskrit || record.verse || ''
  };
}

/**
 * Fetches an initial set of quotes with robust randomization.
 */
export async function fetchInitialQuotes(): Promise<Quote[]> {
  try {
    const supabase = getSupabase();
    // Fetch a large pool (up to 400) and shuffle on the client for true session randomness
    const { data, error } = await supabase
      .from('quotes')
      .select('*')
      .limit(400);

    if (error) throw error;
    if (!data || data.length === 0) return [];

    const quotes: Quote[] = (data as any[]).map(mapRecordToQuote);
    // Fisher-Yates shuffle the pool and take the first 10
    return shuffleArray(quotes).slice(0, 10);
  } catch (err: any) {
    console.error("Supabase fetchInitialQuotes failed:", err);
    throw err;
  }
}

/**
 * Fetches additional quotes, ensuring they haven't been seen before in this session.
 */
export async function fetchRecommendedQuotes(
  weightedThemes: Record<string, number>,
  historyIds: string[]
): Promise<Quote[]> {
  try {
    const supabase = getSupabase();
    // Fetch a larger pool to find unseen items
    const { data, error } = await supabase
      .from('quotes')
      .select('*')
      .limit(500);

    if (error) throw error;
    if (!data) return [];

    // Filter out IDs that have already been presented to the user
    const unseenQuotes: Quote[] = (data as any[])
      .filter((r: any) => !historyIds.includes(r.id?.toString()))
      .map(mapRecordToQuote);

    // If we've run out of truly unseen, just return more shuffled ones from the data
    const poolToUse = unseenQuotes.length > 0 ? unseenQuotes : (data as any[]).map(mapRecordToQuote);

    // Shuffle unseen pool and take 10 new random ones
    return shuffleArray(poolToUse).slice(0, 10);
  } catch (err: any) {
    console.error("Supabase fetchRecommendedQuotes failed:", err);
    return [];
  }
}