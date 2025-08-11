import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/App.css';

function parseJwt(token) {
  if (!token) return {};
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return {};
  }
}

export default function EmployeeLoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const res = await axios.post('http://localhost:8080/payflowapi/onboard-employee/login', {
        username: email,
        password,
      });
      const token = res.data.token;
      sessionStorage.setItem('jwtToken', token);
      const payload = parseJwt(token);
      // Redirect to unified PayFlow-AI interface for all authenticated employees
      navigate('/payflow-ai/dashboard', { state: { user: payload } });
    } catch (err) {
      if (err.response && err.response.status === 400) {
        setError(err.response.data.message || 'Invalid email or password.');
      } else if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Login failed. Please check your credentials.');
      }
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
            {/* Role Indicator */}
            <div className="text-center mb-6">
              <div className="badge badge-success mb-4">Employee Portal</div>
              <h1 className="text-3xl font-bold mb-2" style={{ 
                color: 'var(--primary-solid)'
              }}>
                PayFlow
              </h1>
              <p className="text-gray-600">Welcome! Please sign in to access your workspace.</p>
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
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="form-input"
                  placeholder="Enter your email address"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="form-input"
                  placeholder="Enter your password"
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-primary w-full mb-4" 
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span>⏳</span> Signing in...
                  </span>
                ) : (
                  'Sign In'
                )}
              </button>

              <div className="text-center">
                <a 
                  href="/" 
                  className="text-sm font-medium"
                  style={{ color: 'var(--primary-solid)' }}
                >
                  User Login →
                </a>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}