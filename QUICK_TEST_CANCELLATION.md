# Quick Reference: Test Cancellation Page

## Access
- **URL**: `/test-cancellation`
- **Sidebar**: 🧪 Test Cancellation (dev mode only)

## Quick Start
1. Create a test subscription in Wix
2. Open app → Click "Test Cancellation"
3. Select cancellation timing
4. Click "Cancel Order" → Confirm

## Cancellation Options
- **Immediately**: Order ends now
- **Next Payment Date**: Order continues until next billing cycle

## Events Triggered
- **Immediate**: `Order Canceled` + `Order Ended`
- **Next Payment**: `Order Auto Renew Canceled` (now), `Order Canceled` + `Order Ended` (later)

## Production Safety
✅ Automatically disabled in production
- Backend returns 403
- Frontend hides navigation link

## Files
- Backend: `backend/src/routes/orders.ts`
- Frontend: `frontend/src/pages/TestCancellation.tsx`
- Docs: `TEST_CANCELLATION_PAGE.md`
