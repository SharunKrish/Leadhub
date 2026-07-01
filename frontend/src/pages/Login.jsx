import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import logo from '../assets/logo.png';

export default function Login() {
  const { login, register } = useContext(AuthContext);
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim() || (isRegistering && !email.trim())) {
      setError("Please fill in all fields.");
      return;
    }
    setError('');
    setSubmitting(true);
    
    let res;
    if (isRegistering) {
      res = await register(username.trim(), email.trim(), password);
    } else {
      res = await login(username.trim(), password);
    }
    
    setSubmitting(false);
    if (!res.success) {
      setError(res.error);
    }
  };

  return (
    <div className="position-relative min-vh-100 w-100 overflow-hidden d-flex align-items-center justify-content-center py-5">
      {/* Dynamic Glow Bubbles in the background */}
      <div className="bg-glow-bubble bg-glow-bubble-1"></div>
      <div className="bg-glow-bubble bg-glow-bubble-2"></div>
      
      <div className="card glass-card p-4 p-sm-5 shadow-lg w-100 position-relative animate-fade-in" style={{ maxWidth: '440px', margin: '20px' }}>
        
        {/* Top bar inside login card */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div className="d-flex align-items-center gap-2">
            <div className="d-flex align-items-center justify-content-center bg-primary bg-opacity-10 text-primary rounded-3" style={{ width: '40px', height: '40px', border: '1px solid rgba(124, 58, 237, 0.2)' }}>
              <img src={logo} alt="LeadHub Logo" style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
            </div>
            <h4 className="mb-0 fw-bold tracking-tight">LeadHub</h4>
          </div>
          <button 
            type="button" 
            className="btn btn-sm btn-outline-secondary rounded-3" 
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
          >
            <i className={`bi ${isDarkMode ? 'bi-sun-fill' : 'bi-moon-fill'}`}></i>
          </button>
        </div>
        
        <h2 className="fw-extrabold mb-1">{isRegistering ? "Create Account" : "Welcome back"}</h2>
        <p className="text-secondary small mb-4">
          {isRegistering ? "Register your details to manage your leads." : "Enter your credentials to access the analytics suite."}
        </p>
        
        {error && (
          <div className="alert alert-danger py-2 px-3 small border-0 d-flex align-items-center gap-2 mb-4 rounded-3" role="alert" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#f87171' }}>
            <i className="bi bi-exclamation-triangle-fill"></i>
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="username" className="form-label small fw-semibold text-secondary">Username</label>
            <div className="input-group">
              <span className="input-group-text bg-transparent border-end-0 text-secondary">
                <i className="bi bi-person"></i>
              </span>
              <input 
                type="text" 
                id="username" 
                className="form-control border-start-0" 
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Enter username"
                required 
              />
            </div>
          </div>

          {isRegistering && (
            <div className="mb-3 animate-fade-in">
              <label htmlFor="email" className="form-label small fw-semibold text-secondary">Email Address</label>
              <div className="input-group">
                <span className="input-group-text bg-transparent border-end-0 text-secondary">
                  <i className="bi bi-envelope"></i>
                </span>
                <input 
                  type="email" 
                  id="email" 
                  className="form-control border-start-0" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Enter email address"
                  required={isRegistering}
                />
              </div>
            </div>
          )}

          <div className="mb-4">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <label htmlFor="password" className="form-label small fw-semibold text-secondary mb-0">Password</label>
            </div>
            <div className="input-group">
              <span className="input-group-text bg-transparent border-end-0 text-secondary">
                <i className="bi bi-lock"></i>
              </span>
              <input 
                type={showPassword ? "text" : "password"} 
                id="password" 
                className="form-control border-start-0 border-end-0" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter password"
                required 
              />
              <button
                type="button"
                className="input-group-text bg-transparent border-start-0 text-secondary"
                onClick={() => setShowPassword(!showPassword)}
                style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0, cursor: 'pointer' }}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary w-100 py-3 fw-semibold mb-4 text-white d-flex align-items-center justify-content-center gap-2"
            disabled={submitting}
          >
            {submitting ? (
              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            ) : (
              <>
                <span>{isRegistering ? "Sign Up & Launch" : "Sign In to Dashboard"}</span>
                <i className="bi bi-arrow-right-short fs-5"></i>
              </>
            )}
          </button>
        </form>

        <div className="text-center mt-3">
          <button 
            type="button" 
            className="btn btn-link btn-sm text-primary text-decoration-none fw-semibold"
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError('');
            }}
          >
            {isRegistering ? "Already have an account? Sign In" : "Don't have an account? Create Account"}
          </button>
        </div>
      </div>
    </div>
  );
}
