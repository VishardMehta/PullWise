/**
 * Auth Callback Handler for Supabase OAuth
 * This serverless function handles the OAuth callback from Supabase
 * and redirects to the frontend with proper session handling
 */

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    
    // Get auth tokens from URL params
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');
    const expiresIn = searchParams.get('expires_in');
    const expiresAt = searchParams.get('expires_at');
    const providerToken = searchParams.get('provider_token');

    // Get the error if one occurred
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    if (error) {
      // Redirect to auth page with error
      const appUrl = `https://${process.env.VERCEL_URL}`;
      return Response.redirect(
        `${appUrl}/auth?error=${encodeURIComponent(error)}&description=${encodeURIComponent(errorDescription || '')}`
      );
    }

    if (!accessToken) {
      const appUrl = `https://${process.env.VERCEL_URL}`;
      return Response.redirect(
        `${appUrl}/auth?error=missing_token`
      );
    }

    // Build the redirect URL with auth tokens in the hash
    const appUrl = `https://${process.env.VERCEL_URL}`;
    const redirectUrl = new URL(appUrl);
    redirectUrl.hash = `access_token=${accessToken}&expires_at=${expiresAt}&expires_in=${expiresIn}&refresh_token=${refreshToken}&token_type=bearer${providerToken ? `&provider_token=${providerToken}` : ''}`;

    return Response.redirect(redirectUrl.toString());
  } catch (error) {
    console.error('Auth callback error:', error);
    const appUrl = `https://${process.env.VERCEL_URL}`;
    return Response.redirect(
      `${appUrl}/auth?error=callback_error`
    );
  }
}
