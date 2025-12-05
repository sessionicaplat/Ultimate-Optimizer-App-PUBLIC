import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  instanceToken: string | null;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [instanceToken, setInstanceToken] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // According to Wix 2025 docs: "Wix provides iframes with an encoded instance query parameter"
    // The instance parameter is automatically appended by Wix when loading the dashboard page
    
    const params = new URLSearchParams(window.location.search);
    const token = params.get('instance');
    
    console.log('🔍 Checking for instance token...');
    console.log('Current URL:', window.location.href);
    console.log('Query params:', window.location.search);
    console.log('Instance param:', token ? '✅ Found' : '❌ Missing');
    
    if (token) {
      console.log('✅ Instance token found in URL');
      setInstanceToken(token);
      // Store in sessionStorage for navigation within the app
      sessionStorage.setItem('wix_instance_token', token);
      
      // Auto-provision the app instance using the instance token
      provisionInstance(token);
    } else {
      // Try to get from sessionStorage (for internal navigation)
      const storedToken = sessionStorage.getItem('wix_instance_token');
      if (storedToken) {
        console.log('✅ Instance token found in session storage');
        setInstanceToken(storedToken);
      } else {
        console.error('❌ No instance token found');
        console.error('This usually means:');
        console.error('1. The Dashboard Page extension is not properly configured');
        console.error('2. The app is not being accessed through the Wix dashboard');
        console.error('3. The iframe URL in Wix settings is incorrect');
      }
    }
    
    setIsChecking(false);
  }, []);

  const provisionInstance = async (token: string) => {
    // Check if already provisioned (to avoid unnecessary calls)
    const provisioned = sessionStorage.getItem('wix_provisioned');
    if (provisioned === 'true') {
      console.log('✅ Instance already provisioned');
      return;
    }

    try {
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';
      const response = await fetch(`${API_BASE}/api/provision`, {
        method: 'POST',
        headers: {
          'X-Wix-Instance': token,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        console.log('✅ Instance provisioned - real Wix data will load');
        sessionStorage.setItem('wix_provisioned', 'true');
      } else {
        console.warn('⚠️ Provision failed, will use mock data');
      }
    } catch (error) {
      console.warn('⚠️ Provision error, will use mock data:', error);
    }
  };



  // Show configuration help if no token after checking
  if (!isChecking && !instanceToken) {
    return (
      <div style={{
        padding: '40px',
        maxWidth: '800px',
        margin: '0 auto',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{
          background: '#fff3cd',
          border: '1px solid #ffc107',
          borderRadius: '8px',
          padding: '24px',
          marginBottom: '24px'
        }}>
          <h2 style={{ marginTop: 0, color: '#856404' }}>⚠️ Configuration Required</h2>
          <p style={{ fontSize: '16px', lineHeight: '1.6' }}>
            The app cannot load because the instance token is missing from the URL.
          </p>
        </div>

        <div style={{
          background: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '8px',
          padding: '24px'
        }}>
          <h3 style={{ marginTop: 0 }}>🔧 How to Fix (Wix 2025 Method)</h3>
          
          <div style={{ marginBottom: '20px' }}>
            <h4>Step 1: Add Dashboard Page Extension</h4>
            <ol style={{ lineHeight: '1.8', fontSize: '15px' }}>
              <li>
                Go to <a href="https://dev.wix.com" target="_blank" rel="noopener noreferrer">
                  dev.wix.com
                </a> → Your App
              </li>
              <li>Click <strong>Extensions</strong> → <strong>+ Create Extension</strong></li>
              <li>Select <strong>Dashboard Page</strong></li>
              <li>Configure:
                <ul style={{ marginTop: '8px' }}>
                  <li><strong>Name:</strong> Ultimate Optimizer</li>
                  <li><strong>iFrame URL:</strong> <code style={{
                    background: '#e9ecef',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontFamily: 'monospace',
                    fontSize: '12px'
                  }}>
                    https://ultimate-optimizer-app.onrender.com/dashboard
                  </code></li>
                  <li><strong>Relative route:</strong> <code style={{
                    background: '#e9ecef',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontFamily: 'monospace',
                    fontSize: '12px'
                  }}>
                    dashboard
                  </code></li>
                </ul>
              </li>
              <li>Click <strong>Save</strong></li>
              <li>Go to your test site and <strong>reinstall the app</strong></li>
              <li>Open the app from the Wix dashboard sidebar</li>
            </ol>
          </div>

          <div style={{
            padding: '16px',
            background: '#d1ecf1',
            border: '1px solid #bee5eb',
            borderRadius: '4px',
            marginBottom: '20px'
          }}>
            <strong>📘 Important (Wix 2025):</strong>
            <p style={{ margin: '8px 0 0 0', fontSize: '14px' }}>
              Wix automatically appends <code>?instance=TOKEN</code> to your iframe URL. 
              You do NOT need to add it manually. Just set the base URL and Wix handles the rest.
            </p>
          </div>

          <div style={{
            marginTop: '20px',
            padding: '16px',
            background: '#fff',
            border: '1px solid #dee2e6',
            borderRadius: '4px'
          }}>
            <strong>Debug Info:</strong>
            <div style={{
              marginTop: '8px',
              padding: '8px',
              background: '#f8f9fa',
              borderRadius: '4px',
              fontFamily: 'monospace',
              fontSize: '12px'
            }}>
              <div>URL: {window.location.href}</div>
              <div>Query string: {window.location.search || '(empty)'}</div>
              <div>In iframe: {window.self !== window.top ? 'Yes' : 'No'}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const value = {
    instanceToken,
    isAuthenticated: !!instanceToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
