import { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.tsx';
import './Layout.css';

export default function Layout() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const [isOptimizerOpen, setIsOptimizerOpen] = useState(true);

  // Check if any optimizer-related route is active
  const isOptimizerActive = ['/optimizer', '/queue', '/completed'].includes(location.pathname);

  if (!isAuthenticated) {
    return (
      <div className="auth-error">
        <h2>Authentication Required</h2>
        <p>Please access this app from your Wix dashboard.</p>
      </div>
    );
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <img 
            src="https://enchantrixaihosting.com/ChatGPT%20Image%20Nov%2014%2C%202025%2C%2007_45_19%20PM%20-%20Copy%20-%20Copy.png" 
            alt="Kdabra! AI" 
            className="sidebar-logo"
          />
        </div>
        <nav className="sidebar-nav">
          {/* Content Optimization Section */}
          <div className="nav-section">
            <div className="section-header">CONTENT OPTIMIZATION</div>
            <div className="nav-group">
              <button
                className={`nav-link nav-group-toggle ${isOptimizerActive ? 'active' : ''}`}
                onClick={() => setIsOptimizerOpen(!isOptimizerOpen)}
              >
                <span className="nav-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                  </svg>
                </span>
                <span className="nav-text">Product Optimizer</span>
                <span className={`dropdown-arrow ${isOptimizerOpen ? 'open' : ''}`}>▼</span>
              </button>
              
              {isOptimizerOpen && (
                <div className="nav-submenu">
                  <NavLink 
                    to="/optimizer" 
                    className={({ isActive }) => isActive ? 'nav-link nav-sublink active' : 'nav-link nav-sublink'}
                  >
                    <span className="nav-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                      </svg>
                    </span>
                    Product Optimizer
                  </NavLink>
                  <NavLink 
                    to="/queue" 
                    className={({ isActive }) => isActive ? 'nav-link nav-sublink active' : 'nav-link nav-sublink'}
                  >
                    <span className="nav-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                      </svg>
                    </span>
                    Ongoing Optimizations
                  </NavLink>
                  <NavLink 
                    to="/completed" 
                    className={({ isActive }) => isActive ? 'nav-link nav-sublink active' : 'nav-link nav-sublink'}
                  >
                    <span className="nav-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </span>
                    Completed Jobs
                  </NavLink>
                </div>
              )}
            </div>

            <NavLink 
              to="/image-optimization" 
              className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
            >
              <span className="nav-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
              </span>
              Image Optimization
            </NavLink>

            <NavLink 
              to="/blog-generator" 
              className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
            >
              <span className="nav-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10 9 9 9 8 9"/>
                </svg>
              </span>
              Blog Generator
            </NavLink>

            <NavLink 
              to="/blog-scheduler" 
              className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
            >
              <span className="nav-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </span>
              Blog Scheduler
            </NavLink>
          </div>

          {/* Account Section */}
          <div className="nav-section nav-section-bottom">
            <NavLink 
              to="/billing" 
              className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
            >
              <span className="nav-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                  <line x1="1" y1="10" x2="23" y2="10"/>
                </svg>
              </span>
              <span className="nav-text">Billing & Credits</span>
            </NavLink>
          </div>
        </nav>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
