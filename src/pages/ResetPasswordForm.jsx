import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ResetPasswordForm.css'; // Assuming you have a CSS file for styling
const ResetPasswordForm = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || '';

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      await axios.post('/payflowapi/user/reset-password', {
        email,
        oldPassword,
        newPassword,
      });
      alert('Password reset successful!');
      navigate('/login'); // or manager-dashboard
    } catch (error) {
      alert('Password reset failed: ' + (error.response?.data?.error || error.message));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="reset-password-form">
      <h2>Reset Password</h2>
      <div>
        <label>Email</label>
        <input type="email" value={email} readOnly />
      </div>
      <div>
        <label>Old Password</label>
        <input type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} required />
      </div>
      <div>
        <label>New Password</label>
        <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
      </div>
      <button type="submit">Reset Password</button>
    </form>
  );
};

export default ResetPasswordForm;