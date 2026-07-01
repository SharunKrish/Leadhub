import React, { useState, useContext } from 'react';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { ThemeProvider, ThemeContext } from './context/ThemeContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import LeadManagement from './pages/LeadManagement';
import './App.css';
import logo from './assets/logo.png';
import Settings from './pages/Settings';

function MainAppShell() {
  const { user, token, loading, logout } = useContext(AuthContext);
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' or 'leads'
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile side drawer
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true); // Desktop collapse mode

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center min-vh-100 bg-body">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading application...</span>
        </div>
      </div>
    );
  }

  // If not logged in, show Login page
  if (!token) {
    return <Login />;
  }

  return (
    <div className="container-fluid p-0 position-relative min-vh-100 overflow-hidden">
      {/* Background glow bubbles */}
      <div className="bg-glow-bubble bg-glow-bubble-1"></div>
      <div className="bg-glow-bubble bg-glow-bubble-2"></div>
      
      {/* Hamburger Menu Toggle Button (visible on mobile only) */}
      <button 
        onClick={() => setIsSidebarOpen(true)} 
        className="btn btn-outline-primary d-md-none position-fixed rounded-circle shadow-sm z-3 d-flex align-items-center justify-content-center bg-body bg-opacity-75"
        style={{ top: '16px', left: '16px', width: '40px', height: '40px', border: '1px solid var(--border-color-light)' }}
        title="Toggle menu"
      >
        <i className="bi bi-list fs-5"></i>
      </button>
      
      {/* Sidebar Overlay backdrop */}
      <div 
        onClick={() => {
          setIsSidebarOpen(false);
          setIsSidebarCollapsed(true);
        }}
        className={`sidebar-overlay ${isSidebarOpen ? 'show' : ''} ${!isSidebarCollapsed ? 'show-desktop' : ''}`}
      ></div>

      {/* Slide-collapsible Sidebar */}
      <div className={`sidebar d-flex flex-column p-3 ${isSidebarOpen ? 'show' : ''} ${isSidebarCollapsed ? 'collapsed' : ''}`}>
        
        {/* Sidebar Header */}
        <div className={`d-flex align-items-center ${isSidebarCollapsed ? 'justify-content-center' : 'justify-content-between'} mb-4 px-2 py-1`}>
          <div className="d-flex align-items-center gap-2">
            <div className="d-flex align-items-center justify-content-center bg-primary bg-opacity-10 text-primary rounded-3" style={{ width: '36px', height: '36px', border: '1px solid rgba(124, 58, 237, 0.15)' }}>
              <img src={logo} alt="LeadHub Logo" style={{ width: '22px', height: '22px', objectFit: 'contain' }} />
            </div>
            <h4 className="mb-0 fw-bold tracking-tight">LeadHub</h4>
          </div>
          
          {/* Mobile close toggle */}
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="btn-close d-md-none" 
            style={{ filter: isDarkMode ? 'invert(1)' : 'none' }}
            aria-label="Close sidebar"
          ></button>
        </div>
        
        {/* Navigation list */}
        <div className="nav flex-column gap-1.5 mb-auto">
          <button 
            onClick={() => { setCurrentView('dashboard'); setIsSidebarOpen(false); }}
            className={`nav-link-custom border-0 w-100 text-start bg-transparent ${currentView === 'dashboard' ? 'active' : ''}`}
            title="Dashboard"
          >
            <i className="bi bi-grid-1x2-fill"></i>
            <span>Dashboard</span>
          </button>
          <button 
            onClick={() => { setCurrentView('leads'); setIsSidebarOpen(false); }}
            className={`nav-link-custom border-0 w-100 text-start bg-transparent ${currentView === 'leads' ? 'active' : ''}`}
            title="Leads Directory"
          >
            <i className="bi bi-people-fill"></i>
            <span>Leads Directory</span>
          </button>
          <button 
            onClick={() => { setCurrentView('settings'); setIsSidebarOpen(false); }}
            className={`nav-link-custom border-0 w-100 text-start bg-transparent ${currentView === 'settings' ? 'active' : ''}`}
            title="Settings"
          >
            <i className="bi bi-gear-fill"></i>
            <span>Settings</span>
          </button>
        </div>

        {/* Sidebar Footer Controls */}
        <div className="mt-auto pt-3 border-top border-secondary border-opacity-10">
          {!isSidebarCollapsed ? (
            <div className="px-1">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div className="d-flex align-items-center gap-2">
                  <div className="bg-primary bg-opacity-10 text-primary rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px', border: '1px solid rgba(124, 58, 237, 0.15)' }}>
                    <i className="bi bi-person-fill"></i>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div className="fw-semibold small text-truncate" style={{ maxWidth: '85px' }}>{user?.username}</div>
                    <div className="text-secondary text-xxs mb-0" style={{ fontSize: '9px' }}>Administrator</div>
                  </div>
                </div>
                
                <div className="d-flex gap-1">
                  <button 
                    onClick={toggleTheme} 
                    className="btn btn-sm btn-outline-secondary rounded-3 d-flex align-items-center justify-content-center p-0"
                    style={{ width: '30px', height: '30px' }}
                    title="Toggle Theme"
                  >
                    <i className={`bi ${isDarkMode ? 'bi-sun-fill' : 'bi-moon-fill'} small`}></i>
                  </button>
                  <button 
                    onClick={() => setIsSidebarCollapsed(true)}
                    className="btn btn-sm btn-outline-secondary rounded-3 d-none d-md-flex align-items-center justify-content-center p-0"
                    style={{ width: '30px', height: '30px' }}
                    title="Collapse Sidebar"
                  >
                    <i className="bi bi-chevron-left small"></i>
                  </button>
                </div>
              </div>

              <button 
                onClick={logout} 
                className="btn btn-outline-danger btn-sm w-100 rounded-3 d-flex align-items-center justify-content-center gap-2 py-1.5"
              >
                <i className="bi bi-box-arrow-right"></i>
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="d-flex flex-column align-items-center gap-2">
              <button 
                onClick={() => setIsSidebarCollapsed(false)}
                className="btn btn-sm btn-outline-secondary rounded-circle d-none d-md-flex align-items-center justify-content-center"
                style={{ width: '36px', height: '36px' }}
                title="Expand Sidebar"
              >
                <i className="bi bi-chevron-right"></i>
              </button>
              <button 
                onClick={toggleTheme} 
                className="btn btn-sm btn-outline-secondary rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: '36px', height: '36px' }}
                title="Toggle Theme"
              >
                <i className={`bi ${isDarkMode ? 'bi-sun-fill' : 'bi-moon-fill'}`}></i>
              </button>
              <button 
                onClick={logout} 
                className="btn btn-outline-danger btn-sm rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: '36px', height: '36px' }}
                title="Sign Out"
              >
                <i className="bi bi-box-arrow-right"></i>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area Wrapper */}
      <div className={`main-wrapper ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <main className="flex-grow-1 p-3 p-md-4 p-lg-5">
          {/* Header spacer to prevent overlay on mobile hamburger menu */}
          <div className="d-md-none" style={{ height: '48px' }}></div>
          {currentView === 'dashboard' ? (
            <Dashboard />
          ) : currentView === 'leads' ? (
            <LeadManagement />
          ) : (
            <Settings />
          )}
        </main>
      </div>

    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainAppShell />
      </AuthProvider>
    </ThemeProvider>
  );
}
