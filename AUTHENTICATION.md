# Authentication System

## Overview

The DharmaScroll app now requires user authentication before accessing the content. Users can register and login using:
- **Email and Password**
- **Google OAuth**

All authentication events (login, logout, registration) are tracked in Supabase for analytics.

## Features

### 1. User Registration
- Users can create an account with email and password
- Optional name field
- Password validation (minimum 6 characters)
- Google OAuth registration option
- Registration events are tracked with timestamp

### 2. User Login
- Email/password login
- Google OAuth login
- Login events are tracked with timestamp and method

### 3. Protected Routes
- All app content is protected - users must be authenticated
- Unauthenticated users see login/registration forms
- Automatic redirect after successful authentication

### 4. Logout
- Logout button in the header
- Logout events are tracked with timestamp
- Session is cleared on logout

### 5. Analytics Tracking
- All authentication events are stored in `user_analytics` table
- Events include: user_id, event_type, event_metadata, timestamp
- Can be queried for user behavior analysis

## Files Created/Modified

### New Files
- `services/authService.ts` - Authentication service with Supabase
- `services/analyticsService.ts` - Analytics tracking service
- `components/LoginForm.tsx` - Login form component
- `components/RegisterForm.tsx` - Registration form component
- `SUPABASE_SETUP.md` - Setup instructions for Supabase
- `AUTHENTICATION.md` - This file

### Modified Files
- `App.tsx` - Added authentication protection and logout functionality
- `index.html` - Added CSS styles for authentication forms

## Setup Required

1. **Supabase Configuration**
   - Enable Email authentication provider
   - Enable Google OAuth provider (optional)
   - Create `user_analytics` table (see `SUPABASE_SETUP.md`)

2. **Environment Variables**
   - Ensure `.env` has `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. **Google OAuth** (Optional)
   - Set up Google Cloud Console project
   - Add OAuth credentials to Supabase

## Usage

### For Users
1. Visit the app - you'll see the login screen
2. Click "Sign up" to create an account, or use Google to sign in
3. After authentication, you'll see the quotes feed
4. Use the "Logout" button in the header to sign out

### For Developers
- Authentication state is managed in `App.tsx`
- Auth service handles all Supabase auth operations
- Analytics service automatically tracks events
- Check `SUPABASE_SETUP.md` for database setup

## Analytics Data Structure

Each analytics event contains:
```json
{
  "user_id": "uuid",
  "event_type": "login" | "logout" | "registration",
  "event_metadata": {
    "method": "email" | "google",
    "timestamp": "ISO 8601 string"
  },
  "timestamp": "ISO 8601 string"
}
```

## Security Notes

- Passwords are handled by Supabase (never stored in plain text)
- Row Level Security (RLS) is enabled on analytics table
- Users can only see their own analytics data
- OAuth tokens are managed by Supabase
