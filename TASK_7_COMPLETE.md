# Task 7 Complete: Wix Instance Authentication

## Summary

Successfully implemented Wix instance authentication with OAuth 2.0 integration and instance token verification middleware.

## What Was Implemented

### 1. Instance Token Verification Middleware (`backend/src/auth/verifyInstance.ts`)

- **HMAC-SHA256 signature verification** using Wix app secret
- Extracts `instanceId`, `siteHost`, and `appDefId` from verified tokens
- Attaches instance data to `req.wixInstance` for use in route handlers
- Returns 401 for invalid or missing tokens
- Comprehensive error handling with structured error responses

**Key Features:**
- Cryptographic verification of all instance tokens
- TypeScript type safety with Express Request extension
- Clear error messages for debugging

### 2. OAuth Callback Handler (`backend/src/routes/oauth.ts`)

- **GET /oauth/callback** endpoint for Wix OAuth flow
- Exchanges authorization code for access and refresh tokens
- Stores tokens and instance data in the database
- Sets default plan to 'free' with 100 credits
- Redirects user to dashboard after successful authentication

**Key Features:**
- Full OAuth 2.0 authorization code flow
- Automatic token storage with expiration tracking
- State parameter handling for site information
- Comprehensive error handling and logging

### 3. Database Functions (`backend/src/db/appInstances.ts`)

Created database helper functions for managing app instances:
- `upsertAppInstance()` - Create or update instance after OAuth
- `getAppInstance()` - Retrieve instance by ID
- `updateAccessToken()` - Refresh expired tokens
- `updateInstancePlan()` - Change subscription plan
- `incrementCreditsUsed()` - Track credit consumption

**Key Features:**
- UPSERT logic for idempotent OAuth callbacks
- Automatic credit reset date calculation
- Transaction-safe credit operations

### 4. Server Integration (`backend/src/server.ts`)

- Integrated OAuth routes (no authentication required)
- Applied `verifyInstance` middleware to all API endpoints:
  - `/api/products`
  - `/api/collections`
  - `/api/me`
  - `/api/jobs` (all variants)
  - `/api/publish`

### 5. Testing & Documentation

- **Test script** (`backend/src/auth/test-verify.ts`) - Validates token verification logic
- **README** (`backend/src/auth/README.md`) - Comprehensive documentation
- All tests passing ✓

## Files Created

```
backend/src/auth/
├── verifyInstance.ts      # Middleware for instance token verification
├── test-verify.ts         # Test script for verification logic
└── README.md              # Authentication documentation

backend/src/routes/
└── oauth.ts               # OAuth callback handler

backend/src/db/
└── appInstances.ts        # Database functions for app instances
```

## Files Modified

```
backend/src/server.ts      # Integrated auth middleware and OAuth routes
```

## Requirements Satisfied

✓ **Requirement 1.1** - App installation creates instance record  
✓ **Requirement 1.2** - OAuth callback exchanges code for tokens  
✓ **Requirement 1.3** - Tokens stored with default free plan  
✓ **Requirement 1.4** - Instance token verification on all requests  
✓ **Requirement 1.5** - 401 response for invalid tokens  
✓ **Requirement 14.1** - HMAC signature validation for security  

## How to Test

### 1. Test Token Verification

```bash
cd backend
npx tsx src/auth/test-verify.ts
```

Expected output: All 4 tests pass ✓

### 2. Test OAuth Flow (Manual)

1. Set environment variables in `.env`:
   ```
   WIX_APP_ID=your-app-id
   WIX_APP_SECRET=your-app-secret
   WIX_REDIRECT_URI=http://localhost:3000/oauth/callback
   ```

2. Start the server:
   ```bash
   npm run dev
   ```

3. Simulate OAuth callback:
   ```bash
   curl "http://localhost:3000/oauth/callback?code=test-code&instanceId=test-instance-123"
   ```

### 3. Test Protected Endpoints

```bash
# Without token (should return 401)
curl http://localhost:3000/api/me

# With valid token (requires real Wix instance token)
curl -H "X-Wix-Instance: <valid-token>" http://localhost:3000/api/me
```

## Next Steps

The authentication system is now ready for:
- **Task 8**: Register Wix app and configure extensions
- **Task 9**: Build Wix Stores API client (will use stored access tokens)
- **Task 10**: Implement product and collection API endpoints

## Security Notes

1. **Token Verification**: All API requests now require valid Wix instance tokens
2. **OAuth Security**: Authorization codes are exchanged server-side (never exposed to client)
3. **Token Storage**: Access tokens stored in database (consider encryption for production)
4. **HTTPS Required**: OAuth callback must use HTTPS in production

## Environment Variables Required

```bash
WIX_APP_ID=<your-wix-app-id>
WIX_APP_SECRET=<your-wix-app-secret>
WIX_REDIRECT_URI=<your-render-url>/oauth/callback
DATABASE_URL=<postgresql-connection-string>
```

---

**Status**: ✅ Complete  
**Build**: ✅ Passing  
**Tests**: ✅ All passing  
**Ready for**: Task 8 - Register Wix app and configure extensions
