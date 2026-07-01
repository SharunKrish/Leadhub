import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { updateUserProfile, deleteAllLeads } from '../services/api';

export default function Settings() {
  const { user } = useContext(AuthContext);

  // User Profile States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileUpdating, setProfileUpdating] = useState(false);

  // Preferences States
  const [pageSize, setPageSize] = useState('20');
  const [ordering, setOrdering] = useState('-created_date');
  const [source, setSource] = useState('');
  const [prefSuccess, setPrefSuccess] = useState(false);

  // Danger Zone States
  const [confirmDeleteWord, setConfirmDeleteWord] = useState('');
  const [dangerSuccess, setDangerSuccess] = useState('');
  const [dangerError, setDangerError] = useState('');
  const [dangerDeleting, setDangerDeleting] = useState(false);

  // Load initial settings
  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
    
    // Load local storage preferences
    const savedPageSize = localStorage.getItem('leadhub_default_page_size');
    const savedOrdering = localStorage.getItem('leadhub_default_ordering');
    const savedSource = localStorage.getItem('leadhub_default_source');

    if (savedPageSize) setPageSize(savedPageSize);
    if (savedOrdering) setOrdering(savedOrdering);
    if (savedSource) setSource(savedSource);
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileSuccess('');
    setProfileError('');

    if (password && password !== confirmPassword) {
      setProfileError("Passwords do not match.");
      return;
    }

    setProfileUpdating(true);
    try {
      const payload = { email };
      if (password) {
        payload.password = password;
      }
      await updateUserProfile(payload);
      setProfileSuccess("Profile updated successfully!");
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error(err);
      setProfileError(err.response?.data?.error || "Failed to update profile details.");
    } finally {
      setProfileUpdating(false);
    }
  };

  const handleSavePreferences = (e) => {
    e.preventDefault();
    setPrefSuccess(false);

    localStorage.setItem('leadhub_default_page_size', pageSize);
    localStorage.setItem('leadhub_default_ordering', ordering);
    localStorage.setItem('leadhub_default_source', source);

    setPrefSuccess(true);
    setTimeout(() => setPrefSuccess(false), 3000);
  };

  const handleDeleteAll = async (e) => {
    e.preventDefault();
    setDangerSuccess('');
    setDangerError('');

    if (confirmDeleteWord.trim().toUpperCase() !== 'DELETE') {
      setDangerError("Please type 'DELETE' to confirm deletion.");
      return;
    }

    if (!window.confirm("CRITICAL WARNING: This will permanently delete all leads and notes in your account. This action cannot be undone. Are you sure?")) {
      return;
    }

    setDangerDeleting(true);
    try {
      const res = await deleteAllLeads();
      setDangerSuccess(res.message || "All leads have been successfully deleted.");
      setConfirmDeleteWord('');
    } catch (err) {
      console.error(err);
      setDangerError("Failed to delete leads. Please try again.");
    } finally {
      setDangerDeleting(false);
    }
  };

  return (
    <div className="position-relative container-fluid py-3 py-md-4 animate-fade-in">
      
      {/* Header section */}
      <div className="mb-4 position-relative" style={{ zIndex: 1 }}>
        <h1 className="fw-extrabold tracking-tight mb-1" style={{ fontSize: '1.75rem' }}>Account Settings</h1>
        <p className="text-secondary small mb-0">Manage profile data, interface defaults, and account storage.</p>
      </div>

      <div className="row g-dashboard position-relative" style={{ zIndex: 1 }}>
        
        {/* Left Column: Profile and Preferences */}
        <div className="col-12 col-lg-6 d-flex flex-column gap-4">
          
          {/* Profile Card */}
          <div className="card glass-card border-0 p-4 shadow-sm">
            <h5 className="fw-bold mb-1">
              <i className="bi bi-person-badge-fill text-primary me-2"></i>Profile Details
            </h5>
            <p className="text-secondary small mb-4">Update your email address or change account login credentials.</p>

            {profileSuccess && (
              <div className="alert alert-success border-0 py-2 px-3 small rounded-3 mb-3 d-flex align-items-center gap-2" role="alert" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#34d399' }}>
                <i className="bi bi-check-circle-fill"></i>
                <div>{profileSuccess}</div>
              </div>
            )}

            {profileError && (
              <div className="alert alert-danger border-0 py-2 px-3 small rounded-3 mb-3 d-flex align-items-center gap-2" role="alert" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#f87171' }}>
                <i className="bi bi-exclamation-triangle-fill"></i>
                <div>{profileError}</div>
              </div>
            )}

            <form onSubmit={handleUpdateProfile}>
              <div className="mb-3">
                <label className="form-label small fw-semibold text-secondary">Username</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={user?.username || ''} 
                  disabled 
                  style={{ opacity: 0.6, cursor: 'not-allowed' }}
                />
                <div className="form-text text-secondary" style={{ fontSize: '10px' }}>Username cannot be changed.</div>
              </div>

              <div className="mb-3">
                <label htmlFor="profile-email" className="form-label small fw-semibold text-secondary">Email Address</label>
                <input 
                  type="email" 
                  id="profile-email" 
                  className="form-control" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                />
              </div>

              <hr className="my-4 border-secondary border-opacity-10" />

              <div className="mb-3">
                <label htmlFor="profile-pass" className="form-label small fw-semibold text-secondary">New Password</label>
                <div className="input-group">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    id="profile-pass" 
                    className="form-control border-end-0" 
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Leave blank to keep current password"
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

              <div className="mb-4">
                <label htmlFor="profile-confirm" className="form-label small fw-semibold text-secondary">Confirm New Password</label>
                <div className="input-group">
                  <input 
                    type={showConfirmPassword ? "text" : "password"} 
                    id="profile-confirm" 
                    className="form-control border-end-0" 
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                  />
                  <button
                    type="button"
                    className="input-group-text bg-transparent border-start-0 text-secondary"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0, cursor: 'pointer' }}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    <i className={`bi ${showConfirmPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                  </button>
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-sm px-4 py-2 w-100 fw-semibold text-white" disabled={profileUpdating}>
                {profileUpdating ? (
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                ) : "Save Profile Details"}
              </button>
            </form>
          </div>

        </div>

        {/* Right Column: Preferences & Danger Zone */}
        <div className="col-12 col-lg-6 d-flex flex-column gap-4">
          
          {/* Preferences Card */}
          <div className="card glass-card border-0 p-4 shadow-sm">
            <h5 className="fw-bold mb-1">
              <i className="bi bi-sliders text-primary me-2"></i>Display Preferences
            </h5>
            <p className="text-secondary small mb-4">Set default query parameters for your Leads Directory view.</p>

            {prefSuccess && (
              <div className="alert alert-success border-0 py-2 px-3 small rounded-3 mb-3 d-flex align-items-center gap-2" role="alert" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#34d399' }}>
                <i className="bi bi-check-circle-fill"></i>
                <div>Preferences saved successfully!</div>
              </div>
            )}

            <form onSubmit={handleSavePreferences}>
              <div className="mb-3">
                <label htmlFor="pref-size" className="form-label small fw-semibold text-secondary">Default Page Size</label>
                <select 
                  id="pref-size"
                  className="form-select" 
                  value={pageSize}
                  onChange={e => setPageSize(e.target.value)}
                >
                  <option value="10">10 Leads</option>
                  <option value="20">20 Leads (Default)</option>
                  <option value="50">50 Leads</option>
                  <option value="100">100 Leads</option>
                </select>
              </div>

              <div className="mb-3">
                <label htmlFor="pref-ordering" className="form-label small fw-semibold text-secondary">Default Sorting Order</label>
                <select 
                  id="pref-ordering"
                  className="form-select" 
                  value={ordering}
                  onChange={e => setOrdering(e.target.value)}
                >
                  <option value="-created_date">Creation Date (Newest first)</option>
                  <option value="created_date">Creation Date (Oldest first)</option>
                  <option value="name">Name (A-Z)</option>
                  <option value="-name">Name (Z-A)</option>
                  <option value="lead_status">Status stage (Ascending)</option>
                  <option value="-lead_status">Status stage (Descending)</option>
                </select>
              </div>

              <div className="mb-4">
                <label htmlFor="pref-source" className="form-label small fw-semibold text-secondary">Default Source Filter</label>
                <select 
                  id="pref-source"
                  className="form-select" 
                  value={source}
                  onChange={e => setSource(e.target.value)}
                >
                  <option value="">All Sources</option>
                  <option value="facebook">Facebook Ads</option>
                  <option value="google">Google Search</option>
                  <option value="organic">Organic</option>
                </select>
              </div>

              <button type="submit" className="btn btn-outline-primary btn-sm px-4 py-2 w-100 fw-semibold">
                Save Layout Preferences
              </button>
            </form>
          </div>

          {/* Danger Zone Card */}
          <div className="card glass-card border border-danger border-opacity-25 p-4 shadow-sm">
            <h5 className="fw-bold mb-1 text-danger">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>Danger Zone
            </h5>
            <p className="text-secondary small mb-4">Irreversible management options for your database storage.</p>

            {dangerSuccess && (
              <div className="alert alert-success border-0 py-2 px-3 small rounded-3 mb-3 d-flex align-items-center gap-2" role="alert" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#34d399' }}>
                <i className="bi bi-check-circle-fill"></i>
                <div>{dangerSuccess}</div>
              </div>
            )}

            {dangerError && (
              <div className="alert alert-danger border-0 py-2 px-3 small rounded-3 mb-3 d-flex align-items-center gap-2" role="alert" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#f87171' }}>
                <i className="bi bi-exclamation-triangle-fill"></i>
                <div>{dangerError}</div>
              </div>
            )}

            <div className="p-3 rounded-4 bg-danger bg-opacity-10 text-danger border border-danger border-opacity-15 mb-4">
              <div className="small fw-bold mb-1">Clear Account Leads Directory</div>
              <div className="small" style={{ fontSize: '11px', opacity: 0.8 }}>
                This option will permanently delete all leads, contact notes, and status milestones you have created. This action cannot be reversed.
              </div>
            </div>

            <form onSubmit={handleDeleteAll}>
              <div className="mb-4">
                <label htmlFor="confirm-delete" className="form-label small fw-semibold text-secondary">
                  Confirm by typing <code className="text-danger fw-bold">DELETE</code>
                </label>
                <input 
                  type="text" 
                  id="confirm-delete"
                  className="form-control border-danger" 
                  value={confirmDeleteWord}
                  onChange={e => setConfirmDeleteWord(e.target.value)}
                  placeholder="Type DELETE"
                  required
                />
              </div>

              <button type="submit" className="btn btn-outline-danger btn-sm px-4 py-2 w-100 fw-semibold" disabled={dangerDeleting}>
                {dangerDeleting ? (
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                ) : "Delete All Leads Permanently"}
              </button>
            </form>
          </div>

        </div>

      </div>

    </div>
  );
}
