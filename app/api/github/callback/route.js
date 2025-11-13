/**
 * Manual GitHub OAuth Handler
 * This bypasses Supabase's built-in GitHub provider and handles it directly
 * Solves the redirect_uri mismatch issue
 */

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    const appUrl = `https://${process.env.VERCEL_URL}`;

    // Handle errors from GitHub
    if (error) {
      return Response.redirect(
        `${appUrl}/auth?error=${encodeURIComponent(error)}&description=${encodeURIComponent(errorDescription || '')}`
      );
    }

    if (!code) {
      return Response.redirect(`${appUrl}/auth?error=no_code`);
    }

    // Exchange code for token with GitHub
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code: code,
        redirect_uri: `${appUrl}/api/github/callback`,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      return Response.redirect(
        `${appUrl}/auth?error=${tokenData.error}&description=${tokenData.error_description || ''}`
      );
    }

    const accessToken = tokenData.access_token;

    // Get user info from GitHub
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github+json',
      },
    });

    const user = await userResponse.json();

    // Sign in with Supabase using the GitHub token
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

    const signInResponse = await fetch(`${supabaseUrl}/auth/v1/signups`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey,
      },
      body: JSON.stringify({
        email: user.email || `${user.login}@github.com`,
        password: Math.random().toString(36).slice(-12), // Random password for OAuth user
        data: {
          github_login: user.login,
          github_id: user.id,
          provider: 'github',
        },
      }),
    });

    // Redirect back to app with success
    return Response.redirect(`${appUrl}?github_user=${user.login}&provider_token=${accessToken}`);
  } catch (error) {
    console.error('GitHub auth callback error:', error);
    const appUrl = `https://${process.env.VERCEL_URL}`;
    return Response.redirect(`${appUrl}/auth?error=server_error`);
  }
}
