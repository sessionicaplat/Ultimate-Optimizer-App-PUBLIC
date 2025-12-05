# Wix Billing URL - Quick Reference

## ✅ Correct Format (2025)
```
https://www.wix.com/apps/upgrade/<APP_ID>?appInstanceId=<INSTANCE_ID>
```

## ❌ Wrong Format (Old/Internal)
```
https://manage.wix.com/app-pricing-plans/<APP_ID>/plan?app-instance-id=<INSTANCE_ID>&origin=null&meta-site-id=<SITE_ID>
```

---

## Key Differences

| Element | ❌ Wrong | ✅ Correct |
|---------|---------|-----------|
| Domain | `manage.wix.com` | `www.wix.com` |
| Path | `/app-pricing-plans/{id}/plan` | `/apps/upgrade/{id}` |
| Param Name | `app-instance-id` (hyphens) | `appInstanceId` (camelCase) |
| Extra Params | `origin`, `meta-site-id` | None needed |

---

## Your Implementation

### Backend (`backend/src/routes/billing.ts`)
```typescript
const pricingPageUrl = `https://www.wix.com/apps/upgrade/${appId}?appInstanceId=${instanceId}`;
```
✅ **Correct**

### Frontend (`frontend/src/pages/BillingCredits.tsx`)
```typescript
const response = await fetchWithAuth('/api/billing/manage-plans-url');
window.top.location.href = response.url;
```
✅ **Correct**

---

## Quick Test

```bash
node test-billing-url.js
```

Should output: `✅ No issues found - URL format is correct!`

---

## What to Check

1. **Backend logs** - Should show `www.wix.com/apps/upgrade`
2. **Browser console** - Should show `✅ URL format is correct`
3. **Network tab** - Response should contain correct URL
4. **Environment** - `WIX_APP_ID` must be set

---

## If You See the Wrong URL

It's likely:
- Wix's internal redirect (normal)
- Browser cache (clear it)
- Old code not deployed (push changes)

**As long as your code generates the correct URL, you're good!**
