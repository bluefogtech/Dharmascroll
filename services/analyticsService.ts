import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabaseInstance: SupabaseClient | null = null;

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
 * Track user activity events for analytics
 */
export async function trackEvent(
  userId: string,
  eventType: 'login' | 'logout' | 'registration',
  metadata?: Record<string, any>
): Promise<void> {
  try {
    const supabase = getSupabase();

    // Try to insert into analytics table
    // If table doesn't exist, we'll create it via SQL or handle gracefully
    const { error } = await supabase
      .from('user_analytics')
      .insert({
        user_id: userId,
        event_type: eventType,
        event_metadata: metadata || {},
        created_at: new Date().toISOString(),
        timestamp: new Date().toISOString(),
      });

    if (error) {
      // If table doesn't exist, log but don't throw
      if (error.code === '42P01' || error.message.includes('does not exist')) {
        console.warn('Analytics table does not exist. Please create it in Supabase:', {
          table: 'user_analytics',
          columns: {
            id: 'uuid (primary key, default: uuid_generate_v4())',
            user_id: 'uuid (references auth.users)',
            event_type: 'text',
            event_metadata: 'jsonb',
            created_at: 'timestamp with time zone (default: now())',
            timestamp: 'timestamp with time zone',
          },
        });
      } else {
        console.error('Error tracking analytics event:', error);
      }
    }
  } catch (err) {
    // Don't throw - analytics failures shouldn't break the app
    console.error('Failed to track analytics event:', err);
  }
}

/**
 * SQL to create the analytics table in Supabase:
 * 
 * CREATE TABLE IF NOT EXISTS user_analytics (
 *   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
 *   user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
 *   event_type TEXT NOT NULL,
 *   event_metadata JSONB DEFAULT '{}',
 *   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
 *   timestamp TIMESTAMP WITH TIME ZONE NOT NULL
 * );
 * 
 * CREATE INDEX IF NOT EXISTS idx_user_analytics_user_id ON user_analytics(user_id);
 * CREATE INDEX IF NOT EXISTS idx_user_analytics_event_type ON user_analytics(event_type);
 * CREATE INDEX IF NOT EXISTS idx_user_analytics_timestamp ON user_analytics(timestamp);
 * 
 * -- Enable RLS (Row Level Security)
 * ALTER TABLE user_analytics ENABLE ROW LEVEL SECURITY;
 * 
 * -- Policy: Users can only see their own analytics
 * CREATE POLICY "Users can view own analytics" ON user_analytics
 *   FOR SELECT USING (auth.uid() = user_id);
 * 
 * -- Policy: Service role can insert (for client-side tracking)
 * CREATE POLICY "Service can insert analytics" ON user_analytics
 *   FOR INSERT WITH CHECK (true);
 */
