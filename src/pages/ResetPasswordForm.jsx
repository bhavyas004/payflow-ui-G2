import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/App.css'; // Use the main design system

const ResetPasswordForm = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || '';
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await axios.post('/payflowapi/user/reset-password', {
        email,
        oldPassword,
        newPassword,
      });
      alert('Password reset successful!');
      navigate('/'); // Navigate back to login
    } catch (error) {
      setError('Password reset failed: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="flex items-center justify-center p-6" 
      style={{ 
        background: 'var(--bg-secondary)',
        minHeight: '100vh',
        height: '100vh'
      }}
    >
      <div style={{ width: '400px' }}>
        <div className="card" style={{ border: '1px solid var(--border-light)' }}>
          <div className="card-content">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="badge badge-warning mb-4">Password Reset Required</div>
              <h1 className="text-3xl font-bold mb-2" style={{ 
                color: 'var(--primary-solid)'
              }}>
                PayFlow
              </h1>
              <p className="text-gray-600">Please update your password to continue.</p>
            </div>

            {error && (
              <div className="mb-4 p-4 rounded-lg" style={{ 
                background: '#fef2f2', 
                border: '1px solid #fecaca',
                borderRadius: 'var(--radius-lg)'
              }}>
                <p className="text-sm" style={{ color: 'var(--error)' }}>{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input 
                  type="email" 
                  value={email} 
                  readOnly 
                  className="form-input"
                  style={{ backgroundColor: 'var(--bg-tertiary)', cursor: 'not-allowed' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Current Password</label>
                <input 
                  type="password" 
                  value={oldPassword} 
                  onChange={e => setOldPassword(e.target.value)} 
                  required 
                  className="form-input"
                  placeholder="Enter your current password"
                />
              </div>

              <div className="form-group">
                <label className="form-label">New Password</label>
                <input 
                  type="password" 
                  value={newPassword} 
                  onChange={e => setNewPassword(e.target.value)} 
                  required 
                  className="form-input"
                  placeholder="Enter your new password"
                />
                <div className="form-help">
                  Password should be at least 8 characters long.
                </div>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary w-full mb-4"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span>⏳</span> Updating Password...
                  </span>
                ) : (
                  'Update Password'
                )}
              </button>

              <div className="text-center">
                <a 
                  href="/" 
                  className="text-sm font-medium"
                  style={{ color: 'var(--primary-solid)' }}
                >
                  ← Back to Login
                </a>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordForm;