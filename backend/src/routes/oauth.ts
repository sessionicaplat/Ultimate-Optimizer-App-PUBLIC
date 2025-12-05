import { Router, Request, Response } from 'express';
import { upsertAppInstance } from '../db/appInstances';

const router = Router();

/**
 * Wix OAuth token response
 */
interface WixTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

/**
 * OAuth callback endpoint
 * 
 * Wix redirects here after user authorizes the app
 * Exchange authorization code for access and refresh tokens
 */
router.get('/oauth/callback', async (req: Request, res: Response) => {
  const { code, state, instanceId } = req.query;

  // Validate required parameters
  if (!code || typeof code !== 'string') {
    return res.status(400).json({ 
      error: 'Bad Request',
      message: 'Missing authorization code' 
    });
  }

  if (!instanceId || typeof instanceId !== 'string') {
    return res.status(400).json({ 
      error: 'Bad Request',
      message: 'Missing instance ID' 
    });
  }

  // Validate environment variables
  const appId = process.env.WIX_APP_ID;
  const appSecret = process.env.WIX_APP_SECRET;
  const redirectUri = process.env.WIX_REDIRECT_URI;

  if (!appId || !appSecret || !redirectUri) {
    console.error('Missing required environment variables for OAuth');
    return res.status(500).json({ 
      error: 'Server configuration error',
      message: 'OAuth not properly configured' 
    });
  }

  try {
    // Exchange authorization code for tokens
    const tokenResponse = await exchangeCodeForTokens(
      code,
      appId,
      appSecret,
      redirectUri
    );

    // Store instance data in database
    await upsertAppInstance({
      instanceId,
      siteHost: extractSiteHost(state as string),
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token,
      expiresIn: tokenResponse.expires_in,
    });

    // Redirect to dashboard
    res.redirect(`/dashboard?instance=${instanceId}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('OAuth callback error:', errorMessage);
    
    res.status(500).json({ 
      error: 'OAuth failed',
      message: 'Failed to complete authorization',
      details: errorMessage
    });
  }
});

/**
 * Exchange authorization code for access and refresh tokens
 */
async function exchangeCodeForTokens(
  code: string,
  appId: string,
  appSecret: string,
  redirectUri: string
): Promise<WixTokenResponse> {
  const tokenUrl = 'https://www.wix.com/oauth/access';
  
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: appId,
    client_secret: appSecret,
    code: code,
    redirect_uri: redirectUri,
  });

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Wix OAuth token exchange failed: ${response.status} ${errorText}`);
  }

  const data = await response.json() as any;
  
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_in: data.expires_in || 3600,
  };
}

/**
 * Extract site host from state parameter
 * State may contain encoded site information
 */
function extractSiteHost(state: string | undefined): string {
  if (!state) {
    return '';
  }

  try {
    // State might be JSON encoded or just a string
    const decoded = JSON.parse(decodeURIComponent(state));
    return decoded.siteHost || decoded.site || '';
  } catch {
    // If not JSON, return as-is
    return state;
  }
}

export default router;
