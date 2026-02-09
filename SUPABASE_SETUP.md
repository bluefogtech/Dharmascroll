# Supabase Setup for Authentication and Analytics

## Fix: "Error 400: redirect_uri_mismatch" (Google Sign-In)

This happens when the redirect URI in **Google Cloud Console** doesn’t match Supabase’s callback URL.

**Do this:**

1. **Get your Supabase project URL**  
   From Supabase: **Project Settings → API** → copy the "Project URL" (e.g. `https://abcdefgh.supabase.co`).  
   Or use the same base URL as in your `.env`: `NEXT_PUBLIC_SUPABASE_URL`.

2. **Build the exact redirect URI**  
   It must be exactly:
   ```text
   https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
   ```
   - Use **https** (not http).
   - No trailing slash.
   - Replace `YOUR_PROJECT_REF` with your project ref from the Supabase URL (e.g. if URL is `https://xyzabc.supabase.co`, use `https://xyzabc.supabase.co/auth/v1/callback`).

3. **Add it in Google Cloud Console**  
   - Open [Google Cloud Console](https://console.cloud.google.com/) → your project.  
   - Go to **APIs & Services** → **Credentials**.  
   - Open your **OAuth 2.0 Client ID** (Web application).  
   - Under **Authorized redirect URIs**, click **Add URI** and paste:
     ```text
     https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
     ```
   - Save.

4. **Wait a few minutes** for Google’s config to update, then try “Sign in with Google” again.

**Checklist:**  
- [ ] URI is `https://...`  
- [ ] No trailing slash  
- [ ] Path is exactly `/auth/v1/callback`  
- [ ] Host is `YOUR_PROJECT_REF.supabase.co` (from your Supabase project URL)

---

## 1. Enable Authentication Providers

In your Supabase dashboard:

1. Go to **Authentication** → **Providers**
2. Enable **Email** provider (should be enabled by default)
3. Enable **Google** provider:
   - Click on Google
   - Toggle "Enable Google provider"
   - Add your Google OAuth credentials:
     - Client ID (from Google Cloud Console)
     - Client Secret (from Google Cloud Console)
   - Add authorized redirect URLs: `https://your-project.supabase.co/auth/v1/callback`
   - Save

## 2. Create Analytics Table

Run this SQL in your Supabase SQL Editor:

```sql
-- Create user_analytics table
CREATE TABLE IF NOT EXISTS user_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_analytics_user_id ON user_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_user_analytics_event_type ON user_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_user_analytics_timestamp ON user_analytics(timestamp);

-- Enable Row Level Security (RLS)
ALTER TABLE user_analytics ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own analytics
CREATE POLICY "Users can view own analytics" ON user_analytics
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Allow authenticated users to insert their own analytics
CREATE POLICY "Users can insert own analytics" ON user_analytics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Optional: Allow service role to insert (for server-side tracking)
-- This is useful if you want to track events from server-side code
CREATE POLICY "Service can insert analytics" ON user_analytics
  FOR INSERT WITH CHECK (true);
```

## 3. Configure Google OAuth (Optional but Recommended)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure OAuth consent screen if prompted
6. Create OAuth 2.0 Client ID:
   - Application type: **Web application**
   - Authorized redirect URIs: `https://your-project.supabase.co/auth/v1/callback`
7. Copy the **Client ID** and **Client Secret**
8. Add them to Supabase Authentication → Providers → Google

## 4. Environment Variables

Make sure your `.env` file has:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 5. Test Authentication

1. Start your app: `npm run dev`
2. Try registering with email
3. Try logging in with email
4. Try Google OAuth login
5. Check the `user_analytics` table in Supabase to see tracked events

## Analytics Events Tracked

The system automatically tracks:
- **registration**: When a user creates an account (with method: 'email' or 'google')
- **login**: When a user signs in (with method: 'email' or 'google')
- **logout**: When a user signs out

Each event includes:
- `user_id`: The authenticated user's ID
- `event_type`: 'registration', 'login', or 'logout'
- `event_metadata`: JSON object with additional info (method, timestamp)
- `timestamp`: When the event occurred

## Querying Analytics

Example queries you can run in Supabase:

```sql
-- Get all login events
SELECT * FROM user_analytics WHERE event_type = 'login' ORDER BY timestamp DESC;

-- Get registration count by day
SELECT DATE(timestamp) as date, COUNT(*) as registrations
FROM user_analytics
WHERE event_type = 'registration'
GROUP BY DATE(timestamp)
ORDER BY date DESC;

-- Get user activity summary
SELECT 
  user_id,
  COUNT(*) FILTER (WHERE event_type = 'login') as login_count,
  COUNT(*) FILTER (WHERE event_type = 'logout') as logout_count,
  MAX(timestamp) FILTER (WHERE event_type = 'login') as last_login
FROM user_analytics
GROUP BY user_id;
```
