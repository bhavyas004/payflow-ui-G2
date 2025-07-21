// src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/App.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('admin');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
      const firstLogin = false;//use true or false to get reset password page or dashboard
      // Redirect logic
      if (firstLogin && (role === 'hr' || role === 'manager')) {
        navigate('/reset-password');
      } else if (role === 'admin') {
        navigate('/admin-dashboard');
      } else if (role === 'hr') {
        navigate('/hr-dashboard');
      } else if (role === 'manager') {
        navigate('/manager-dashboard');
      }
  };

  return (
    <div className="container">
      <form className="form-box" onSubmit={handleLogin}>
        <h2>Payflow AI Login</h2>

        <div className="input-field">
          <label>Email</label>
          <input
            type="email"
            placeholder="Enter your email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="input-field">
          <label>Password</label>
          <input
            type="password"
            placeholder="Enter your password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="input-field">
          <label>Select Role</label>
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="admin">Admin</option>
            <option value="hr">HR</option>
            <option value="manager">Manager</option>
          </select>
        </div>

        <button type="submit" className="button">Login</button>
        <p className="forgot-password-link">
          <a href="/reset-password">Forgot Password?</a>
        </p>

      </form>
    </div>
  );
}

export default Login;
