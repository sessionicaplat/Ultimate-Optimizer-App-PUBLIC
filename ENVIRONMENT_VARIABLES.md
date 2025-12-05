# Environment Variables Guide

This document describes all environment variables used in the Ultimate Optimizer App.

## Phase 1: Frontend & Initial Deployment

### Required Variables

| Variable | Value | Description | When to Set |
|----------|-------|-------------|-------------|
| `NODE_ENV` | `production` | Sets Node.js environment mode | Phase 1 |
| `PORT` | `3000` | Server port (Render overrides internally) | Phase 1 |
| `WIX_APP_ID` | `PLACEHOLDER_APP_ID` | Wix app identifier (placeholder for now) | Phase 1 |
| `WIX_APP_SECRET` | `PLACEHOLDER_APP_SECRET` | Wix app secret (placeholder for now) | Phase 1 |
| `REPLICATE_API_TOKEN` | `r8_xxx...` | Replicate.com API token for image optimization | Image Optimization Feature |
| `CLOUDFLARE_ACCOUNT_ID` | `your_account_id` | Cloudflare account ID for R2 storage (optional) | Image Optimization Feature |
| `CLOUDFLARE_R2_ACCESS_KEY_ID` | `your_access_key` | R2 API access key ID (optional) | Image Optimization Feature |
| `CLOUDFLARE_R2_SECRET_ACCESS_KEY` | `your_secret_key` | R2 API secret access key (optional) | Image Optimization Feature |
| `CLOUDFLARE_R2_BUCKET_NAME` | `optimized-images` | R2 bucket name (optional, default: optimized-images) | Image Optimization Feature |
| `CLOUDFLARE_R2_PUBLIC_URL` | `https://your-domain.com` | Custom domain for R2 public access (optional) | Image Optimization Feature |

### Setting in Render Dashboard

1. Go to your Web Service in Render Dashboard
2. Click "Environment" tab
3. Click "Add Environment Variable"
4. Add each variable with its value
5. Click "Save Changes"

### Example Configuration

```bash
# Phase 1 Configuration
NODE_ENV=production
PORT=3000
WIX_APP_ID=PLACEHOLDER_APP_ID
WIX_APP_SECRET=PLACEHOLDER_APP_SECRET
```

## Phase 2: Database & Authentication

### Additional Variables

| Variable | Value | Description | When to Set |
|----------|-------|-------------|-------------|
| `DATABASE_URL` | Auto-populated | PostgreSQL connection string | Phase 2 (automatic) |
| `WIX_REDIRECT_URI` | `https://your-app.onrender.com/oauth/callback` | OAuth callback URL | Phase 2 |

### Update Wix Variables

In Phase 2, you'll create a real Wix app and update:
- `WIX_APP_ID` → Replace with actual app ID
- `WIX_APP_SECRET` → Replace with actual app secret

### Database Connection

When you add PostgreSQL in Render:
1. Render automatically creates `DATABASE_URL` when you connect the database
2. Use "Add from Database" feature in Web Service environment settings
3. Format: `postgresql://user:password@host:5432/database`
4. **Important**: Use the **Internal Database URL** (not external)
5. Internal URL only works within same Render region

**Example DATABASE_URL**:
```
postgresql://ultimate_optimizer_user:password123@dpg-abc123/ultimate_optimizer
```

**Setting DATABASE_URL**:
- **Automatic** (Recommended): Web Service → Environment → Add from Database → Select your PostgreSQL
- **Manual**: Copy internal URL from PostgreSQL dashboard → Add as environment variable

## Phase 4: Job Processing & AI Integration

### Additional Variables

| Variable | Value | Description | When to Set |
|----------|-------|-------------|-------------|
| `OPENAI_API_KEY` | `sk-...` | OpenAI API key for GPT-4 | Phase 4 |

### Getting OpenAI API Key

1. Sign up at https://platform.openai.com
2. Go to API Keys section
3. Create new secret key
4. Copy and save securely
5. Add to Render environment variables

### Getting Cloudflare R2 Credentials (Optional)

**Purpose**: Permanent storage for optimized images. Without R2, images use Replicate's temporary URLs (expire after 24-48 hours).

1. Sign up at https://cloudflare.com
2. Go to **R2** in the dashboard
3. Create a bucket (e.g., "optimized-images")
4. Go to **Manage R2 API Tokens**
5. Create API token with **Object Read & Write** permissions
6. Copy:
   - Account ID (from R2 dashboard)
   - Access Key ID
   - Secret Access Key
7. (Optional) Configure custom domain for public access
8. Add to Render environment variables

**Note**: R2 is optional. If not configured, the system will work but optimized images will expire after 24-48 hours.

## Phase 5: Billing Integration

### Additional Variables

| Variable | Value | Description | When to Set |
|----------|-------|-------------|-------------|
| `WIX_PUBLIC_KEY` | `-----BEGIN PUBLIC KEY-----...` | Wix webhook signature verification key | Phase 5 |

### Getting Wix Public Key

1. Go to [Wix Developers Dashboard](https://dev.wix.com/)
2. Select your app
3. Navigate to **Webhooks** or **App Settings**
4. Look for **Public Key** or **Webhook Signing Key**
5. Copy the entire public key including the header and footer:
   ```
   -----BEGIN PUBLIC KEY-----
   MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...
   ...
   -----END PUBLIC KEY-----
   ```
6. Add to Render environment variables (mark as "Secret")

**Important**: 
- Include the `-----BEGIN PUBLIC KEY-----` and `-----END PUBLIC KEY-----` lines
- Preserve all line breaks in the key
- Mark as "Secret" in Render dashboard

## Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `LOG_LEVEL` | `info` | Logging level (info, warn, error) |
| `NODE_VERSION` | `18` | Node.js version (set in Render) |

## Security Best Practices

### Secrets Management

- ✅ **DO**: Store secrets in Render environment variables
- ✅ **DO**: Use "Secret" checkbox for sensitive values
- ✅ **DO**: Rotate secrets regularly
- ❌ **DON'T**: Commit secrets to Git
- ❌ **DON'T**: Share secrets in plain text
- ❌ **DON'T**: Log secret values

### Environment Files

- `.env` → Local development (gitignored)
- `.env.example` → Template with dummy values (committed)
- `.env.production.example` → Production template (committed)
- Render Dashboard → Actual production values (secure)

## Validation

### Check Variables are Set

Add this to your server startup:

```typescript
const requiredVars = ['NODE_ENV', 'WIX_APP_ID', 'WIX_APP_SECRET'];
const missing = requiredVars.filter(v => !process.env[v]);
if (missing.length > 0) {
  console.error(`Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}
```

### Test Configuration

```bash
# Local development
npm run dev

# Production build
npm run build
npm start

# Check environment
node -e "console.log(process.env.NODE_ENV)"
```

## Troubleshooting

### Variable Not Found

**Issue**: `process.env.VARIABLE_NAME` is undefined

**Solutions**:
1. Check variable is set in Render Dashboard
2. Verify spelling matches exactly (case-sensitive)
3. Restart service after adding variables
4. Check for typos in variable name

### Database Connection Fails

**Issue**: Cannot connect to PostgreSQL

**Solutions**:
1. Verify `DATABASE_URL` is set
2. Check PostgreSQL service is running
3. Verify database is in same region as web service
4. Check connection string format

### Wix Authentication Fails

**Issue**: Invalid instance token errors

**Solutions**:
1. Verify `WIX_APP_SECRET` matches Wix app settings
2. Check `WIX_APP_ID` is correct
3. Ensure `WIX_REDIRECT_URI` matches Wix app configuration
4. Verify app is published in Wix App Market

## Phase-by-Phase Summary

### ✅ Phase 1 (Current)
```bash
NODE_ENV=production
PORT=3000
WIX_APP_ID=PLACEHOLDER_APP_ID
WIX_APP_SECRET=PLACEHOLDER_APP_SECRET
```

### ⏭️ Phase 2 (Database & Auth)
```bash
# Add:
DATABASE_URL=postgresql://...  # Auto-populated
WIX_REDIRECT_URI=https://your-app.onrender.com/oauth/callback

# Update:
WIX_APP_ID=<real-app-id>
WIX_APP_SECRET=<real-app-secret>
```

### ⏭️ Phase 4 (AI Integration)
```bash
# Add:
OPENAI_API_KEY=sk-...
```

### ⏭️ Phase 5 (Billing Integration)
```bash
# Add:
WIX_PUBLIC_KEY=-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...
-----END PUBLIC KEY-----
```

## Reference

- Render Environment Variables: https://render.com/docs/environment-variables
- Node.js Environment Variables: https://nodejs.org/api/process.html#process_process_env
- Wix App Configuration: https://dev.wix.com/docs/build-apps
- OpenAI API Keys: https://platform.openai.com/api-keys
