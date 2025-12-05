# Authentication Module

This module handles Wix app authentication using instance tokens and OAuth 2.0.

## Overview

The authentication system consists of two main components:

1. **Instance Token Verification** - Middleware that verifies Wix instance tokens on every API request
2. **OAuth Callback Handler** - Endpoint that handles the OAuth flow and stores access tokens

## Instance Token Verification

### How It Works

Wix sends an instance token in the `X-Wix-Instance` header with every request from the dashboard iframe. The token format is:

```
<base64url_payload>.<hmac_signature>
```

The middleware:
1. Extracts the token from the `X-Wix-Instance` header
2. Splits it into payload and signature
3. Verifies the HMAC-SHA256 signature using the app secret
4. Decodes the payload to extract `instanceId`, `siteHost`, and `appDefId`
5. Attaches the decoded data to `req.wixInstance`

### Usage

```typescript
import { verifyInstance } from './auth/verifyInstance';

// Protect an endpoint
app.get('/api/protected', verifyInstance, (req, res) => {
  const { instanceId, siteHost } = req.wixInstance!;
  // Your logic here
});
```

### Error Responses

- **401 Unauthorized** - Missing or invalid instance token
- **500 Server Error** - Missing `WIX_APP_SECRET` environment variable

## OAuth Flow

### How It Works

1. User installs the app from Wix App Market
2. Wix redirects to the OAuth authorization URL
3. User authorizes the app
4. Wix redirects to `/oauth/callback` with an authorization code
5. Backend exchanges the code for access and refresh tokens
6. Tokens are stored in the `app_instances` table
7. User is redirected to the dashboard

### Callback Endpoint

**GET** `/oauth/callback`

Query Parameters:
- `code` (required) - Authorization code from Wix
- `instanceId` (required) - Unique instance identifier
- `state` (optional) - State parameter containing site information

### Token Storage

Tokens are stored in the `app_instances` table with:
- `access_token` - Used for Wix API calls
- `refresh_token` - Used to refresh expired access tokens
- `token_expires_at` - Expiration timestamp
- Default plan: `free` with 100 credits

## Environment Variables

Required environment variables:

```bash
WIX_APP_ID=your-app-id
WIX_APP_SECRET=your-app-secret
WIX_REDIRECT_URI=https://your-domain.com/oauth/callback
```

## Testing

Run the test script to verify token verification:

```bash
npx tsx src/auth/test-verify.ts
```

## Security Considerations

1. **HMAC Verification** - All instance tokens are cryptographically verified
2. **Token Storage** - Access tokens should be encrypted at rest (future enhancement)
3. **HTTPS Only** - OAuth callback must use HTTPS in production
4. **Token Refresh** - Implement token refresh before expiration (future enhancement)

## References

- [Wix OAuth Documentation](https://dev.wix.com/docs/build-apps/developer-tools/extensions/oauth)
- [Wix Instance Token](https://dev.wix.com/docs/build-apps/developer-tools/extensions/instance-token)
