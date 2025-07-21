// src/pages/PasswordReset.jsx
import React, { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import '../styles/App.css';

function PasswordReset() {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleReset = (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    // Simulated API logic
    console.log("Password reset for:", email);
    alert("Password reset successful (simulated)!");
    setEmail('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <DashboardLayout role="User">
      <div className="form-container">
        <h2>Reset Password</h2>
        <form onSubmit={handleReset} className="form-dashboard">
          <div className="input-field">
            <label>Email</label>
            <input
              type="email"
              placeholder="Your registered email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-field">
            <label>New Password</label>
            <input
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>

          <div className="input-field">
            <label>Confirm Password</label>
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="button">Reset Password</button>
        </form>
      </div>
    </DashboardLayout>
  );
}

export default PasswordReset;
