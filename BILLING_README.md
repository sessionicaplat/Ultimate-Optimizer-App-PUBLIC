# Billing System - Self-Hosted Implementation

## 🎯 Overview

This is a complete self-hosted billing system for your Wix app that provides:
- Beautiful in-app pricing page
- Instant credit updates after payment
- Proper credit accumulation (never lose credits!)
- 30-day subscription billing cycles
- Robust webhook handling

---

## 🚀 Quick Start

### 1. Deploy (5 minutes)

```bash
# Run migration
cd backend
npm run migrate up

# Deploy backend
npm run build

# Deploy frontend
cd ../frontend
npm run build
```

### 2. Configure Wix Dashboard

1. Go to https://dev.wix.com
2. Select your app → **Pricing & Plans**
3. Select **"Link to External Pricing Page"**
4. Set URL: `https://www.wix.com/my-account/app/{appId}/{instanceId}`
5. Save

### 3. Test

1. Visit billing page in your app
2. Click "Upgrade" on any plan
3. Complete checkout
4. Verify redirect back to app
5. Verify credits update within 60 seconds

---

## 📁 File Structure

```
backend/
├── migrations/
│   └── 20251115000000_add_subscription_tracking.js  # NEW
├── src/
│   ├── db/
│   │   ├── types.ts                                 # UPDATED
│   │   └── appInstances.ts                          # UPDATED
│   └── routes/
│       └── billing.ts                               # UPDATED

frontend/
└── src/
    └── pages/
        ├── BillingCredits.tsx                       # REWRITTEN
        └── BillingCredits.css                       # REWRITTEN

docs/
├── SELF_HOSTED_BILLING_IMPLEMENTATION.md            # Complete guide
├── BILLING_DEPLOYMENT_CHECKLIST.md                  # Deployment steps
├── BILLING_SOLUTION_SUMMARY.md                      # Overview
├── QUICK_START_BILLING.md                           # Quick start
├── BILLING_FLOW_DIAGRAM.md                          # Visual diagrams
├── IMPLEMENTATION_COMPLETE.md                       # Summary
└── BILLING_README.md                                # This file
```

---

## 🎨 Features

### User Experience
- ✅ All 4 plans visible at once
- ✅ Current plan highlighted
- ✅ Popular plan badge
- ✅ Feature comparison
- ✅ Direct upgrade buttons
- ✅ Real-time payment processing
- ✅ Success celebrations

### Credit System
- ✅ Credits accumulate on upgrade
- ✅ Credits preserved on downgrade
- ✅ Monthly credits added every 30 days
- ✅ No credit loss
- ✅ Instant updates after payment

### Technical
- ✅ Webhook deduplication
- ✅ Timeout protection
- ✅ Error handling
- ✅ Responsive design
- ✅ Performance optimized

---

## 💳 Credit Logic

### Upgrades
```
Free (200) → Starter (1000) = 1200 credits
Starter (1200) → Pro (5000) = 6200 credits
Pro (6200) → Scale (25000) = 31200 credits
```

### Downgrades
```
Scale (31200) → Pro = 31200 credits (keep all)
Pro (6200) → Starter = 6200 credits (keep all)
Any → Free = 200 credits (reset)
```

### Monthly Billing
```
Day 1: 1150 credits
Day 30: 500 remaining + 1000 new = 1500 credits
Day 60: 800 remaining + 1000 new = 1800 credits
```

---

## 🔧 API Endpoints

### New Endpoint
```
POST /api/billing/checkout-url
Body: { planId: 'starter' }
Response: { url: 'https://wix.com/checkout/...' }
```

### Existing Endpoints
```
GET /api/me                          # Get credit balance
POST /api/billing/sync-credits       # Manual sync
GET /api/billing/subscription        # Get subscription info
POST /api/webhooks/billing           # Webhook handler
```

---

## 🗄️ Database Schema

### New Columns
```sql
subscription_start_date TIMESTAMPTZ  -- When user first subscribed
next_billing_date TIMESTAMPTZ        -- Next 30-day billing cycle
```

### Migration
```bash
npm run migrate up    # Add columns
npm run migrate down  # Remove columns (rollback)
```

---

## 🔄 User Flow

```
1. User visits Billing & Credits page
2. Sees all 4 plans in grid
3. Clicks "Upgrade" on desired plan
4. Redirects to Wix checkout
5. Completes payment
6. Redirects back to app with ?payment=success
7. App shows "Processing payment..."
8. App polls for updates every 5 seconds
9. Webhook fires and updates database
10. App detects update and shows success
11. User sees new credit balance
```

---

## 🐛 Troubleshooting

### Credits not updating
**Check**: Backend logs for webhook processing
**Solution**: Webhook should fire within 30 seconds

### Checkout URL fails
**Check**: Environment variables for product IDs
**Solution**: Verify `WIX_PRODUCT_ID_*` are set

### Redirect doesn't work
**Check**: Wix Dashboard external pricing page URL
**Solution**: Should be `https://www.wix.com/my-account/app/{appId}/{instanceId}`

### Duplicate credits
**Check**: Webhook lock system logs
**Solution**: Lock system should prevent this automatically

---

## 📊 Monitoring

### Key Metrics
- Checkout conversion rate: > 70%
- Credit update time: < 30 seconds
- Error rate: < 1%
- Page load time: < 2 seconds

### Logs to Watch
- `💳 Purchase webhook received`
- `🔒 Acquired lock`
- `📈 UPGRADE` or `📉 DOWNGRADE`
- `✅ Instance plan updated`

---

## 🔐 Security

- ✅ Token validation on all API calls
- ✅ Webhook signature verification
- ✅ SQL injection protection
- ✅ XSS protection
- ✅ Rate limiting

---

## 📚 Documentation

### For Developers
- **`SELF_HOSTED_BILLING_IMPLEMENTATION.md`** - Complete implementation guide
- **`BILLING_FLOW_DIAGRAM.md`** - Visual flow diagrams

### For Deployment
- **`BILLING_DEPLOYMENT_CHECKLIST.md`** - Step-by-step deployment
- **`QUICK_START_BILLING.md`** - 5-minute quick start

### For Reference
- **`BILLING_SOLUTION_SUMMARY.md`** - Problems solved and benefits
- **`IMPLEMENTATION_COMPLETE.md`** - What was delivered

---

## ✅ Testing Checklist

- [ ] Billing page loads
- [ ] All 4 plans visible
- [ ] Current plan highlighted
- [ ] Upgrade redirects to checkout
- [ ] Payment redirects back to app
- [ ] Credits update within 60 seconds
- [ ] No duplicate credits
- [ ] Responsive on mobile
- [ ] Error handling works
- [ ] Success message appears

---

## 🚨 Emergency Rollback

If something goes wrong:

```bash
# 1. Rollback database
cd backend
npm run migrate down

# 2. Revert frontend deployment
# (Use your hosting platform's rollback feature)

# 3. Revert backend deployment
# (Use your hosting platform's rollback feature)
```

---

## 🎉 Success Criteria

✅ Users see all plans on one page
✅ Upgrade flow completes in < 2 minutes
✅ Credits update within 60 seconds
✅ No duplicate credit additions
✅ Credits accumulate correctly
✅ UI is responsive and beautiful
✅ Error handling is robust
✅ Performance is fast

---

## 📞 Support

### Need Help?

1. Check documentation files
2. Review backend logs
3. Check Wix Dashboard webhooks
4. Verify environment variables
5. Test with fresh browser session

### Common Issues

| Issue | Solution |
|-------|----------|
| Migration fails | Set `DATABASE_URL` environment variable |
| Checkout fails | Verify product IDs in `.env` |
| Credits don't update | Check webhook logs |
| Redirect fails | Verify Wix Dashboard URL |

---

## 🔮 Future Enhancements

- Real-time WebSocket updates
- Credit transaction history
- Usage analytics charts
- Promo code support
- Annual billing option
- Custom enterprise plans

---

## 📝 Version History

### v2.0.0 (November 15, 2025)
- ✅ Self-hosted pricing page
- ✅ Proper credit accumulation
- ✅ 30-day billing cycles
- ✅ Webhook deduplication
- ✅ Beautiful UI redesign

### v1.0.0 (Previous)
- Wix-hosted pricing page
- Basic credit system
- Calendar month billing

---

## 🏆 Credits

Built with:
- React + TypeScript
- Node.js + Express
- PostgreSQL
- Wix SDK
- Love ❤️

---

## 📄 License

Proprietary - All rights reserved

---

**Ready to deploy?** Follow `QUICK_START_BILLING.md` to get started! 🚀
