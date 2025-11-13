# Direct GitHub OAuth Setup

## Problem Solved
No more Supabase OAuth redirect issues. We're now handling GitHub OAuth directly.

## Setup Steps

### 1. Get GitHub Client ID and Secret
1. Go to GitHub → Settings → Developer settings → OAuth Apps
2. Click on your PullWise app
3. Copy the "Client ID"
4. Click "Generate a new client secret"
5. Copy the "Client Secret"

### 2. Update Vercel Environment Variables
Add to your Vercel project settings:
```
GITHUB_CLIENT_ID=your_client_id_here
GITHUB_CLIENT_SECRET=your_client_secret_here
```

### 3. Update GitHub OAuth App Settings
1. In GitHub OAuth App, set "Authorization callback URL" to:
   ```
   https://pullwise.vercel.app/api/github/callback
   ```
2. Homepage URL:
   ```
   https://pullwise.vercel.app
   ```

### 4. Update Auth.tsx
Replace `YOUR_GITHUB_CLIENT_ID` with your actual Client ID, or better: use an environment variable.

### 5. Push and Deploy
```bash
git add -A
git commit -m "feat: Implement direct GitHub OAuth handler"
git push origin main
```

## How It Works Now

```
User clicks GitHub Login
    ↓
Redirects to: github.com/login/oauth/authorize
    ↓
User approves
    ↓
GitHub redirects to: https://pullwise.vercel.app/api/github/callback?code=...
    ↓
Callback exchanges code for access token with GitHub API
    ↓
Signs user into Supabase using GitHub data
    ↓
Redirects to app with user logged in ✅
```

No more Supabase redirect URL issues!
