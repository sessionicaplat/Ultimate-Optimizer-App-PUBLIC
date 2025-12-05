import { useState, useEffect } from 'react';
import { fetchWithAuth } from '../utils/api';
import './BillingCredits.css';

interface Plan {
  id: string;
  name: string;
  price: number;
  credits: number;
  features: string[];
  popular?: boolean;
}

interface AccountData {
  instanceId: string;
  planId: string;
  creditsTotal: number;
  creditsUsed: number;
  resetDate: string;
}

const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    credits: 200,
    features: [
      '200 FREE credits per month',
      'AI-powered Blogger',
      'AI-powered Blog Scheduler',
      'AI-powered Product Content & SEO',
      'Multi-language support',
      'Live Chat Support',
    ],
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 7.99,
    credits: 1000,
    features: [
     '1000 credits per month',
      'AI-powered Blogger',
      'AI-powered Blog Scheduler',
      'AI-powered Product Content & SEO',
      'Multi-language support',
      'Live Chat Support',
    ],
    popular: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 15.99,
    credits: 5000,
    features: [
      '5000 credits per month',
      'AI-powered Blogger',
      'AI-powered Blog Scheduler',
      'AI-powered Product Content & SEO',
      'Multi-language support',
      'Live Chat Support',
    ],
  },
  {
    id: 'scale',
    name: 'Scale',
    price: 39.99,
    credits: 25000,
    features: [
       '25000 credits per month',
      'AI-powered Blogger',
      'AI-powered Blog Scheduler',
      'AI-powered Product Content & SEO',
      'Multi-language support',
      'Live Chat Support',
    ],
  },
];

export default function BillingCredits() {
  const [account, setAccount] = useState<AccountData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [upgradingToPlan, setUpgradingToPlan] = useState<string | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState<string | null>(null);
  const [optimisticPlan, setOptimisticPlan] = useState<string | null>(null);
  const [optimisticCredits, setOptimisticCredits] = useState<number | null>(null);
  const [showDowngradeModal, setShowDowngradeModal] = useState(false);
  const [selectedDowngradePlan, setSelectedDowngradePlan] = useState<Plan | null>(null);

  useEffect(() => {
    // Check URL params for payment status
    const urlParams = new URLSearchParams(window.location.search);
    
    // Check both direct param and appState param (Wix uses appState=%3Fpayment%3Dsuccess)
    let paymentSuccess = urlParams.get('payment') === 'success';
    let newPlan = urlParams.get('plan');
    
    // Also check appState parameter (URL-encoded query string)
    const appState = urlParams.get('appState');
    if (appState) {
      try {
        // Decode appState (e.g., "%3Fpayment%3Dsuccess" -> "?payment=success")
        const decodedAppState = decodeURIComponent(appState);
        const appStateParams = new URLSearchParams(decodedAppState);
        
        if (appStateParams.get('payment') === 'success') {
          paymentSuccess = true;
          newPlan = newPlan || appStateParams.get('plan');
          console.log('🔗 Found payment success in appState parameter');
        }
      } catch (error) {
        console.error('Failed to parse appState:', error);
      }
    }
    
    // Check SessionStorage for pending upgrade
    const pendingUpgradeStr = sessionStorage.getItem('pending_upgrade');
    
    if (pendingUpgradeStr) {
      try {
        const pendingUpgrade = JSON.parse(pendingUpgradeStr);
        const ageMs = Date.now() - pendingUpgrade.timestamp;
        
        console.log('📦 Found pending upgrade in SessionStorage:', {
          planId: pendingUpgrade.planId,
          age: Math.round(ageMs / 1000) + 's',
          redirected: pendingUpgrade.redirected,
          urlHasPaymentSuccess: paymentSuccess,
        });
        
        // PRIMARY DECISION: Is this a recent redirect from payment flow?
        if (pendingUpgrade.redirected && ageMs < 5 * 60 * 1000) {
          // Recent redirect (< 5 min) - user is in payment flow
          
          if (paymentSuccess) {
            // ✅ BEST CASE: URL confirms payment success
            console.log('🎉 Payment confirmed by URL params - showing pending animation');
            handlePaymentReturn(pendingUpgrade.planId);
            return;
          } else {
            // ⏳ COMMON CASE: Recent redirect but no URL params
            // Wix might have stripped the params, but user likely completed payment
            // Show pending animation and let webhook polling confirm
            console.log('⏳ Recent redirect without URL confirmation - showing pending animation anyway');
            console.log('   Wix may have stripped URL params. Webhook polling will confirm payment.');
            handlePaymentReturn(pendingUpgrade.planId);
            return;
          }
        } else if (ageMs > 5 * 60 * 1000) {
          // ⏰ OLD ENTRY: Stale data (> 5 min) - clear it
          console.log('⏰ Pending upgrade expired (> 5 min), clearing stale data');
          sessionStorage.removeItem('pending_upgrade');
          fetchAccountData();
          return;
        } else {
          // ❓ EDGE CASE: No redirect flag but has SessionStorage
          // This might be from an old version or manual testing
          if (paymentSuccess) {
            console.log('🔗 Payment success in URL, processing upgrade');
            handlePaymentReturn(pendingUpgrade.planId);
            return;
          } else {
            console.log('⚠️ SessionStorage without redirect flag and no URL success - clearing');
            sessionStorage.removeItem('pending_upgrade');
            fetchAccountData();
            return;
          }
        }
      } catch (error) {
        console.error('Failed to parse pending upgrade:', error);
        sessionStorage.removeItem('pending_upgrade');
      }
    }

    // Fallback: Check URL params without SessionStorage (for backward compatibility)
    if (paymentSuccess && newPlan) {
      console.log('🔗 Found payment success in URL params (no SessionStorage)');
      handlePaymentReturn(newPlan);
    } else {
      fetchAccountData();
    }
  }, []);

  const handlePaymentReturn = async (planId: string) => {
    // Get the new plan details
    const newPlan = PLANS.find(p => p.id === planId);
    if (!newPlan) {
      sessionStorage.removeItem('pending_upgrade');
      fetchAccountData();
      return;
    }

    // Fetch current account data first
    try {
      const currentData = await fetchWithAuth('/api/me');
      const availableCredits = currentData.creditsTotal - currentData.creditsUsedMonth;
      const estimatedNewCredits = availableCredits + newPlan.credits;

      // Set the base account data (current state before upgrade)
      setAccount({
        instanceId: currentData.instanceId,
        planId: currentData.planId,
        creditsTotal: currentData.creditsTotal,
        creditsUsed: currentData.creditsUsedMonth,
        resetDate: currentData.creditsResetOn,
      });

      // OPTIMISTIC UI: Immediately show the new plan
      setOptimisticPlan(planId);
      setOptimisticCredits(estimatedNewCredits);
      setProcessingPayment(true);
      setPaymentMessage(`✓ Payment successful! Confirming your upgrade to ${newPlan.name}...`);
      setLoading(false); // Stop loading state

      console.log('🎨 Optimistic UI: Showing new plan immediately', {
        currentPlan: currentData.planId,
        newPlan: planId,
        currentCredits: currentData.creditsTotal,
        estimatedCredits: estimatedNewCredits,
      });
    } catch (error) {
      console.error('Failed to fetch current data for optimistic UI:', error);
      // Even if fetch fails, show optimistic UI with estimated values
      setOptimisticPlan(planId);
      setOptimisticCredits(newPlan.credits);
      setProcessingPayment(true);
      setPaymentMessage(`✓ Payment successful! Confirming your upgrade to ${newPlan.name}...`);
      setLoading(false);
    }

    // Clear sync cache to force fresh data
    sessionStorage.removeItem('billing_last_sync');

    // Poll for updates (max 60 seconds)
    const maxAttempts = 12;
    let attempts = 0;
    let creditsUpdated = false;

    const pollInterval = setInterval(async () => {
      attempts++;

      try {
        console.log(`[Payment Polling] Attempt ${attempts}/${maxAttempts}`);

        // Sync with Wix
        await fetchWithAuth('/api/billing/sync-credits', { method: 'POST' });

        // Fetch updated account data
        const data = await fetchWithAuth('/api/me');

        // Check if plan updated
        if (data.planId === planId) {
          creditsUpdated = true;
          clearInterval(pollInterval);

          // Clear SessionStorage and optimistic state
          sessionStorage.removeItem('pending_upgrade');
          setOptimisticPlan(null);
          setOptimisticCredits(null);

          setAccount({
            instanceId: data.instanceId,
            planId: data.planId,
            creditsTotal: data.creditsTotal,
            creditsUsed: data.creditsUsedMonth,
            resetDate: data.creditsResetOn,
          });

          setProcessingPayment(false);
          setPaymentMessage(
            `🎉 Upgrade confirmed! You now have ${data.creditsTotal.toLocaleString()} credits on the ${PLANS.find(p => p.id === planId)?.name} plan!`
          );

          // Clear URL params and message after 5 seconds
          setTimeout(() => {
            window.history.replaceState({}, '', window.location.pathname);
            setPaymentMessage(null);
          }, 5000);

          console.log('✅ Payment confirmed and real data loaded');
        }
      } catch (error) {
        console.error('[Payment Polling] Error:', error);
      }

      // Timeout after 60 seconds
      if (attempts >= maxAttempts) {
        clearInterval(pollInterval);
        setProcessingPayment(false);

        if (!creditsUpdated) {
          setPaymentMessage(
            '⏳ Upgrade is processing... Your plan will be confirmed within a few minutes. You can refresh this page to check.'
          );

          // Still fetch current data
          fetchAccountData();

          // Keep SessionStorage for next page load, but clear optimistic UI after 10 seconds
          setTimeout(() => {
            setPaymentMessage(null);
            setOptimisticPlan(null);
            setOptimisticCredits(null);
          }, 10000);
        }
      }
    }, 5000); // Poll every 5 seconds
  };

  const fetchAccountData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Conditional sync - only sync if last sync was > 5 minutes ago
      const lastSyncKey = 'billing_last_sync';
      const lastSyncStr = sessionStorage.getItem(lastSyncKey);
      const now = Date.now();
      const fiveMinutesMs = 5 * 60 * 1000;

      const shouldSync = !lastSyncStr || now - parseInt(lastSyncStr, 10) > fiveMinutesMs;

      if (shouldSync) {
        console.log('🔄 Syncing credits with Wix (last sync > 5 min ago)...');
        try {
          await fetchWithAuth('/api/billing/sync-credits', {
            method: 'POST',
          });
          sessionStorage.setItem(lastSyncKey, now.toString());
          console.log('✅ Credits synced with Wix');
        } catch (syncError) {
          console.warn('⚠️ Sync failed, continuing with cached data:', syncError);
        }
      } else {
        const timeSinceSync = Math.round((now - parseInt(lastSyncStr, 10)) / 1000);
        console.log(`✓ Using cached billing data (synced ${timeSinceSync}s ago)`);
      }

      // Fetch account data
      const accountData = await fetchWithAuth('/api/me');

      setAccount({
        instanceId: accountData.instanceId,
        planId: accountData.planId,
        creditsTotal: accountData.creditsTotal,
        creditsUsed: accountData.creditsUsedMonth,
        resetDate: accountData.creditsResetOn,
      });
    } catch (err) {
      console.error('Failed to fetch account data:', err);
      setError('Failed to load account information');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradeClick = async (planId: string) => {
    if (!account) return;

    // Get the selected plan details
    const selectedPlan = PLANS.find(p => p.id === planId);
    if (!selectedPlan) return;

    // Check if this is a downgrade
    const currentPlanPrice = currentPlan.price;
    const selectedPlanPrice = selectedPlan.price;
    const isDowngrade = selectedPlanPrice < currentPlanPrice;

    // Wix doesn't support downgrades - show modal explaining cancellation process
    if (isDowngrade) {
      setSelectedDowngradePlan(selectedPlan);
      setShowDowngradeModal(true);
      return;
    }

    // Free plan requires cancellation
    if (planId === 'free') {
      setSelectedDowngradePlan(selectedPlan);
      setShowDowngradeModal(true);
      return;
    }

    try {
      setUpgradingToPlan(planId);

      console.log(`🔄 Requesting checkout URL for ${planId} plan...`);

      // Store pending upgrade in SessionStorage BEFORE redirecting
      sessionStorage.setItem('pending_upgrade', JSON.stringify({
        planId: planId,
        timestamp: Date.now(),
        redirected: true  // Track that we redirected to payment
      }));
      console.log('💾 Stored pending upgrade in SessionStorage with redirect flag');

      // Add timeout handling
      const timeoutMs = 15000;
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout - please try again')), timeoutMs)
      );

      // Call backend to get Wix checkout URL
      const apiPromise = fetchWithAuth('/api/billing/checkout-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planId }),
      });

      const response = (await Promise.race([apiPromise, timeoutPromise])) as any;

      console.log('✅ Received checkout URL:', response.url);

      if (response.url) {
        console.log('🚀 Redirecting to Wix checkout...');

        // Redirect to Wix checkout
        if (window.top) {
          window.top.location.href = response.url;
        } else {
          window.location.href = response.url;
        }
      } else {
        throw new Error('No checkout URL received from backend');
      }
    } catch (err: any) {
      console.error('❌ Failed to get checkout URL:', err);
      setUpgradingToPlan(null);
      
      // Clear SessionStorage on error
      sessionStorage.removeItem('pending_upgrade');

      // Handle Wix API timeout specifically
      if (err.code === 'WIX_API_TIMEOUT' || err.message?.includes('deadline exceeded')) {
        alert(
          '⏱️ Wix billing service is temporarily busy.\n\n' +
          'This is a temporary issue on Wix\'s side, not your app.\n\n' +
          'Please wait 30-60 seconds and try again.'
        );
      } else if (err.message?.includes('timeout')) {
        alert('The request is taking longer than expected. Please try again in a moment.');
      } else {
        alert(err.message || 'Failed to open checkout page. Please try again or contact support.');
      }
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1>Credits & Billing</h1>
            <p className="subtitle">Loading your account information...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !account) {
    return (
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1>Credits & Billing</h1>
            <p className="subtitle">{error || 'Failed to load account data'}</p>
          </div>
        </div>
      </div>
    );
  }

  // Use optimistic state if available, otherwise use real data
  const displayPlanId = optimisticPlan || account.planId;
  const displayCreditsTotal = optimisticCredits || account.creditsTotal;
  const displayCreditsUsed = optimisticPlan ? 0 : account.creditsUsed; // Reset used credits on upgrade
  
  const currentPlan = PLANS.find(p => p.id === displayPlanId) || PLANS[0];
  const creditsRemaining = displayCreditsTotal - displayCreditsUsed;
  const usagePercentage =
    displayCreditsTotal > 0 ? (displayCreditsUsed / displayCreditsTotal) * 100 : 0;
  
  const isPending = optimisticPlan !== null;

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Credits & Billing</h1>
          <p className="subtitle">Manage your subscription and track credit usage</p>
        </div>
      </div>

      <div className="billing-content">
        {/* Downgrade Modal */}
        {showDowngradeModal && selectedDowngradePlan && (
          <div className="modal-overlay" onClick={() => setShowDowngradeModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Plan Change Not Available</h2>
                <button 
                  className="modal-close"
                  onClick={() => setShowDowngradeModal(false)}
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
              
              <div className="modal-body">
                <p className="modal-message">
                  Wix doesn't support direct downgrades. To switch to the <strong>{selectedDowngradePlan.name}</strong> plan, 
                  you'll need to:
                </p>
                
                <ol className="modal-steps">
                  <li>Cancel your current <strong>{currentPlan.name}</strong> subscription</li>
                  <li>Subscribe to the <strong>{selectedDowngradePlan.name}</strong> plan</li>
                </ol>
                
                <div className="modal-note">
                  <strong>Good news:</strong> Your accumulated credits will be preserved when you switch plans. 
                  You'll keep access to your current plan until the end of your billing cycle.
                </div>
              </div>
              
              <div className="modal-footer">
                <button 
                  className="modal-button primary"
                  onClick={() => setShowDowngradeModal(false)}
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Payment Processing Message */}
        {(processingPayment || paymentMessage) && (
          <div className={`payment-status-card ${processingPayment ? 'processing' : 'success'}`}>
            {processingPayment && <div className="spinner"></div>}
            <p>{paymentMessage}</p>
          </div>
        )}

        {/* Pending Confirmation Banner */}
        {isPending && (
          <div className="pending-confirmation-banner">
            <div className="pending-icon">⏳</div>
            <div className="pending-content">
              <h3>Upgrade in Progress</h3>
              <p>Your payment was successful! We're confirming your upgrade with Wix (usually takes 30 seconds).</p>
              <div className="pending-steps">
                <div className="step completed">
                  <span className="step-icon">✓</span>
                  <span className="step-text">Payment processed</span>
                </div>
                <div className="step active">
                  <span className="step-icon">⏳</span>
                  <span className="step-text">Confirming with Wix</span>
                </div>
                <div className="step">
                  <span className="step-icon">○</span>
                  <span className="step-text">Credits updated</span>
                </div>
              </div>
            </div>
            <button
              className="pending-dismiss"
              onClick={() => {
                console.log('User manually dismissed pending animation');
                sessionStorage.removeItem('pending_upgrade');
                setOptimisticPlan(null);
                setOptimisticCredits(null);
                setProcessingPayment(false);
                setPaymentMessage(null);
                fetchAccountData();
              }}
              aria-label="Dismiss"
              title="Dismiss and refresh"
            >
              ×
            </button>
          </div>
        )}

        {/* Credit Usage Card */}
        <div className={`card credits-card ${isPending ? 'pending' : ''}`}>
          <h2>Credit Usage This Month {isPending && <span className="pending-badge">Updating...</span>}</h2>

          <div className="credits-summary">
            <div className="credits-stat">
              <span className={`stat-value ${isPending ? 'shimmer' : ''}`}>
                {creditsRemaining.toLocaleString()}
                {isPending && <span className="pending-indicator">*</span>}
              </span>
              <span className="stat-label">Credits Remaining</span>
            </div>
            <div className="credits-stat">
              <span className={`stat-value ${isPending ? 'shimmer' : ''}`}>
                {displayCreditsUsed.toLocaleString()}
              </span>
              <span className="stat-label">Credits Used</span>
            </div>
            <div className="credits-stat">
              <span className={`stat-value ${isPending ? 'shimmer' : ''}`}>
                {displayCreditsTotal.toLocaleString()}
                {isPending && <span className="pending-indicator">*</span>}
              </span>
              <span className="stat-label">Total Credits</span>
            </div>
          </div>

          <div className="usage-bar-container">
            <div className="usage-bar">
              <div
                className="usage-fill"
                style={{ width: `${Math.min(usagePercentage, 100)}%` }}
              ></div>
            </div>
            <div className="usage-percentage">{Math.round(usagePercentage)}% used</div>
          </div>

          <div className="reset-info">
            <span className="reset-icon">🔄</span>
            <span>
              {currentPlan.id === 'free' 
                ? `Credits reset on ${formatDate(account.resetDate)}`
                : `Next billing cycle: ${formatDate(account.resetDate)}`
              }
            </span>
          </div>
        </div>

        {/* Pricing Plans Grid */}
        <div className="pricing-section">
          <h2>Choose Your Plan</h2>
          <p className="pricing-subtitle">
            Upgrade or downgrade anytime. Credits roll over and accumulate each month.
          </p>

          <div className="plans-grid">
            {PLANS.map(plan => {
              const isCurrentPlan = plan.id === account.planId;

              return (
                <div
                  key={plan.id}
                  className={`plan-card ${isCurrentPlan ? 'current' : ''} ${
                    plan.popular ? 'popular' : ''
                  }`}
                >
                  {plan.popular && <div className="popular-badge">Most Popular</div>}
                  {isCurrentPlan && <div className="current-badge">Current Plan</div>}

                  <div className="plan-header">
                    <h3>{plan.name}</h3>
                    <div className="plan-price">
                      {plan.price === 0 ? (
                        <span className="price-free">Free</span>
                      ) : (
                        <>
                          <span className="price-amount">${plan.price}</span>
                          <span className="price-period">/month</span>
                        </>
                      )}
                    </div>
                    <div className="plan-credits">{plan.credits.toLocaleString()} credits/month</div>
                  </div>

                  <ul className="plan-features">
                    {plan.features.map((feature, index) => (
                      <li key={index}>
                        <span className="feature-icon">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <button
                    className={`plan-button ${isCurrentPlan ? 'current' : 'select'}`}
                    onClick={() => handleUpgradeClick(plan.id)}
                    disabled={isCurrentPlan || upgradingToPlan === plan.id || processingPayment}
                  >
                    {upgradingToPlan === plan.id ? (
                      <>
                        <span className="spinner-small"></span>
                        <span>Loading...</span>
                      </>
                    ) : isCurrentPlan ? (
                      'Current Plan'
                    ) : (
                      'Select'
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Credit Usage Tips */}
        <div className="card tips-card">
          <h2>💡 How Credits Work</h2>
          <ul className="tips-list">
            <li>
              <strong>Credits roll over:</strong> Unused credits accumulate each month - you never
              lose them!
            </li>
            <li>
              <strong>Monthly additions:</strong> New credits are added to your existing balance
              every 30 days from your subscription date.
            </li>
            <li>
              <strong>Instant upgrades:</strong> When you upgrade, new plan credits are added
              immediately to your current balance.
            </li>
            <li>
              <strong>Usage tracking:</strong> Each product optimization uses credits based on the
              number of attributes being optimized.
            </li>
            <li>
              <strong>Flexible plans:</strong> Upgrade or downgrade anytime. Your credits adjust
              accordingly.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
