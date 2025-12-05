import { useState, useEffect } from 'react';
import { fetchWithAuth } from '../utils/api';
import './TestCancellation.css';

interface Order {
  _id: string;
  planName: string;
  planDescription?: string;
  status: string;
  startDate: string;
  endDate?: string;
  planPrice: string;
  lastPaymentStatus: string;
  type: string;
  pricing?: {
    prices?: Array<{
      price: {
        currency: string;
        total: string;
      };
    }>;
  };
}

export default function TestCancellation() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [effectiveAt, setEffectiveAt] = useState<'IMMEDIATELY' | 'NEXT_PAYMENT_DATE'>('IMMEDIATELY');

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchWithAuth('/api/orders/member/active');
      setOrders(data.orders || []);
    } catch (err: any) {
      // Check if it's a permissions error
      if (err.status === 403 && err.data?.details?.required_permissions) {
        const permissionsError = `
Pricing Plans API Permissions Required

Your Wix app needs additional permissions to access pricing plan orders.

Required Permissions:
${err.data.details.required_permissions.map((p: string) => `• ${p}`).join('\n')}

How to Fix:
1. Go to Wix Developers Dashboard (dev.wix.com)
2. Select your app
3. Go to Permissions section
4. Enable "Pricing Plans" permissions
5. Reinstall the app on your test site

${err.data.instructions || ''}
        `.trim();
        setError(permissionsError);
      } else {
        setError(err.message || 'Failed to load orders');
      }
      console.error('Error loading orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleSyncPlan = async () => {
    if (!confirm('Sync your database with the actual Wix subscription?')) {
      return;
    }

    try {
      setSyncing(true);
      setError(null);
      
      const result = await fetchWithAuth('/api/orders/sync', {
        method: 'POST',
      });

      alert(result.message || 'Plan synced successfully!');
      
      // Reload orders after sync
      await loadOrders();
    } catch (err: any) {
      setError(err.message || 'Failed to sync plan');
      console.error('Error syncing plan:', err);
    } finally {
      setSyncing(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm(`Are you sure you want to cancel this order ${effectiveAt === 'IMMEDIATELY' ? 'immediately' : 'at the next payment date'}?`)) {
      return;
    }

    try {
      setCancelling(orderId);
      setError(null);
      
      await fetchWithAuth('/api/orders/cancel', {
        method: 'POST',
        body: JSON.stringify({ orderId, effectiveAt }),
      });

      alert(`Order cancelled successfully (${effectiveAt})`);
      
      // Reload orders after cancellation
      await loadOrders();
    } catch (err: any) {
      // Check if it's a permissions error
      if (err.status === 403 && err.data?.details?.required_permissions) {
        const permissionsError = `
Pricing Plans API Permissions Required

Your Wix app needs additional permissions to cancel orders.

Required Permissions:
${err.data.details.required_permissions.map((p: string) => `• ${p}`).join('\n')}

How to Fix:
1. Go to Wix Developers Dashboard (dev.wix.com)
2. Select your app
3. Go to Permissions section
4. Enable "Pricing Plans" permissions
5. Reinstall the app on your test site
        `.trim();
        setError(permissionsError);
      } else {
        setError(err.message || 'Failed to cancel order');
      }
      console.error('Error cancelling order:', err);
    } finally {
      setCancelling(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (order: Order) => {
    if (order.pricing?.prices?.[0]?.price) {
      const price = order.pricing.prices[0].price;
      return `${price.currency} ${price.total}`;
    }
    return order.planPrice || 'N/A';
  };

  return (
    <div className="test-cancellation-page">
      <div className="page-header">
        <div>
          <h1>🧪 Test Subscription Cancellation</h1>
          <p className="warning-banner">
            ⚠️ <strong>TEST ONLY:</strong> This page is for testing subscription cancellation during development. 
            It will be disabled in production.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            onClick={handleSyncPlan} 
            disabled={syncing || loading}
            className="refresh-btn"
            style={{ backgroundColor: '#ff6b35' }}
          >
            {syncing ? '⏳ Syncing...' : '🔄 Sync with Wix'}
          </button>
          <button 
            onClick={loadOrders} 
            disabled={loading}
            className="refresh-btn"
          >
            {loading ? '⏳ Loading...' : '🔄 Refresh'}
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <strong>Error:</strong>
          <pre style={{ whiteSpace: 'pre-wrap', marginTop: '0.5rem', fontFamily: 'inherit' }}>
            {error}
          </pre>
        </div>
      )}

      <div className="cancellation-options">
        <label className="option-label">
          <strong>Cancellation Timing:</strong>
        </label>
        <div className="radio-group">
          <label className="radio-option">
            <input
              type="radio"
              value="IMMEDIATELY"
              checked={effectiveAt === 'IMMEDIATELY'}
              onChange={(e) => setEffectiveAt(e.target.value as 'IMMEDIATELY')}
            />
            <span>Cancel Immediately</span>
            <small>Order ends right away</small>
          </label>
          <label className="radio-option">
            <input
              type="radio"
              value="NEXT_PAYMENT_DATE"
              checked={effectiveAt === 'NEXT_PAYMENT_DATE'}
              onChange={(e) => setEffectiveAt(e.target.value as 'NEXT_PAYMENT_DATE')}
            />
            <span>Cancel at Next Payment Date</span>
            <small>Order continues until next billing cycle</small>
          </label>
        </div>
      </div>

      {loading && orders.length === 0 ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading active orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h3>No Active Orders</h3>
          <p>There are no active subscription orders to display.</p>
          <p className="hint">Active orders will appear here once a user subscribes to a plan.</p>
        </div>
      ) : (
        <div className="orders-list">
          <h2>Active Orders ({orders.length})</h2>
          {orders.map((order) => (
            <div key={order._id} className="order-card">
              <div className="order-header">
                <div>
                  <h3>{order.planName}</h3>
                  {order.planDescription && (
                    <p className="order-description">{order.planDescription}</p>
                  )}
                </div>
                <span className={`status-badge status-${order.status.toLowerCase()}`}>
                  {order.status}
                </span>
              </div>

              <div className="order-details">
                <div className="detail-row">
                  <span className="detail-label">Order ID:</span>
                  <span className="detail-value">{order._id}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Type:</span>
                  <span className="detail-value">{order.type}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Price:</span>
                  <span className="detail-value">{formatPrice(order)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Payment Status:</span>
                  <span className="detail-value">{order.lastPaymentStatus}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Start Date:</span>
                  <span className="detail-value">{formatDate(order.startDate)}</span>
                </div>
                {order.endDate && (
                  <div className="detail-row">
                    <span className="detail-label">End Date:</span>
                    <span className="detail-value">{formatDate(order.endDate)}</span>
                  </div>
                )}
              </div>

              <div className="order-actions">
                <button
                  onClick={() => handleCancelOrder(order._id)}
                  disabled={cancelling === order._id}
                  className="cancel-btn"
                >
                  {cancelling === order._id ? (
                    <>⏳ Cancelling...</>
                  ) : (
                    <>🚫 Cancel Order ({effectiveAt === 'IMMEDIATELY' ? 'Now' : 'Next Payment'})</>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="info-section">
        <h3>ℹ️ About This Test Page</h3>
        <ul>
          <li><strong>Purpose:</strong> Test how the app reacts when a subscription is cancelled</li>
          <li><strong>Immediate Cancellation:</strong> Order ends right away, triggers Order Canceled event</li>
          <li><strong>Next Payment Date:</strong> Order continues until end of billing cycle, triggers Order Auto Renew Canceled event</li>
          <li><strong>Production:</strong> This page will be disabled before going to production</li>
          <li><strong>Events:</strong> Cancellation triggers webhooks that your app can listen to</li>
        </ul>
      </div>
    </div>
  );
}
