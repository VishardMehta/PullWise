# Deployment Setup for PullWise

## Your Deployment URL
- **Frontend:** https://pullwise.vercel.app/
- **Auth Callback:** https://pullwise.vercel.app/api/auth/callback

## Required Configuration

### 1. Vercel Environment Variables
Add these to your Vercel project (Settings → Environment Variables):

```
VITE_SUPABASE_URL=https://tztjynfavmjghnzekogh.supabase.co
VITE_SUPABASE_ANON_KEY=evJhbGciOiJIUzI1NiIsImtpZCI6IlZFd21WMWZ3R1A2UTl1bGwiLCJ0eXAiOiJKV1QifQ...
GEMINI_API_KEY=AIzaSyB55q0HNxtNbs9aIJ9r3kYcCls...
GEMINI_API_URL=https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent
```

### 2. Supabase GitHub OAuth Configuration
1. Go to Supabase Dashboard
2. Navigate to: Authentication → Providers → GitHub
3. Add redirect URL:
   ```
   https://pullwise.vercel.app/api/auth/callback
   ```

### 3. GitHub OAuth App Settings
1. Go to GitHub Settings → Developer settings → OAuth Apps
2. Under "Authorization callback URL", add:
   ```
   https://pullwise.vercel.app/api/auth/callback
   ```

## How the Auth Flow Works

```
User clicks "Sign in with GitHub"
        ↓
Redirects to GitHub OAuth
        ↓
GitHub redirects to Supabase
        ↓
Supabase redirects to: https://pullwise.vercel.app/api/auth/callback
        ↓
/api/auth/callback (serverless function) processes tokens
        ↓
Redirects to: https://pullwise.vercel.app/#access_token=...
        ↓
React app (AuthContext) captures token from URL hash
        ↓
User is logged in! ✅
```

## Setup Checklist

- [ ] Add environment variables to Vercel
- [ ] Update Supabase redirect URLs
- [ ] Update GitHub OAuth App callback URL
- [ ] Test GitHub login on https://pullwise.vercel.app
