# Deploy Billing Update to Render

## Issue
The frontend is showing the old mock implementation message when clicking upgrade buttons. This is because the updated frontend code hasn't been deployed to Render yet.

## Solution

### Step 1: Rebuild Frontend Locally
```bash
cd frontend
npm run build
```

This creates the production build in `frontend/dist/`

### Step 2: Commit and Push Changes
```bash
# From project root
git add .
git commit -m "feat: Implement Wix 2025 billing webhook integration"
git push origin main
```

### Step 3: Render Auto-Deploys
Render will automatically:
1. Detect the push to main branch
2. Run the build command: `npm run build` (in backend)
3. The backend build includes copying frontend dist files
4. Deploy the new version

### Step 4: Verify Deployment
1. Wait for Render deployment to complete (check Render dashboard)
2. Clear browser cache or hard refresh (Ctrl+Shift+R / Cmd+Shift+R)
3. Open the app in Wix
4. Navigate to Billing & Credits page
5. Click "Upgrade" button
6. Should now call the real API and redirect to Wix checkout

## Alternative: Manual Verification

If you want to test before deploying:

### Test Locally
```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Start frontend
cd frontend
npm run dev
```

Then open `http://localhost:5173` and test the upgrade flow.

## What Changed

### Frontend (`frontend/src/pages/BillingCredits.tsx`)
**Before:**
```typescript
const handleUpgrade = () => {
  alert('Redirecting to Wix Billing... (Mock implementation)');
};
```

**After:**
```typescript
const handleUpgrade = async (planId: string) => {
  try {
    const response = await fetchWithAuth(`/api/billing/upgrade-url?planId=${planId}`);
    if (response.url) {
      window.top!.location.href = response.url;
    } else {
      alert('Failed to generate upgrade URL');
    }
  } catch (err) {
    console.error('Failed to get upgrade URL:', err);
    alert('Failed to initiate upgrade. Please try again.');
  }
};
```

### Backend (`backend/src/routes/billing.ts`)
- Added Wix SDK integration
- Implemented webhook processing
- Added upgrade URL endpoint

## Deployment Checklist

- [ ] Frontend rebuilt locally (`npm run build`)
- [ ] Changes committed to git
- [ ] Changes pushed to GitHub
- [ ] Render deployment triggered
- [ ] Render deployment completed successfully
- [ ] Browser cache cleared
- [ ] Tested upgrade button in app
- [ ] Verified API call in browser console
- [ ] Confirmed redirect to Wix checkout

## Troubleshooting

### Still Seeing Mock Message After Deploy

**Cause**: Browser cache or Render hasn't deployed yet

**Solutions**:
1. Hard refresh browser (Ctrl+Shift+R)
2. Clear browser cache completely
3. Check Render dashboard - deployment complete?
4. Check Render logs for build errors
5. Try incognito/private browsing window

### Upgrade Button Does Nothing

**Cause**: API endpoint not responding

**Solutions**:
1. Check browser console for errors
2. Verify backend is running on Render
3. Check `/api/billing/upgrade-url` endpoint exists
4. Verify `WIX_APP_ID` environment variable is set

### Gets Error Instead of Redirect

**Cause**: API call failing

**Solutions**:
1. Check browser console for error message
2. Check Render logs for backend errors
3. Verify authentication is working
4. Test API endpoint directly with curl

## Quick Deploy Commands

```bash
# One-liner to rebuild and deploy
cd frontend && npm run build && cd .. && git add . && git commit -m "Deploy billing update" && git push origin main
```

## Expected Behavior After Deploy

1. User clicks "Upgrade" button
2. Frontend calls `/api/billing/upgrade-url?planId=starter`
3. Backend returns: `{ url: "https://www.wix.com/app-market/upgrade?appId=...&planId=starter" }`
4. Frontend redirects: `window.top.location.href = response.url`
5. User sees Wix checkout page

## Verification

After deployment, check browser console when clicking upgrade:

**Should see:**
```
Fetching: /api/billing/upgrade-url?planId=starter
Response: { url: "https://...", planId: "starter" }
Redirecting to: https://www.wix.com/app-market/upgrade?...
```

**Should NOT see:**
```
alert: "Redirecting to Wix Billing... (Mock implementation)"
```

## Status

🟡 **Pending Deployment**

Once you push to GitHub, Render will deploy automatically and the upgrade buttons will work with the real API.
