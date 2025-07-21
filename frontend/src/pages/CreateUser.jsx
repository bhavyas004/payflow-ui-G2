import React, { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import '../styles/App.css';

function CreateUser() {
  const [formData, setFormData] = useState({
    role: 'HR',
    username: '',
    email: '',
    contactNumber: '',
    password: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("User Data Submitted:", formData);
    alert("User created successfully (simulated)!");
    setFormData({
      role: 'HR',
      username: '',
      email: '',
      contactNumber: '',
      password: '',
    });
  };

  return (
    <DashboardLayout role="Admin">
      <div className="form-container">
        <h2>Create New User</h2>
        <form onSubmit={handleSubmit} className="form-dashboard">
          <div className="input-field">
            <label>Role</label>
            <select name="role" value={formData.role} onChange={handleChange}>
              <option value="HR">HR</option>
              <option value="MANAGER">Manager</option>
            </select>
          </div>

          <div className="input-field">
            <label>Username</label>
            <input
              name="username"
              type="text"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-field">
            <label>Email</label>
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-field">
            <label>Contact Number</label>
            <input
              name="contactNumber"
              type="text"
              value={formData.contactNumber}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-field">
            <label>Password</label>
            <input
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="button">Create User</button>
        </form>
      </div>
    </DashboardLayout>
  );
}

export default CreateUser;
