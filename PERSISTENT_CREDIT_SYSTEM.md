# Persistent Credit System ✅

## Overview

Credits now persist across plan changes and accumulate over time, rather than being reset.

## How It Works

### Available Credits Formula
```
Available Credits = credits_total - credits_used_month
```

### Plan Changes

#### Upgrade (Free → Starter, Starter → Pro, etc.)
```
Old Available: 50 credits
New Plan: Starter (1000 credits/month)
Result: 50 + 1000 = 1050 available credits
```

**Logic**: Keep current available credits + add new plan's monthly credits

#### Downgrade (Pro → Starter, Starter → Free, etc.)
```
Old Available: 2500 credits
New Plan: Free (100 credits/month)
Result: 2500 available credits (kept)
```

**Logic**: Keep current available credits (no reset, no addition)

#### Cancellation (Any Plan → Free)
```
Old Available: 800 credits
Cancel to: Free
Result: 800 available credits (kept)
```

**Logic**: Same as downgrade - credits are preserved

### Monthly Credit Top-Up

On the 1st of each month (or user's reset date):
```
Current Available: 150 credits
Plan: Starter (1000 credits/month)
Result: 150 + 1000 = 1150 available credits
```

**Logic**: Add plan's monthly credits to current available balance

## Examples

### Example 1: New User Journey

```
Day 1: Install app (Free plan)
  - Available: 100 credits

Day 5: Use 30 credits
  - Available: 70 credits

Day 10: Upgrade to Starter
  - Available: 70 + 1000 = 1070 credits

Day 15: Use 500 credits
  - Available: 570 credits

Day 30: Monthly reset
  - Available: 570 + 1000 = 1570 credits

Day 45: Downgrade to Free
  - Available: 1570 credits (kept!)

Month 2, Day 1: Monthly reset
  - Available: 1570 + 100 = 1670 credits
```

### Example 2: Cancel and Re-subscribe

```
Start: Starter plan, 200 available credits

Cancel to Free:
  - Available: 200 credits (kept)

Use 50 credits:
  - Available: 150 credits

Re-subscribe to Starter:
  - Available: 150 + 1000 = 1150 credits
```

### Example 3: Upgrade Path

```
Start: Free plan, 80 available credits

Upgrade to Starter:
  - Available: 80 + 1000 = 1080 credits

Upgrade to Pro:
  - Available: 1080 + 5000 = 6080 credits

Upgrade to Scale:
  - Available: 6080 + 10000 = 16080 credits
```

## Database Schema

### Fields
- `credits_total`: Total credits available
- `credits_used_month`: Credits used this billing period
- `credits_reset_on`: Date when monthly credits are added

### Calculation
```sql
-- Available credits
SELECT credits_total - credits_used_month as available
FROM app_instances
WHERE instance_id = ?;
```

## Implementation Details

### Plan Update Function

```typescript
// backend/src/db/appInstances.ts
export async function updateInstancePlan(
  instanceId: string,
  planId: string
): Promise<void>
```

**Upgrade Logic**:
1. Calculate current available credits
2. Get new plan's monthly credits
3. Set `credits_total = available + monthly`
4. Set `credits_used_month = 0`

**Downgrade Logic**:
1. Calculate current available credits
2. Set `credits_total = available`
3. Set `credits_used_month = 0`

### Monthly Reset Function

```typescript
// backend/src/db/appInstances.ts
export async function resetMonthlyCredits(): Promise<number>
```

**Logic**:
1. Calculate current available credits
2. Get plan's monthly credits
3. Set `credits_total = available + monthly`
4. Set `credits_used_month = 0`
5. Update `credits_reset_on` to next month

## API Endpoints

### GET /api/me
Returns current credit balance:
```json
{
  "creditsTotal": 1500,
  "creditsUsedMonth": 300,
  "creditsRemaining": 1200,
  "planId": "starter"
}
```

### POST /api/billing/webhook
Handles plan changes from Wix:
- Upgrade: Adds new plan's credits
- Downgrade: Preserves available credits
- Cancellation: Preserves available credits

## Benefits

### For Users
✅ Never lose credits when changing plans
✅ Credits accumulate if not used
✅ Flexibility to upgrade/downgrade without penalty
✅ Clear understanding of credit balance

### For Business
✅ Encourages upgrades (credits add up)
✅ Reduces friction for downgrades (credits kept)
✅ Fair and transparent system
✅ Aligns with user expectations

## Migration

### Existing Users

If you have existing users with the old system:

1. **No action needed** - The new logic applies on next plan change
2. **Current credits preserved** - No data loss
3. **Next monthly reset** - Will use new additive logic

### Testing

To test the new system:

1. **Upgrade Test**:
   ```
   1. Start with Free (100 credits)
   2. Use 20 credits (80 available)
   3. Upgrade to Starter
   4. Verify: 80 + 1000 = 1080 available
   ```

2. **Downgrade Test**:
   ```
   1. Start with Starter (1000 credits)
   2. Use 200 credits (800 available)
   3. Downgrade to Free
   4. Verify: 800 available (kept)
   ```

3. **Monthly Reset Test**:
   ```
   1. Have 150 available credits on Starter
   2. Wait for monthly reset (or trigger manually)
   3. Verify: 150 + 1000 = 1150 available
   ```

## Troubleshooting

### Credits showing wrong amount

**Check**:
1. Query database: `SELECT credits_total, credits_used_month FROM app_instances`
2. Calculate: `available = total - used`
3. Verify plan: `SELECT monthly_credits FROM plans WHERE id = ?`

**Fix**:
- Use sync endpoint: `POST /api/billing/sync-credits`
- Or manually update database

### Credits not adding on upgrade

**Check**:
1. Server logs for plan update
2. Verify upgrade was detected (check `isUpgrade` log)
3. Check old plan vs new plan monthly credits

**Fix**:
- Ensure plans table has correct `monthly_credits`
- Check `updateInstancePlan` function logs

### Monthly reset not working

**Check**:
1. Verify `credits_reset_on` date
2. Check if credit reset task is running
3. Look for errors in task logs

**Fix**:
- Manually trigger: Call `resetMonthlyCredits()` function
- Check scheduler is running: `startCreditResetScheduler()`

## Summary

The new persistent credit system:
- ✅ Preserves credits across plan changes
- ✅ Adds credits on upgrade
- ✅ Keeps credits on downgrade/cancellation
- ✅ Adds monthly credits to balance (not reset)
- ✅ Fair and transparent for users
- ✅ Encourages engagement and upgrades
