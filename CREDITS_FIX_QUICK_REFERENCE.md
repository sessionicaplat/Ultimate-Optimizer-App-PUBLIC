# Credits Fix - Quick Reference Card

## 🚀 Deploy Now

```bash
# 1. Commit and push
git add .
git commit -m "Fix: Permanent credit assignment with auto-sync"
git push

# 2. After deployment, run one-time fix
node backend/fix-credits-sync.js

# 3. Verify
node backend/check-credits-issue.js
```

## 🔍 Diagnose Issues

```bash
# Check current state
node backend/check-credits-issue.js

# Check server logs
tail -f logs/server.log | grep CreditSync

# Test manual sync endpoint
curl -X POST https://your-app.com/api/billing/sync-credits \
  -H "x-wix-instance: <token>"
```

## 🛠️ Fix Issues

```bash
# Fix all instances
node backend/fix-credits-sync.js

# Or use manual sync button in UI
# Go to: Billing & Credits → Click "🔄 Sync Credits"
```

## 📊 What Changed

### Backend
- ✅ Simplified credit update logic
- ✅ Added sync during provisioning
- ✅ Added periodic sync (every 6 hours)
- ✅ Added manual sync endpoint

### Frontend
- ✅ Added "🔄 Sync Credits" button

### New Files
- `backend/src/tasks/creditSync.ts` - Periodic sync scheduler
- `backend/check-credits-issue.js` - Diagnostic tool
- `backend/fix-credits-sync.js` - One-time fix script

## 🎯 How It Works

```
4 Safety Nets:
1. Provisioning → Sync on app access
2. Webhooks → Real-time updates
3. Periodic → Every 6 hours
4. Manual → User button
```

## ✅ Success Checklist

- [ ] Code deployed
- [ ] One-time fix script run
- [ ] No mismatches in check script
- [ ] Manual sync button works
- [ ] Server logs show sync operations
- [ ] Users see correct credits

## 🔄 Sync Schedule

| Trigger | Frequency | Purpose |
|---------|-----------|---------|
| Provisioning | On app access | Immediate fix |
| Webhook | Real-time | Subscription changes |
| Periodic | Every 6 hours | Catch misses |
| Manual | On-demand | User control |

## 📝 Log Messages

**Good:**
```
[CreditSync] Running credit sync task...
✅ Synced credits for instance abc123: 100 → 5000
[CreditSync] Successfully synced credits for 1 instance(s)
```

**Also Good:**
```
[CreditSync] All instances already have correct credits
```

**Bad:**
```
[CreditSync] Error running credit sync task: ...
```

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| Credits still 100 | Click sync button or wait 6 hours |
| Sync button not working | Check browser console, verify auth |
| Periodic sync not running | Check server logs, verify scheduler started |
| Database errors | Check DATABASE_URL, verify connection |

## 📞 Quick Commands

```bash
# Diagnose
node backend/check-credits-issue.js

# Fix
node backend/fix-credits-sync.js

# Monitor
tail -f logs/server.log | grep -E "CreditSync|Updating instance plan"

# Test endpoint
curl -X POST http://localhost:3000/api/billing/sync-credits \
  -H "x-wix-instance: <token>"
```

## 🎓 Key Functions

| Function | Purpose |
|----------|---------|
| `updateInstancePlan()` | Update plan and credits |
| `syncInstanceCredits()` | Sync single instance |
| `syncAllInstanceCredits()` | Sync all instances |
| `startCreditSyncScheduler()` | Start periodic sync |

## 📈 Monitoring

```bash
# Check sync operations
grep "CreditSync" logs/server.log

# Check plan updates
grep "Updating instance plan" logs/server.log

# Check webhook events
grep "Billing webhook event" logs/server.log
```

## 🔐 Security

- ✅ Manual sync requires authentication
- ✅ Only syncs caller's own instance
- ✅ No sensitive data in logs
- ✅ All operations audited

## 💡 Pro Tips

1. Run `check-credits-issue.js` before and after fix
2. Monitor logs for first 24 hours after deployment
3. Test manual sync button immediately after deployment
4. Keep fix scripts for future use
5. Document any edge cases discovered

## 📚 Documentation

- `CREDITS_FIX_SUMMARY.md` - Executive summary
- `CREDITS_PERMANENT_FIX.md` - Complete guide
- `DEPLOY_CREDITS_FIX.md` - Deployment steps
- `CREDITS_NOT_ASSIGNED_ISSUE.md` - Problem analysis

## ⚡ Emergency Rollback

```bash
git revert HEAD~2..HEAD
git push
```

## 🎉 Success Metrics

- ✅ 0 credit mismatches
- ✅ 0 support tickets
- ✅ Sync logs clean
- ✅ Users happy
