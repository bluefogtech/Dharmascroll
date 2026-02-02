import { createClient, SupabaseClient } from '@supabase/supabase-js';
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
 * Adds a runtime guard so TypeScript knows env vars are non-null here.
 */
function getSupabase(): SupabaseClient {
  if (supabaseInstance) return supabaseInstance;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error(
      "Supabase environment variables are missing. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env file."
    );
  }

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

// NOTE:
// We deliberately *don't* try to rebalance by source anymore.
// We simply take a uniformly random sample from the whole table,
// while respecting the "no repeats in this session" rule using history IDs.

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
 * Extracts the source/book name from a quote (the part before the bullet separator).
 * Handles various formats: "Book • Reference", "Book", etc.
 */
function getSourceKey(quote: Quote): string {
  const raw = quote.source || "Unknown";
  
  // Try splitting by bullet (•) first
  const parts = raw.split("•");
  if (parts.length > 0 && parts[0].trim()) {
    return parts[0].trim();
  }
  
  // If no bullet, try splitting by dash or other separators
  const dashParts = raw.split(" - ");
  if (dashParts.length > 0 && dashParts[0].trim()) {
    return dashParts[0].trim();
  }
  
  // If still nothing, return the whole string trimmed
  return raw.trim() || "Unknown";
}

/**
 * Fetches quotes from each source separately to ensure equal distribution.
 * Fetches ALL quotes (or a very large sample) to ensure we get quotes from all 6 sources,
 * then groups them by source and randomly selects from each group.
 */
async function fetchQuotesBySource(
  supabase: SupabaseClient,
  perSourceLimit: number,
  seenIds: Set<string>
): Promise<Map<string, Quote[]>> {
  // Fetch ALL quotes to ensure we get quotes from all sources
  // Use multiple batches if needed to get all 5085 records
  let allData: any[] = [];
  let offset = 0;
  const batchSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from('quotes')
      .select('*')
      .range(offset, offset + batchSize - 1);

    if (error) {
      console.error("Error fetching quotes batch:", error);
      break;
    }

    if (!data || data.length === 0) {
      hasMore = false;
      break;
    }

    allData = allData.concat(data);
    offset += batchSize;

    // If we got fewer records than requested, we've reached the end
    if (data.length < batchSize) {
      hasMore = false;
    }

    // Safety limit - don't fetch more than 6000 records
    if (allData.length >= 6000) {
      hasMore = false;
    }
  }

  if (allData.length === 0) return new Map();

  console.log(`Fetched ${allData.length} total quotes from database`);

  // Map to Quote objects and filter out seen ones
  const allQuotes = (allData as any[])
    .map(mapRecordToQuote)
    .filter(q => !seenIds.has(q.id));

  // Group by source and randomly select from each
  return groupQuotesBySource(allQuotes, perSourceLimit, seenIds);
}

/**
 * Groups quotes by source and randomly selects from each group.
 */
function groupQuotesBySource(
  quotes: Quote[],
  perSourceLimit: number,
  seenIds: Set<string>
): Map<string, Quote[]> {
  // Group quotes by source (the part before the bullet in the source field)
  const quotesBySource = new Map<string, Quote[]>();
  
  for (const quote of quotes) {
    if (seenIds.has(quote.id)) continue;
    
    const sourceKey = getSourceKey(quote);
    if (!quotesBySource.has(sourceKey)) {
      quotesBySource.set(sourceKey, []);
    }
    quotesBySource.get(sourceKey)!.push(quote);
  }

  // Log what sources we found
  console.log(`Found quotes from ${quotesBySource.size} sources:`, Array.from(quotesBySource.keys()));
  for (const [source, sourceQuotes] of quotesBySource.entries()) {
    console.log(`  ${source}: ${sourceQuotes.length} quotes`);
  }

  // Shuffle quotes within each source group and limit
  const result = new Map<string, Quote[]>();
  for (const [source, sourceQuotes] of quotesBySource.entries()) {
    const shuffled = shuffleArray(sourceQuotes);
    const limited = shuffled.slice(0, perSourceLimit * 3); // Get more than needed
    if (limited.length > 0) {
      result.set(source, limited);
    }
  }

  return result;
}

/**
 * Combines quotes from all sources in equal proportion, then shuffles them.
 */
function combineAndShuffleQuotes(
  sourceQuotes: Map<string, Quote[]>,
  targetCount: number
): Quote[] {
  const sources = Array.from(sourceQuotes.keys());
  if (sources.length === 0) return [];

  // Calculate how many quotes to take from each source
  const perSource = Math.max(1, Math.floor(targetCount / sources.length));
  const result: Quote[] = [];

  // Take equal amounts from each source
  for (const source of sources) {
    const quotes = sourceQuotes.get(source) || [];
    const toTake = Math.min(perSource, quotes.length);
    result.push(...quotes.slice(0, toTake));
  }

  // If we need more quotes, fill from remaining quotes in round-robin fashion
  if (result.length < targetCount) {
    const remaining: Quote[] = [];
    for (const source of sources) {
      const quotes = sourceQuotes.get(source) || [];
      remaining.push(...quotes.slice(perSource));
    }
    
    // Shuffle remaining and add until we reach target
    const shuffledRemaining = shuffleArray(remaining);
    result.push(...shuffledRemaining.slice(0, targetCount - result.length));
  }

  // Final shuffle to mix quotes from different sources
  return shuffleArray(result);
}

/**
 * Fetches an initial set of quotes with equal distribution across all sources.
 * Fetches quotes from each source separately using random ordering,
 * then combines them in equal proportion and shuffles for randomness.
 */
export async function fetchInitialQuotes(): Promise<Quote[]> {
  try {
    const supabase = getSupabase();
    const seenIds = new Set<string>();
    
    // Fetch quotes from each source separately (2-3 per source for initial 10)
    const sourceQuotes = await fetchQuotesBySource(supabase, 3, seenIds);
    
    if (sourceQuotes.size === 0) return [];

    // Combine quotes from all sources in equal proportion and shuffle
    const combined = combineAndShuffleQuotes(sourceQuotes, 10);
    
    // Mark these as seen
    combined.forEach(q => seenIds.add(q.id));
    
    return combined;
  } catch (err: any) {
    console.error("Supabase fetchInitialQuotes failed:", err);
    throw err;
  }
}

/**
 * Fetches additional quotes, ensuring they haven't been seen before in this session.
 * Fetches quotes from each source separately with equal distribution,
 * filtering out already-seen quotes.
 */
export async function fetchRecommendedQuotes(
  weightedThemes: Record<string, number>,
  historyIds: string[]
): Promise<Quote[]> {
  try {
    const supabase = getSupabase();
    const historySet = new Set<string>(historyIds);
    
    // Fetch quotes from each source separately (2-3 per source for 10 total)
    const sourceQuotes = await fetchQuotesBySource(supabase, 3, historySet);
    
    if (sourceQuotes.size === 0) return [];

    // Combine quotes from all sources in equal proportion and shuffle
    const combined = combineAndShuffleQuotes(sourceQuotes, 10);
    
    if (combined.length === 0) {
      // Nothing new left; return empty and let caller handle it
      return [];
    }

    return combined;
  } catch (err: any) {
    console.error("Supabase fetchRecommendedQuotes failed:", err);
    return [];
  }
}