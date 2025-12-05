# How Production Detection Works

## Overview
The app uses the `NODE_ENV` environment variable to determine if it's running in production or development mode. This controls whether test features (like the cancellation test page) are accessible.

## Backend Detection

### In Code
```typescript
// backend/src/routes/orders.ts
if (process.env.NODE_ENV === 'production' && 
    process.env.ENABLE_TEST_ENDPOINTS !== 'true') {
  return res.status(403).json({ 
    error: 'This test endpoint is disabled in production' 
  });
}
```

### How It Works
1. **Development**: `NODE_ENV` is not set or equals `'development'`
   - Test endpoints are accessible
   - Full debugging enabled
   
2. **Production**: `NODE_ENV` equals `'production'`
   - Test endpoints return 403 Forbidden
   - Production optimizations enabled

## Frontend Detection

### In Code
```typescript
// frontend/src/components/Layout.tsx
{import.meta.env.DEV && (
  <NavLink to="/test-cancellation">
    Test Cancellation
  </NavLink>
)}
```

### How It Works
1. **Development**: `import.meta.env.DEV` is `true`
   - Test navigation links visible
   - Development tools enabled
   
2. **Production**: `import.meta.env.DEV` is `false`
   - Test navigation links hidden
   - Production build optimizations

## Setting NODE_ENV

### Local Development
```bash
# Option 1: Not set (defaults to development)
npm run dev

# Option 2: Explicitly set to development
NODE_ENV=development npm run dev

# Option 3: Test production mode locally
NODE_ENV=production npm start
```

### Render.com (Production)
1. Go to your Web Service in Render Dashboard
2. Click **"Environment"** tab
3. Add environment variable:
   - **Key**: `NODE_ENV`
   - **Value**: `production`
4. Click **"Save Changes"**
5. Service will automatically redeploy

### Current Render Configuration
According to your `ENVIRONMENT_VARIABLES.md`, you should already have:
```bash
NODE_ENV=production
```

## Verification

### Check Backend Environment
Add a debug endpoint (temporary):
```typescript
// backend/src/server.ts
app.get('/api/debug/env', (req, res) => {
  res.json({
    NODE_ENV: process.env.NODE_ENV,
    isProduction: process.env.NODE_ENV === 'production',
    testEndpointsEnabled: process.env.ENABLE_TEST_ENDPOINTS === 'true'
  });
});
```

Then visit: `https://your-app.onrender.com/api/debug/env`

### Check Frontend Build
The frontend automatically detects the build mode:
- **Development build**: `npm run dev` → `import.meta.env.DEV = true`
- **Production build**: `npm run build` → `import.meta.env.DEV = false`

## Override for Testing (Not Recommended)

If you need to enable test endpoints in production temporarily:

```bash
# In Render Dashboard, add:
ENABLE_TEST_ENDPOINTS=true
```

**⚠️ Warning**: This bypasses production safety. Only use for debugging, then remove immediately.

## How Different Environments Work

### Local Development
```bash
# Terminal
npm run dev

# Result
NODE_ENV: undefined or 'development'
import.meta.env.DEV: true
Test endpoints: ✅ Enabled
Test navigation: ✅ Visible
```

### Local Production Test
```bash
# Terminal
npm run build
NODE_ENV=production npm start

# Result
NODE_ENV: 'production'
import.meta.env.DEV: false (from build)
Test endpoints: ❌ Disabled (403)
Test navigation: ❌ Hidden
```

### Render.com Production
```bash
# Render Dashboard Environment Variables
NODE_ENV=production

# Build command (in Render)
npm run build

# Start command (in Render)
npm start

# Result
NODE_ENV: 'production'
import.meta.env.DEV: false (from build)
Test endpoints: ❌ Disabled (403)
Test navigation: ❌ Hidden
```

## Package.json Scripts

Your scripts should look like this:

```json
{
  "scripts": {
    "dev": "vite",                    // Development mode
    "build": "vite build",            // Production build
    "start": "node dist/server.js"    // Production server
  }
}
```

## Vite Environment Variables

Vite (your frontend build tool) automatically sets:
- `import.meta.env.DEV` - true in development
- `import.meta.env.PROD` - true in production
- `import.meta.env.MODE` - 'development' or 'production'

These are set based on the command:
- `vite` or `vite dev` → DEV mode
- `vite build` → PROD mode

## Complete Flow

### Development Flow
```
1. Developer runs: npm run dev
2. Backend: NODE_ENV = undefined → Development mode
3. Frontend: Vite dev server → import.meta.env.DEV = true
4. Test page: ✅ Accessible at /test-cancellation
5. Test endpoints: ✅ Return data
6. Navigation: ✅ Shows "Test Cancellation" link
```

### Production Flow
```
1. Render runs: npm run build && npm start
2. Backend: NODE_ENV = 'production' (from env var)
3. Frontend: Vite build → import.meta.env.DEV = false
4. Test page: ❌ Route exists but navigation hidden
5. Test endpoints: ❌ Return 403 Forbidden
6. Navigation: ❌ Hides "Test Cancellation" link
```

## Troubleshooting

### Test Page Still Accessible in Production

**Check 1**: Verify NODE_ENV is set
```bash
# In Render Dashboard
Environment → NODE_ENV should be "production"
```

**Check 2**: Verify frontend was built in production mode
```bash
# Check build logs in Render
Should see: "vite build" command
Should NOT see: "vite dev" command
```

**Check 3**: Check for override flag
```bash
# In Render Dashboard
Environment → ENABLE_TEST_ENDPOINTS should NOT exist
# Or should be "false" if it exists
```

### Test Page Not Working in Development

**Check 1**: Verify you're running dev server
```bash
# Should be running:
npm run dev

# NOT:
npm start
```

**Check 2**: Check NODE_ENV is not set to production
```bash
# In your terminal/shell
echo $NODE_ENV  # Should be empty or "development"
```

## Best Practices

1. ✅ **Always set NODE_ENV=production in Render**
2. ✅ **Never commit .env files with production values**
3. ✅ **Use Render's environment variables for production**
4. ✅ **Test production mode locally before deploying**
5. ❌ **Never use ENABLE_TEST_ENDPOINTS in production**
6. ❌ **Never hardcode environment checks**

## Summary

**Question**: How does the app know it's in production?

**Answer**: 
- **Backend**: Checks `process.env.NODE_ENV === 'production'`
- **Frontend**: Checks `import.meta.env.DEV === false` (set by Vite during build)
- **Set in**: Render Dashboard → Environment Variables → `NODE_ENV=production`
- **Result**: Test endpoints return 403, test navigation hidden

The key is setting `NODE_ENV=production` in your Render environment variables, which you should already have configured according to your `ENVIRONMENT_VARIABLES.md` file.
