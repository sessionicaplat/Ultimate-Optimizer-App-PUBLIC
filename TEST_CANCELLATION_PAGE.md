# Test Subscription Cancellation Page

## Overview
A test page for testing subscription cancellation functionality during development. This page allows you to list active orders and cancel them to test how the app reacts to subscription cancellations.

## ⚠️ Important: Production Deployment
**This feature is for TESTING ONLY and should be disabled before going to production.**

### How to Disable for Production

#### 1. Backend Protection (Already Implemented)
The backend endpoints are automatically protected in production:
```typescript
// In backend/src/routes/orders.ts
if (process.env.NODE_ENV === 'production' && process.env.ENABLE_TEST_ENDPOINTS !== 'true') {
  return res.status(403).json({ 
    error: 'This test endpoint is disabled in production' 
  });
}
```

#### 2. Frontend Navigation (Already Implemented)
The navigation link only shows in development mode:
```typescript
// In frontend/src/components/Layout.tsx
{import.meta.env.DEV && (
  <NavLink to="/test-cancellation">
    Test Cancellation
  </NavLink>
)}
```

#### 3. Additional Production Safety (Optional)
To completely remove the route in production, update `frontend/src/App.tsx`:
```typescript
{import.meta.env.DEV && (
  <Route path="test-cancellation" element={<TestCancellation />} />
)}
```

## Features

### 1. List Active Orders
- Displays all active subscription orders for the current member
- Shows order details including:
  - Plan name and description
  - Order ID
  - Order type (ONLINE/OFFLINE)
  - Price and currency
  - Payment status
  - Start and end dates
  - Current status

### 2. Cancel Orders
Two cancellation options:
- **Cancel Immediately**: Order ends right away
- **Cancel at Next Payment Date**: Order continues until the end of the current billing cycle

### 3. Real-time Updates
- Refresh button to reload orders
- Automatic reload after cancellation
- Loading states and error handling

## API Endpoints

### GET `/api/orders/member/active`
Lists active orders for the current member.

**Response:**
```json
{
  "orders": [
    {
      "_id": "order-id",
      "planName": "Premium Plan",
      "status": "ACTIVE",
      "startDate": "2024-01-01T00:00:00.000Z",
      "planPrice": "29.99",
      "type": "ONLINE"
    }
  ],
  "total": 1
}
```

### POST `/api/orders/cancel`
Cancels a specific order.

**Request Body:**
```json
{
  "orderId": "order-id",
  "effectiveAt": "IMMEDIATELY" // or "NEXT_PAYMENT_DATE"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order order-id cancelled successfully",
  "effectiveAt": "IMMEDIATELY"
}
```

## Wix Events Triggered

### Immediate Cancellation (`IMMEDIATELY`)
- **Order Canceled** event is triggered immediately
- **Order Ended** event is triggered immediately
- Order status changes to "CANCELED"

### Next Payment Date Cancellation (`NEXT_PAYMENT_DATE`)
- **Order Auto Renew Canceled** event is triggered immediately
- Order continues until end of billing cycle
- **Order Canceled** and **Order Ended** events are triggered at the end of the cycle

## Testing Workflow

1. **Create a Test Subscription**
   - Use Wix dashboard to create a pricing plan
   - Subscribe to the plan (use test mode if available)

2. **Access Test Page**
   - Navigate to the app
   - Click "Test Cancellation" in the sidebar (only visible in dev mode)

3. **View Active Orders**
   - The page will list all active orders
   - Review order details

4. **Test Cancellation**
   - Select cancellation timing (Immediately or Next Payment Date)
   - Click "Cancel Order" button
   - Confirm the cancellation

5. **Verify App Behavior**
   - Check how your app reacts to the cancellation
   - Verify webhook handlers are triggered
   - Test UI updates based on subscription status

## Free Trial Cancellation

When a buyer cancels during the free trial period:
- **Immediate**: Subscription ends right away, no billing
- **Next Payment Date**: Subscription continues until end of trial, then ends without billing

## Implementation Details

### Backend
- **File**: `backend/src/routes/orders.ts`
- **Dependencies**: `@wix/pricing-plans` SDK
- **Authentication**: Uses `verifyInstance` middleware
- **Methods Used**:
  - `orders.memberListOrders()` - List orders
  - `orders.requestCancellation()` - Cancel order

### Frontend
- **File**: `frontend/src/pages/TestCancellation.tsx`
- **Styling**: `frontend/src/pages/TestCancellation.css`
- **Features**:
  - Order listing with details
  - Cancellation options (radio buttons)
  - Loading and error states
  - Confirmation dialogs

### Routing
- **Route**: `/test-cancellation`
- **Visibility**: Development mode only
- **Navigation**: Conditional in sidebar

## Security Considerations

1. **Environment Check**: Backend checks `NODE_ENV` before allowing access
2. **Override Flag**: Can enable in production with `ENABLE_TEST_ENDPOINTS=true` (not recommended)
3. **Member Context**: Uses member authentication, can only cancel own orders
4. **Confirmation**: Frontend requires user confirmation before cancellation

## Troubleshooting

### Orders Not Loading
- Check if user has active subscriptions
- Verify Wix instance token is valid
- Check browser console for errors
- Ensure `@wix/pricing-plans` package is installed

### Cancellation Fails
- Verify order is in "ACTIVE" status
- Check if order type supports the selected cancellation timing
- Review backend logs for detailed error messages
- Ensure proper permissions in Wix app settings

### Page Not Visible
- Confirm you're running in development mode (`npm run dev`)
- Check that `import.meta.env.DEV` is true
- Verify route is registered in `App.tsx`

## Related Documentation
- [Wix Pricing Plans Orders API](https://dev.wix.com/docs/sdk/api-reference/pricing-plans/orders)
- [Testing Subscription Cancellation](https://dev.wix.com/docs/build-apps/developer-tools/extensions/paid-plans/test-your-paid-plan-integration#testing-cancellation)
- [Order Cancellation Events](https://dev.wix.com/docs/sdk/api-reference/pricing-plans/orders/on-order-canceled)

## Cleanup Before Production

Before deploying to production:

1. ✅ Backend endpoints are already protected
2. ✅ Frontend navigation is already conditional
3. ⚠️ Optional: Wrap route in `import.meta.env.DEV` check
4. ⚠️ Optional: Remove test files entirely:
   - `backend/src/routes/orders.ts`
   - `frontend/src/pages/TestCancellation.tsx`
   - `frontend/src/pages/TestCancellation.css`
   - Remove route from `App.tsx`
   - Remove navigation from `Layout.tsx`
   - Remove import from `server.ts`

## Environment Variables

No additional environment variables required. The feature uses existing configuration:
- `NODE_ENV` - Determines if endpoints are accessible
- `ENABLE_TEST_ENDPOINTS` - Optional override (not recommended for production)
