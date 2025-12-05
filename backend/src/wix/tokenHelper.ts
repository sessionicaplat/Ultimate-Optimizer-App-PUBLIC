import axios from 'axios';

/**
 * PRIORITY 3 FIX: In-memory cache for token refresh operations
 * Prevents concurrent refresh requests for the same instance
 * TTL: 1 minute (tokens are valid for hours, but we cache the refresh promise briefly)
 */
interface TokenRefreshCacheEntry {
  promise: Promise<string>;
  timestamp: number;
}

const tokenRefreshCache = new Map<string, TokenRefreshCacheEntry>();
const CACHE_TTL_MS = 60 * 1000; // 1 minute

/**
 * Clean up expired cache entries
 */
function cleanTokenCache(): void {
  const now = Date.now();
  for (const [key, entry] of tokenRefreshCache.entries()) {
    if (now - entry.timestamp > CACHE_TTL_MS) {
      tokenRefreshCache.delete(key);
    }
  }
}

/**
 * Get an elevated access token for making Wix API calls
 * Uses OAuth2 client credentials flow
 * 
 * @param instanceId - The app instance ID (optional, for context)
 * @returns Access token for Wix API calls
 */
export async function getElevatedToken(instanceId?: string): Promise<string> {
  const appId = process.env.WIX_APP_ID;
  const appSecret = process.env.WIX_APP_SECRET;

  if (!appId || !appSecret) {
    throw new Error('WIX_APP_ID and WIX_APP_SECRET must be configured');
  }

  try {
    console.log('[TokenHelper] Requesting elevated token', instanceId ? `for instance ${instanceId}` : '');

    // Use OAuth2 client credentials flow
    const response = await axios.post(
      'https://www.wixapis.com/oauth2/token',
      new URLSearchParams({
        grant_type: 'client_credentials',
      }),
      {
        auth: {
          username: appId,
          password: appSecret,
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const accessToken = response.data.access_token;
    
    if (!accessToken) {
      throw new Error('No access token returned from Wix OAuth');
    }

    console.log('[TokenHelper] ✅ Elevated token obtained');
    return accessToken;
  } catch (error: any) {
    console.error('[TokenHelper] ❌ Failed to get elevated token:', error.response?.data || error.message);
    throw new Error(`Failed to get elevated token: ${error.response?.data?.message || error.message}`);
  }
}

/**
 * Get an access token from the app instance stored in database
 * This uses the site-specific token for accessing site data
 * Automatically refreshes expired tokens
 * 
 * PRIORITY 3 FIX: Added caching to prevent concurrent refresh requests
 * 
 * @param instanceId - The app instance ID
 * @returns Access token for the specific site
 */
export async function getInstanceToken(
  instanceId: string,
  options?: { forceRefresh?: boolean }
): Promise<string> {
  const { getAppInstance, updateAccessToken } = await import('../db/appInstances');
  
  const instance = await getAppInstance(instanceId);
  
  if (!instance) {
    throw new Error(`Instance not found: ${instanceId}`);
  }

  // Check if token is expired (with 5 minute buffer) or refresh forced
  const now = new Date();
  const expiresAt = new Date(instance.token_expires_at);
  const bufferMs = 5 * 60 * 1000; // 5 minutes
  const shouldRefresh =
    options?.forceRefresh || now.getTime() >= expiresAt.getTime() - bufferMs;
  
  if (shouldRefresh) {
    // PRIORITY 3 FIX: Check cache first to avoid concurrent refreshes
    const cacheKey = `refresh_${instanceId}`;
    const cached = tokenRefreshCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL_MS) {
      console.log('[TokenHelper] ⚡ Using cached refresh promise (concurrent request detected)');
      return cached.promise;
    }
    
    console.log('[TokenHelper] Token expired or refresh forced, requesting new token...');
    
    const appId = process.env.WIX_APP_ID;
    const appSecret = process.env.WIX_APP_SECRET;

    if (!appId || !appSecret) {
      throw new Error('WIX_APP_ID and WIX_APP_SECRET must be configured');
    }

    // PRIORITY 3 FIX: Create and cache the refresh promise
    const refreshPromise = (async () => {
      try {
        const tokens = await refreshAccessToken({
          instanceId,
          appId,
          appSecret,
          refreshToken: instance.refresh_token,
        });

        await updateAccessToken(
          instanceId,
          tokens.accessToken,
          tokens.refreshToken ?? instance.refresh_token ?? undefined,
          tokens.expiresIn
        );

        console.log('[TokenHelper] ✅ Token refreshed successfully');
        
        // Clean up cache after successful refresh
        tokenRefreshCache.delete(cacheKey);
        
        return tokens.accessToken;
      } catch (error) {
        // Clean up cache on error
        tokenRefreshCache.delete(cacheKey);
        throw error;
      }
    })();
    
    // Cache the promise
    tokenRefreshCache.set(cacheKey, {
      promise: refreshPromise,
      timestamp: Date.now(),
    });
    
    // Periodically clean up old cache entries
    if (tokenRefreshCache.size > 100) {
      cleanTokenCache();
    }
    
    return refreshPromise;
  }

  return instance.access_token;
}

async function refreshAccessToken(params: {
  instanceId: string;
  appId: string;
  appSecret: string;
  refreshToken?: string | null;
}): Promise<{ accessToken: string; refreshToken?: string; expiresIn: number }> {
  const { instanceId, appId, appSecret, refreshToken } = params;

  // Prefer legacy refresh token flow when token exists
  if (refreshToken) {
    try {
      const response = await axios.post(
        'https://www.wixapis.com/oauth/access',
        {
          grant_type: 'refresh_token',
          client_id: appId,
          client_secret: appSecret,
          refresh_token: refreshToken,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.data?.access_token) {
        throw new Error('No access token returned from refresh_token flow');
      }

      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token ?? refreshToken ?? undefined,
        expiresIn: response.data.expires_in || 3600,
      };
    } catch (error: any) {
      const errorMessage = error.response?.data || error.message;
      console.warn(
        '[TokenHelper] Legacy refresh flow failed, falling back to client credentials:',
        errorMessage
      );
    }
  }

  // Fallback: client credentials flow with instanceId context
  const fallbackResponse = await axios.post(
    'https://www.wixapis.com/oauth2/token',
    {
      grant_type: 'client_credentials',
      client_id: appId,
      client_secret: appSecret,
      instance_id: instanceId,
    },
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!fallbackResponse.data?.access_token) {
    throw new Error('No access token returned from client_credentials flow');
  }

  return {
    accessToken: fallbackResponse.data.access_token,
    refreshToken: refreshToken ?? undefined,
    expiresIn: fallbackResponse.data.expires_in || 4 * 60 * 60, // 4 hours
  };
}
