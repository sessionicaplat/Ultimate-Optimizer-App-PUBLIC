# How to Get Your Wix Product IDs

## 🚨 **Problem**

The billing checkout is timing out because the product IDs are not configured correctly. You're using `'pro'` as the product ID, but Wix needs the actual UUID from your pricing plans.

---

## ✅ **Solution: Get Product IDs**

### **Method 1: Run Helper Script (Recommended)**

```bash
cd backend
npx ts-node src/utils/listWixPlans.ts
```

This will output something like:

```
✅ Found 3 pricing plan(s):

Plan 1:
  Name: Starter
  ID: db60089f-9725-49dc-ad84-c6bd889b0b80
  Price: 9.00 USD
  Frequency: 1 MONTH

Plan 2:
  Name: Pro
  ID: a1b2c3d4-e5f6-7890-abcd-ef1234567890
  Price: 19.00 USD
  Frequency: 1 MONTH

Plan 3:
  Name: Scale
  ID: f1e2d3c4-b5a6-9807-fedc-ba0987654321
  Price: 49.00 USD
  Frequency: 1 MONTH

📋 Environment Variables to Set:

WIX_PRODUCT_ID_STARTER=db60089f-9725-49dc-ad84-c6bd889b0b80
WIX_PRODUCT_ID_PRO=a1b2c3d4-e5f6-7890-abcd-ef1234567890
WIX_PRODUCT_ID_SCALE=f1e2d3c4-b5a6-9807-fedc-ba0987654321
```

### **Method 2: Wix Developer Dashboard**

1. Go to https://dev.wix.com
2. Select your app
3. Click **Pricing & Plans**
4. Click on each plan
5. Copy the **Plan ID** (UUID)

---

## 🔧 **Set Environment Variables in Render**

1. Go to https://dashboard.render.com
2. Select your backend service
3. Click **Environment** tab
4. Click **Add Environment Variable**
5. Add each variable:

```
Key: WIX_PRODUCT_ID_STARTER
Value: <paste-uuid-here>

Key: WIX_PRODUCT_ID_PRO
Value: <paste-uuid-here>

Key: WIX_PRODUCT_ID_SCALE
Value: <paste-uuid-here>
```

6. Click **Save Changes**
7. Render will automatically restart your service

---

## ✅ **Verify It Works**

After setting the environment variables:

1. Visit your app's billing page
2. Click "Upgrade" on any plan
3. Check the logs for:

```
🔍 Product ID mapping: {
  planId: 'pro',
  productId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',  // ← Should be UUID now!
  envVarName: 'WIX_PRODUCT_ID_PRO',
  envVarValue: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'  // ← Not 'NOT SET'!
}
```

4. Checkout should work within 2-3 seconds

---

## 🐛 **Troubleshooting**

### Issue: Script fails with "No plans found"

**Solution:** Create pricing plans in Wix Dashboard first:
1. Go to https://dev.wix.com → Your App → Pricing & Plans
2. Click "Add Plan"
3. Create Starter, Pro, and Scale plans
4. **Publish** each plan (not draft!)
5. Run the script again

### Issue: Still getting timeout

**Possible causes:**
1. Product IDs don't match Wix Dashboard
2. Plans are not published
3. Wix API is having issues (check https://status.wix.com)

**Solution:**
1. Double-check product IDs match exactly
2. Ensure all plans are published
3. Wait a few minutes and try again

### Issue: Environment variables not updating

**Solution:**
1. Make sure you clicked "Save Changes" in Render
2. Wait for service to restart (check logs)
3. Verify variables are set: Go to Environment tab and check they're listed

---

## 📝 **Example Configuration**

Your `.env` file (for local development):

```env
# Wix App Credentials
WIX_APP_ID=9e24e724-5bdb-4658-8554-742515539a065
WIX_APP_SECRET=your-secret-here
WIX_PUBLIC_KEY=your-public-key-here

# Wix Product IDs (UUIDs from Wix Dashboard)
WIX_PRODUCT_ID_STARTER=db60089f-9725-49dc-ad84-c6bd889b0b80
WIX_PRODUCT_ID_PRO=a1b2c3d4-e5f6-7890-abcd-ef1234567890
WIX_PRODUCT_ID_SCALE=f1e2d3c4-b5a6-9807-fedc-ba0987654321
```

---

## 🎯 **Success Criteria**

After correct setup:

- ✅ Script shows all your plans with UUIDs
- ✅ Environment variables are set in Render
- ✅ Logs show correct product IDs (UUIDs, not strings)
- ✅ Checkout URL generates in 2-3 seconds
- ✅ User redirects to Wix checkout page

---

## 📞 **Need Help?**

If you're still having issues:

1. Run the helper script and share the output
2. Check Render logs for the product ID mapping
3. Verify plans are published in Wix Dashboard
4. Check https://status.wix.com for Wix API issues

---

**Remember**: The product IDs must be the actual UUIDs from Wix, not just the plan names!
