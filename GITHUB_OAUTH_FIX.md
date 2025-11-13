# GitHub OAuth Troubleshooting

## Error: "redirect_uri is not associated with this application"

This means GitHub doesn't recognize the redirect URL that Supabase is sending.

## Fix: Configure Supabase GitHub OAuth Redirect URLs

1. **Go to Supabase Dashboard**
2. **Auth → Providers → GitHub**
3. Look for "Redirect URLs" section (NOT the GitHub provider settings, but Supabase's configured list)
4. You should see: `https://tztjynfavmjghnzekogh.supabase.co/auth/v1/callback`
5. **This is what gets sent to GitHub** - GitHub must have this registered

## Two Options to Fix:

### Option 1: Register Supabase's URL in GitHub (RECOMMENDED)
1. GitHub → Settings → Developer settings → OAuth Apps → Your app
2. Add this as "Authorization callback URL":
   ```
   https://tztjynfavmjghnzekogh.supabase.co/auth/v1/callback
   ```
3. Keep `https://pullwise.vercel.app` too if you want
4. Click Update Application

### Option 2: Check if Supabase allows custom redirect URLs
1. In Supabase GitHub provider settings, look for:
   - "Allowed Redirect URIs" or "Custom Redirect URLs"
2. If available, add: `https://pullwise.vercel.app`
3. Then make sure GitHub has this URL registered

## The Flow:
```
Your App (pullwise.vercel.app)
    ↓
Signs in with GitHub via Supabase
    ↓
Supabase sends GitHub this callback: 
  https://tztjynfavmjghnzekogh.supabase.co/auth/v1/callback
    ↓
GitHub checks: "Is this URL registered for this app?"
    ↓
If NO → Error: "redirect_uri is not associated"
If YES → Redirects back with auth code
```

## What You Should Try:

**Add BOTH of these to GitHub OAuth App "Authorization callback URL":**
```
https://tztjynfavmjghnzekogh.supabase.co/auth/v1/callback
https://pullwise.vercel.app
```

Then test login again.

