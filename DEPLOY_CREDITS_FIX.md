# Deploy Credits Fix - Quick Guide

## Pre-Deployment Checklist

- [ ] All code changes committed
- [ ] Tests passing (if applicable)
- [ ] Database connection verified
- [ ] Backup current database (optional but recommended)

## Deployment Steps

### Step 1: Deploy Backend

```bash
# Commit changes
git add backend/src/db/appInstances.ts
git add backend/src/routes/provision.ts
git add backend/src/routes/billing.ts
git add backend/src/tasks/creditSync.ts
git add backend/src/server.ts
git add backend/fix-credits-sync.js
git add backend/check-credits-issue.js

git commit -m "Fix: Permanent credit assignment with auto-sync

- Simplified updateInstancePlan() logic
- Added syncInstanceCredits() and syncAllInstanceCredits()
- Added automatic sync during provisioning
- Added periodic credit sync task (runs every 6 hours)
- Added manual sync endpoint POST /api/billing/sync-credits
- Integrated credit sync scheduler in server startup"

git push
```

### Step 2: Deploy Frontend

```bash
# Commit frontend changes
git add frontend/src/pages/BillingCredits.tsx

git commit -m "Add manual credit sync button to Billing page"

git push
```

### Step 3: Wait for Deployment

If using Render or similar platform:
- Wait for automatic deployment to complete
- Check deployment logs for errors
- Verify server starts successfully

### Step 4: Run One-Time Fix Script

**IMPORTANT:** This fixes all existing instances with incorrect credits.

#### Option A: On Render (or similar platform)

1. Go to your Render dashboard
2. Open your backend service
3. Go to "Shell" tab
4. Run:
   ```bash
   cd backend
   node fix-credits-sync.js
   ```

#### Option B: Locally (if you have production DB access)

```bash
# Set production DATABASE_URL
export DATABASE_URL="your-production-database-url"

# Run fix script
cd backend
node fix-credits-sync.js
```

### Step 5: Verify Fix

#### Check Database

```bash
# On production server or locally with production DB
cd backend
node check-credits-issue.js
```

Expected output:
```
✅ All instances have correct credit allocations
```

#### Check UI

1. Open the app in a browser
2. Go to Billing & Credits page
3. Verify credits show correctly (e.g., 5,000 for Pro plan)
4. Click "🔄 Sync Credits" button
5. Should see success message

#### Check Server Logs

Look for these log messages:

```
[CreditSync] Scheduler started. Running every 6 hours.
[CreditSync] Running credit sync task...
```

### Step 6: Monitor

For the next 24 hours, monitor:

1. **Server Logs**
   - Check for credit sync operations every 6 hours
   - Look for any errors

2. **User Reports**
   - Monitor support tickets
   - Check for credit-related issues

3. **Database**
   - Periodically run `check-credits-issue.js`
   - Verify no new mismatches appear

## Rollback (If Needed)

If issues occur:

```bash
# Revert commits
git revert HEAD~2..HEAD
git push

# Or revert to specific commit
git reset --hard <previous-commit-hash>
git push --force
```

## Testing Checklist

After deployment, test:

- [ ] Existing users see correct credits
- [ ] New installations get correct credits
- [ ] Manual sync button works
- [ ] Periodic sync runs every 6 hours
- [ ] Webhook updates still work
- [ ] Credit deduction still works
- [ ] Monthly reset still works

## Success Criteria

✅ All instances have `credits_total` matching their plan's `monthly_credits`
✅ No credit-related support tickets
✅ Sync logs show successful operations
✅ Manual sync button works in UI
✅ New installations get correct credits immediately

## Timeline

- **Deployment:** 5-10 minutes
- **One-time fix script:** 1-2 minutes
- **Verification:** 5 minutes
- **Total:** ~15-20 minutes

## Support

If issues occur:

1. Check server logs for errors
2. Run `check-credits-issue.js` to diagnose
3. Check webhook logs in Wix dashboard
4. Verify database connection
5. Test manual sync endpoint directly:
   ```bash
   curl -X POST https://your-app.com/api/billing/sync-credits \
     -H "x-wix-instance: <instance-token>"
   ```

## Post-Deployment

After successful deployment:

1. Update documentation
2. Notify team of new sync button feature
3. Monitor for 24-48 hours
4. Consider adding to release notes
5. Update support documentation with sync button instructions

## Notes

- The periodic sync runs every 6 hours, so any missed webhooks will be caught automatically
- The manual sync button gives users immediate control
- All sync operations are logged for audit purposes
- The fix is backward compatible and won't affect existing functionality
