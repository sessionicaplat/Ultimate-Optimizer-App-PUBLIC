# Architecture: Wix Hosted Billing

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER JOURNEY                             │
└─────────────────────────────────────────────────────────────────┘

    User Opens App
         ↓
    ┌─────────────┐
    │ Credits Page│  ← Shows usage, balance, reset date
    └─────────────┘
         ↓
    Clicks "Upgrade"
         ↓
    ┌──────────────────┐
    │ Wix Pricing Page │  ← Wix shows plans (configured in dashboard)
    └──────────────────┘
         ↓
    Selects Plan
         ↓
    ┌──────────────────┐
    │ Wix Checkout     │  ← Wix handles payment securely
    └──────────────────┘
         ↓
    Payment Complete
         ↓
    ┌──────────────────┐
    │ Webhook to App   │  ← Wix notifies app of purchase
    └──────────────────┘
         ↓
    ┌──────────────────┐
    │ Update Database  │  ← App updates plan & credits
    └──────────────────┘
         ↓
    ┌──────────────────┐
    │ Redirect to App  │  ← User returns to app
    └──────────────────┘
```

---

## Component Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  BillingCredits.tsx                                              │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Current Plan Card                                           │ │
│  │  - Plan name (Free, Starter, Pro, Scale)                   │ │
│  │  - Price ($0, $9, $19, $49)                                │ │
│  │  - Monthly credits (100, 1K, 5K, 25K)                      │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Credit Usage Card                                           │ │
│  │  - Credits remaining                                        │ │
│  │  - Credits used                                             │ │
│  │  - Total credits                                            │ │
│  │  - Progress bar                                             │ │
│  │  - Reset date                                               │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Upgrade CTA Card (Free users only)                         │ │
│  │  - "Need More Credits?" heading                            │ │
│  │  - Description                                              │ │
│  │  - [View Plans & Upgrade] button                           │ │
│  │  - Redirects to Wix                                         │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Manage Subscription Card (Paid users only)                 │ │
│  │  - "Manage Subscription" heading                           │ │
│  │  - Description                                              │ │
│  │  - [Manage Subscription] button                            │ │
│  │  - Redirects to Wix                                         │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Tips Card                                                   │ │
│  │  - Credit usage tips                                        │ │
│  │  - Reset information                                        │ │
│  │  - Rollover policy                                          │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         DATA FLOW                                │
└─────────────────────────────────────────────────────────────────┘

Frontend                    Backend                    Wix
   │                           │                         │
   │  GET /api/me              │                         │
   ├──────────────────────────>│                         │
   │                           │                         │
   │  POST /api/billing/       │                         │
   │       sync-credits        │                         │
   ├──────────────────────────>│                         │
   │                           │  Get Purchase History   │
   │                           ├────────────────────────>│
   │                           │<────────────────────────┤
   │                           │  Current plan data      │
   │<──────────────────────────┤                         │
   │  Account data             │                         │
   │                           │                         │
   │  [User clicks upgrade]    │                         │
   │                           │                         │
   │  Redirect to:             │                         │
   │  wix.com/apps/upgrade/    │                         │
   │  {APP_ID}                 │                         │
   ├───────────────────────────┼────────────────────────>│
   │                           │                         │
   │                           │  [User completes        │
   │                           │   checkout on Wix]      │
   │                           │                         │
   │                           │<────────────────────────┤
   │                           │  Webhook: Purchase      │
   │                           │                         │
   │                           │  Update database:       │
   │                           │  - plan_id              │
   │                           │  - credits_total        │
   │                           │  - credits_used_month   │
   │                           │                         │
   │<──────────────────────────┼─────────────────────────┤
   │  Redirect back to app     │                         │
   │                           │                         │
```

---

## Backend Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  Routes                                                          │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ GET /api/me                                                 │ │
│  │  - Returns instance info                                    │ │
│  │  - Returns credit balance                                   │ │
│  │  - Returns current plan                                     │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ POST /api/billing/sync-credits                             │ │
│  │  - Queries Wix for current plan                            │ │
│  │  - Updates database if plan changed                        │ │
│  │  - Syncs credits to plan amount                            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ POST /api/webhooks/billing                                 │ │
│  │  - Receives webhook from Wix                               │ │
│  │  - Processes purchase events                               │ │
│  │  - Updates plan and credits                                │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  Database                                                        │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ app_instances table                                         │ │
│  │  - instance_id                                              │ │
│  │  - plan_id (free, starter, pro, scale)                     │ │
│  │  - credits_total                                            │ │
│  │  - credits_used_month                                       │ │
│  │  - credits_reset_on                                         │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## Wix Integration

```
┌─────────────────────────────────────────────────────────────────┐
│                    WIX CONFIGURATION                             │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  Wix Developer Dashboard                                         │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Pricing & Plans                                             │ │
│  │  - Pricing Page: Internal ✓                                │ │
│  │  - Plans:                                                   │ │
│  │    • Free: $0/mo, 200 credits                              │ │
│  │    • Starter: $9/mo, 1,000 credits                         │ │
│  │    • Pro: $19/mo, 5,000 credits                            │ │
│  │    • Scale: $49/mo, 25,000 credits                         │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Webhooks                                                    │ │
│  │  - Billing events → https://your-app.com/api/webhooks/     │ │
│  │                     billing                                 │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## Security Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    SECURITY & AUTH                               │
└─────────────────────────────────────────────────────────────────┘

User Request
     ↓
┌─────────────────┐
│ Wix Instance    │  ← Wix adds ?instance=TOKEN to iframe URL
│ Token in URL    │
└─────────────────┘
     ↓
┌─────────────────┐
│ Frontend stores │  ← Token stored in sessionStorage
│ token           │
└─────────────────┘
     ↓
┌─────────────────┐
│ API calls       │  ← Token sent in X-Wix-Instance header
│ include token   │
└─────────────────┘
     ↓
┌─────────────────┐
│ Backend verifies│  ← verifyInstance middleware
│ token           │
└─────────────────┘
     ↓
┌─────────────────┐
│ Request         │  ← Authenticated request processed
│ processed       │
└─────────────────┘
```

---

## Credit Management

```
┌─────────────────────────────────────────────────────────────────┐
│                    CREDIT LIFECYCLE                              │
└─────────────────────────────────────────────────────────────────┘

New User
   ↓
┌──────────────────┐
│ Free Plan        │  200 credits/month
│ Assigned         │
└──────────────────┘
   ↓
User Optimizes Products
   ↓
┌──────────────────┐
│ Credits Deducted │  credits_used_month++
└──────────────────┘
   ↓
User Upgrades
   ↓
┌──────────────────┐
│ Webhook Received │  Plan changed to "starter"
└──────────────────┘
   ↓
┌──────────────────┐
│ Credits Updated  │  credits_total = 1000
│                  │  credits_used_month preserved
└──────────────────┘
   ↓
Monthly Reset (Cron Job)
   ↓
┌──────────────────┐
│ Credits Reset    │  credits_used_month = 0
│                  │  credits_reset_on = next month
└──────────────────┘
```

---

## Error Handling

```
┌─────────────────────────────────────────────────────────────────┐
│                    ERROR SCENARIOS                               │
└─────────────────────────────────────────────────────────────────┘

Scenario 1: Wrong App ID
   User clicks upgrade
   ↓
   Redirects to Wix
   ↓
   Wix shows "App not found"
   ↓
   Solution: Update VITE_WIX_APP_ID

Scenario 2: Plans not published
   User clicks upgrade
   ↓
   Redirects to Wix
   ↓
   Wix shows empty page
   ↓
   Solution: Publish plans in Wix Dashboard

Scenario 3: Webhook fails
   User completes purchase
   ↓
   Webhook not received
   ↓
   Credits not updated
   ↓
   Solution: Manual sync via /api/billing/sync-credits

Scenario 4: Credit sync fails
   Page loads
   ↓
   Auto-sync fails
   ↓
   Shows cached data
   ↓
   Solution: Retry or manual sync
```

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    DEPLOYMENT                                    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────┐
│ GitHub Repo     │
└─────────────────┘
        ↓
┌─────────────────┐
│ Render.com      │
│ ┌─────────────┐ │
│ │ Frontend    │ │  ← React app with Vite
│ │ Service     │ │     Env: VITE_WIX_APP_ID
│ └─────────────┘ │
│ ┌─────────────┐ │
│ │ Backend     │ │  ← Node.js/Express
│ │ Service     │ │     Env: WIX_APP_ID, WIX_PUBLIC_KEY
│ └─────────────┘ │
│ ┌─────────────┐ │
│ │ PostgreSQL  │ │  ← Database
│ │ Database    │ │
│ └─────────────┘ │
└─────────────────┘
        ↓
┌─────────────────┐
│ Wix Platform    │
│ ┌─────────────┐ │
│ │ Dashboard   │ │  ← User accesses app
│ │ Extension   │ │
│ └─────────────┘ │
│ ┌─────────────┐ │
│ │ Billing     │ │  ← Handles payments
│ │ System      │ │
│ └─────────────┘ │
└─────────────────┘
```

---

**Architecture Status:** ✅ Complete
**Documentation:** Comprehensive
**Ready for:** Production Deployment
