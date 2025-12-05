# MetaSiteId Debug Fix

## 🐛 Issue

The instance token doesn't contain `metaSiteId` or `siteId` fields, causing the manage plans URL generation to fail with:
```
No metaSiteId found in instance token
```

## 🔍 What I Did

Added comprehensive logging and fallback logic to the `/api/billing/manage-plans-url` endpoint:

### 1. Log All Token Fields
```typescript
console.log('Instance token payload fields:', Object.keys(payload));
console.log('Instance token payload:', JSON.stringify(payload, null, 2));
```

This will show us exactly what fields are available in your instance token.

### 2. Try Multiple Field Names
```typescript
const metaSiteId = payload.metaSiteId || 
                   payload.siteId || 
                   payload.uid || 
                   payload.siteGuid ||
                   payload.vendorProductId;
```

### 3. Fallback URL
If no site ID is found, use a simpler URL format:
```typescript
const fallbackUrl = `https://www.wix.com/apps/upgrade/${appId}`;
```

This URL format might work without the `meta-site-id` parameter.

## 🚀 Next Steps

1. **Deploy this change**
2. **Click the upgrade button** in your app
3. **Check the backend logs** to see:
   - What fields are in the instance token
   - What the actual payload looks like
4. **Share the logs** with me so I can see the exact field names

## 📊 Expected Log Output

You should see something like:
```
Instance token payload fields: ['instanceId', 'appDefId', 'signDate', 'uid', ...]
Instance token payload: {
  "instanceId": "...",
  "appDefId": "...",
  "uid": "...",
  ...
}
```

Once we see the actual fields, I can update the code to use the correct field name for the site ID.

## 🎯 Possible Outcomes

### Outcome 1: Site ID Found
If one of the alternative field names contains the site ID, the URL will be constructed correctly:
```
https://manage.wix.com/app-pricing-plans/{appId}/plan?origin=preview&meta-site-id={siteId}
```

### Outcome 2: Fallback URL Used
If no site ID is found, you'll get the simpler URL:
```
https://www.wix.com/apps/upgrade/{appId}
```

This might redirect to the manage plans page anyway, or we'll need to find another approach.

## 📝 Alternative Approaches

If the instance token doesn't have the site ID, we have other options:

### Option A: Use Wix SDK
Query the Wix API to get the site ID:
```typescript
const siteInfo = await wixClient.getSiteInfo();
const metaSiteId = siteInfo.metaSiteId;
```

### Option B: Store Site ID in Database
When the app is installed, store the site ID in the database and retrieve it later.

### Option C: Use Different URL Format
Some Wix apps use different URL formats that don't require the site ID.

---

**Status:** Debug logging added
**Next:** Deploy and check logs
**Goal:** Find the correct field name for site ID
