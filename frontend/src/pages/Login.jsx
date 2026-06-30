import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';

export default function Login() {
  const { login } = useContext(AuthContext);
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    setError('');
    setSubmitting(true);
    const res = await login(username, password);
    setSubmitting(false);
    if (!res.success) {
      setError(res.error);
    }
  };

  return (
    <div className="container d-flex align-items-center justify-content-center min-vh-100 animate-fade-in">
      <div className="card glass-card p-4 shadow-lg w-100" style={{ maxWidth: '420px' }}>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-speedometer2 fs-3 text-primary"></i>
            <h4 className="mb-0 fw-bold">LeadHub</h4>
          </div>
          <button 
            type="button" 
            className="btn btn-sm btn-outline-secondary" 
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
          >
            <i className={`bi ${isDarkMode ? 'bi-sun-fill' : 'bi-moon-fill'}`}></i>
          </button>
        </div>
        
        <h3 className="fw-bold mb-1">Sign In</h3>
        <p className="text-secondary mb-4">Lead Management Dashboard</p>
        
        {error && (
          <div className="alert alert-danger py-2 px-3 small d-flex align-items-center gap-2" role="alert">
            <i className="bi bi-exclamation-triangle-fill"></i>
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="username" className="form-label small fw-semibold">Username</label>
            <div className="input-group">
              <span className="input-group-text bg-transparent border-end-0">
                <i className="bi bi-person text-secondary"></i>
              </span>
              <input 
                type="text" 
                id="username" 
                className="form-control border-start-0" 
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="e.g. admin"
                required 
              />
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="password" className="form-label small fw-semibold">Password</label>
            <div className="input-group">
              <span className="input-group-text bg-transparent border-end-0">
                <i className="bi bi-lock text-secondary"></i>
              </span>
              <input 
                type="password" 
                id="password" 
                className="form-control border-start-0" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="e.g. admin"
                required 
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary w-100 py-2 fw-semibold mb-3"
            disabled={submitting}
          >
            {submitting ? (
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
            ) : "Log In"}
          </button>
        </form>

        <div className="mt-3 p-3 bg-body-tertiary rounded-3 border">
          <div className="small fw-semibold text-secondary mb-1">
            <i className="bi bi-info-circle me-1"></i> Demo Credentials
          </div>
          <div className="small text-secondary">Username: <code className="bg-transparent p-0 text-primary fw-bold">admin</code></div>
          <div className="small text-secondary">Password: <code className="bg-transparent p-0 text-primary fw-bold">admin</code></div>
        </div>
      </div>
    </div>
  );
}
