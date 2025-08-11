// src/pages/PasswordReset.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/App.css';

function PasswordReset() {
  const [username, setUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const navigate = useNavigate();

  const handleReset = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    try {
      const token = sessionStorage.getItem('jwtToken');
      await axios.post('/payflowapi/user/reset-password', {
        username: username,
        oldPassword: oldPassword,
        newPassword: newPassword
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      alert('Password reset successful! Redirecting to PayFlow-AI...');
      setUsername('');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      // Redirect to unified interface after successful password reset
      setTimeout(() => {
        navigate('/payflow-ai/dashboard');
      }, 1500);
    } catch (error) {
      alert('Password reset failed: ' + (error.response?.data?.error || error.message));
    }
  };

  return (
    <div className="container">
      <div className="form-box">
        <h2>Reset Password</h2>
        <form onSubmit={handleReset}>
          <div className="input-field">
            <label>User Name</label>
            <input
              type="text"
              placeholder="Your registered User Name"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
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
    </div>
  );
}

export default PasswordReset;
