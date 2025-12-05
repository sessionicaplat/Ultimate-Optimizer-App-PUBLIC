# Credit Reset Date Fix - Subscription-Based Billing Cycles

## 🎯 ISSUE

The credit reset date was showing the calendar month (e.g., "December 1, 2025") for all users, including paid subscribers. This is incorrect for paid subscriptions.

### Expected Behavior:

- **Free Plan:** Credits reset on the 1st of each month (calendar month)
- **Paid Plans:** Credits reset 30 days from subscription start date (billing cycle)

### Example:

```
User subscribes on November 14, 2025
❌ Wrong: "Credits reset on December 1, 2025"
✅ Correct: "Next billing cycle: December 14, 2025"
```

---

## 🔍 ROOT CAUSE

The `/api/me` endpoint was always returning `credits_reset_on` (calendar month) for all users, regardless of their plan type.

**File:** `backend/src/routes/me.ts`

**Before:**
```typescript
res.json({
  creditsResetOn: instance.credits_reset_on.toISOString(), // ❌ Always calendar month
});
```

The database already has the correct `next_billing_date` column for paid subscriptions, but it wasn't being used!

---

## ✅ SOLUTION IMPLEMENTED

### 1. Backend: Return Correct Reset Date

**File:** `backend/src/routes/me.ts`

**After:**
```typescript
// Determine the correct reset date:
// - For paid subscriptions: use next_billing_date (30-day cycle)
// - For free plan: use credits_reset_on (calendar month)
const resetDate = instance.next_billing_date 
  ? instance.next_billing_date.toISOString()
  : instance.credits_reset_on.toISOString();

res.json({
  creditsResetOn: resetDate, // ✅ Correct date based on plan type
});
```

### 2. Frontend: Better Messaging

**File:** `frontend/src/pages/BillingCredits.tsx`

**Before:**
```typescript
<span>Credits reset on {formatDate(account.resetDate)}</span>
```

**After:**
```typescript
<span>
  {currentPlan.id === 'free' 
    ? `Credits reset on ${formatDate(account.resetDate)}`
    : `Next billing cycle: ${formatDate(account.resetDate)}`
  }
</span>
```

---

## 📊 BEHAVIOR COMPARISON

### Free Plan Users:

**Before:**
```
🔄 Credits reset on December 1, 2025
```

**After:**
```
🔄 Credits reset on December 1, 2025
```
✅ No change - calendar month is correct for free plan

---

### Paid Plan Users (Subscribed Nov 14):

**Before:**
```
🔄 Credits reset on December 1, 2025  ❌ Wrong!
```

**After:**
```
🔄 Next billing cycle: December 14, 2025  ✅ Correct!
```

---

### Paid Plan Users (Subscribed Nov 28):

**Before:**
```
🔄 Credits reset on December 1, 2025  ❌ Wrong! (only 3 days)
```

**After:**
```
🔄 Next billing cycle: December 28, 2025  ✅ Correct! (30 days)
```

---

## 🎯 HOW IT WORKS

### Database Schema:

```sql
app_instances:
  - credits_reset_on: DATE          -- Calendar month (1st of next month)
  - next_billing_date: TIMESTAMPTZ  -- 30 days from subscription start
  - subscription_start_date: TIMESTAMPTZ -- When user first subscribed
```

### Logic Flow:

```
User on Free Plan:
  → next_billing_date = NULL
  → Use credits_reset_on (calendar month)
  → Display: "Credits reset on December 1, 2025"

User on Paid Plan:
  → next_billing_date = subscription_start_date + 30 days
  → Use next_billing_date (billing cycle)
  → Display: "Next billing cycle: December 14, 2025"
```

### When next_billing_date is Set:

```typescript
// In updateInstancePlan() when upgrading to paid plan:
if (isUpgradingToFirstPaidPlan) {
  subscriptionStartDate = new Date();
  nextBillingDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
}
```

### When Credits are Added:

```sql
-- Monthly credit reset task checks:
WHERE (
  -- Paid plans: check billing cycle
  (next_billing_date IS NOT NULL AND next_billing_date <= NOW())
  OR
  -- Free plan: check calendar month
  (next_billing_date IS NULL AND credits_reset_on <= CURRENT_DATE)
)
```

---

## 🧪 TESTING

### Test Case 1: Free Plan User

```
1. User on free plan
2. Check billing page
3. Should see: "Credits reset on [1st of next month]"
```

### Test Case 2: New Paid Subscriber (Nov 14)

```
1. User subscribes on November 14, 2025
2. Database sets:
   - subscription_start_date = 2025-11-14
   - next_billing_date = 2025-12-14
3. Check billing page
4. Should see: "Next billing cycle: December 14, 2025"
```

### Test Case 3: Existing Paid Subscriber (Nov 28)

```
1. User subscribed on November 28, 2025
2. Database has:
   - subscription_start_date = 2025-11-28
   - next_billing_date = 2025-12-28
3. Check billing page
4. Should see: "Next billing cycle: December 28, 2025"
```

### Test Case 4: After Billing Cycle

```
1. User subscribed on November 14, 2025
2. Time passes to December 15, 2025
3. Credit reset task runs
4. Database updates:
   - next_billing_date = 2025-01-14 (30 days later)
5. Check billing page
6. Should see: "Next billing cycle: January 14, 2026"
```

---

## 📈 IMPACT

### Before Fix:

- ❌ All users saw calendar month reset date
- ❌ Confusing for paid subscribers
- ❌ Incorrect expectations about when credits renew
- ❌ Users might think they're losing days of service

### After Fix:

- ✅ Free users see calendar month (correct)
- ✅ Paid users see their actual billing cycle date (correct)
- ✅ Clear messaging: "Credits reset" vs "Next billing cycle"
- ✅ Accurate expectations about credit renewal

---

## 🎨 UI CHANGES

### Free Plan:

```
┌─────────────────────────────────────────────────┐
│ Credit Usage This Month                         │
│                                                 │
│ 150            50             200               │
│ Remaining      Used           Total             │
│                                                 │
│ ████████████████████████████░░░░░░░░ 25% used  │
│                                                 │
│ 🔄 Credits reset on December 1, 2025           │
└─────────────────────────────────────────────────┘
```

### Paid Plan (Starter - Subscribed Nov 14):

```
┌─────────────────────────────────────────────────┐
│ Credit Usage This Month                         │
│                                                 │
│ 900            100            1,000             │
│ Remaining      Used           Total             │
│                                                 │
│ ████████████████████████████████████░░░░ 10%   │
│                                                 │
│ 🔄 Next billing cycle: December 14, 2025       │
└─────────────────────────────────────────────────┘
```

---

## ✅ VERIFICATION

After deployment, verify:

1. **Free plan users:**
   ```sql
   SELECT instance_id, plan_id, credits_reset_on, next_billing_date
   FROM app_instances
   WHERE plan_id = 'free';
   
   -- Should have:
   -- credits_reset_on = 2025-12-01
   -- next_billing_date = NULL
   ```

2. **Paid plan users:**
   ```sql
   SELECT instance_id, plan_id, subscription_start_date, next_billing_date
   FROM app_instances
   WHERE plan_id != 'free';
   
   -- Should have:
   -- subscription_start_date = [when they subscribed]
   -- next_billing_date = [30 days from subscription_start_date]
   ```

3. **Frontend display:**
   - Free plan: "Credits reset on December 1, 2025"
   - Paid plan: "Next billing cycle: [30 days from subscription]"

---

## 🚀 DEPLOYMENT

### Changes Made:

1. ✅ `backend/src/routes/me.ts` - Return correct reset date based on plan type
2. ✅ `frontend/src/pages/BillingCredits.tsx` - Display appropriate message

### No Breaking Changes:

- API response structure unchanged (still returns `creditsResetOn`)
- Only the value changes based on plan type
- Frontend gracefully handles both date formats

### Backward Compatible:

- If `next_billing_date` is NULL, falls back to `credits_reset_on`
- Works for both new and existing users
- No migration needed

---

## 📝 SUMMARY

**Problem:** All users saw calendar month reset date, even paid subscribers with 30-day billing cycles

**Root Cause:** API always returned `credits_reset_on` instead of checking `next_billing_date`

**Solution:** 
- Backend: Return `next_billing_date` for paid plans, `credits_reset_on` for free
- Frontend: Show "Next billing cycle" for paid, "Credits reset on" for free

**Impact:** Users now see accurate credit renewal dates based on their subscription cycle

**Result:** ✅ Correct billing cycle dates for all users!
