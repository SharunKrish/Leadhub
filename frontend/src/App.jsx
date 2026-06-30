import React, { useState, useContext } from 'react';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { ThemeProvider, ThemeContext } from './context/ThemeContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import LeadManagement from './pages/LeadManagement';
import './App.css';

function MainAppShell() {
  const { user, token, loading, logout } = useContext(AuthContext);
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' or 'leads'

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
    <div className="container-fluid p-0">
      <div className="row g-0">
        
        {/* Sidebar */}
        <div className="col-12 col-md-3 col-lg-2 sidebar d-flex flex-column p-3">
          <div className="d-flex align-items-center gap-2 mb-4 px-2 py-1">
            <i className="bi bi-speedometer2 fs-3 text-primary"></i>
            <h4 className="mb-0 fw-bold">LeadHub</h4>
          </div>
          
          <div className="nav flex-column gap-2 mb-auto">
            <button 
              onClick={() => setCurrentView('dashboard')}
              className={`nav-link-custom border-0 w-100 text-start bg-transparent ${currentView === 'dashboard' ? 'active' : ''}`}
            >
              <i className="bi bi-grid-1x2-fill"></i>
              <span>Dashboard</span>
            </button>
            <button 
              onClick={() => setCurrentView('leads')}
              className={`nav-link-custom border-0 w-100 text-start bg-transparent ${currentView === 'leads' ? 'active' : ''}`}
            >
              <i className="bi bi-people-fill"></i>
              <span>Leads Directory</span>
            </button>
          </div>

          <hr className="my-3 opacity-10" />

          {/* User Profile / Theme controls */}
          <div className="px-2">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div className="d-flex align-items-center gap-2">
                <div className="bg-primary bg-opacity-10 text-primary rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px' }}>
                  <i className="bi bi-person-fill"></i>
                </div>
                <div>
                  <div className="fw-semibold small text-truncate" style={{ maxWidth: '100px' }}>{user?.username}</div>
                  <div className="text-secondary text-xxs" style={{ fontSize: '10px' }}>Administrator</div>
                </div>
              </div>
              <button 
                onClick={toggleTheme} 
                className="btn btn-sm btn-outline-secondary rounded-3"
                title="Toggle Theme"
              >
                <i className={`bi ${isDarkMode ? 'bi-sun-fill' : 'bi-moon-fill'}`}></i>
              </button>
            </div>

            <button 
              onClick={logout} 
              className="btn btn-outline-danger btn-sm w-100 rounded-3 d-flex align-items-center justify-content-center gap-2"
            >
              <i className="bi bi-box-arrow-right"></i>
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="col-12 col-md-9 col-lg-10 min-vh-100 d-flex flex-column">
          <main className="flex-grow-1 p-3 p-md-4 bg-body-tertiary">
            {currentView === 'dashboard' ? <Dashboard /> : <LeadManagement />}
          </main>
          
          <footer className="py-3 px-4 border-top text-center text-secondary small bg-body">
            <div>&copy; {new Date().getFullYear()} LeadHub CRM. All rights reserved.</div>
            <div className="text-xxs mt-1 text-muted" style={{ fontSize: '10px' }}>Built with Django & React for Lead Management Assignment.</div>
          </footer>
        </div>

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
