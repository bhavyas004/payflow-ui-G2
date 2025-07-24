// src/pages/PasswordReset.jsx
import React, { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import axios from 'axios';
import '../styles/App.css';

function PasswordReset() {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [oldPassword, setOldPassword] = useState('');

  const handleReset = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    try {
      const token = localStorage.getItem('jwtToken');
      await axios.post('/payflowapi/user/reset-password', {
        username: email,
        oldPassword: oldPassword,
        newPassword: newPassword
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      alert('Password reset successful!');
      setEmail('');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      alert('Password reset failed: ' + (error.response?.data?.error || error.message));
    }
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
            <label>Old Password</label>
            <input
              type="password"
              placeholder="Enter old password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
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
