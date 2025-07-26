// src/pages/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import SummaryCard from '../components/SummaryCard';
import '../styles/App.css';
import axios from 'axios';

// Enhanced UserManagement component
function UserManagement() {
  const initialUsers = [
    { name: 'Ravi Sharma', role: 'HR', email: 'ravi@company.com', contact: '9876543210', status: 'Active', created: '2025-07-20', lastLogin: '2025-07-25' },
    { name: 'Meera Joshi', role: 'Manager', email: 'meera@company.com', contact: '9876543211', status: 'Disabled', created: '2025-07-18', lastLogin: '2025-07-22' },
    { name: 'Amit Patel', role: 'HR', email: 'amit@company.com', contact: '9876543212', status: 'Active', created: '2025-07-15', lastLogin: '2025-07-21' },
    { name: 'Priya Singh', role: 'Manager', email: 'priya@company.com', contact: '9876543213', status: 'Active', created: '2025-07-10', lastLogin: '2025-07-20' },
  ];
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filtered = users.filter(user =>
    (user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase())) &&
    (roleFilter ? user.role === roleFilter : true) &&
    (statusFilter ? user.status === statusFilter : true)
  );

  const toggleStatus = (index) => {
    setUsers(users =>
      users.map((u, i) =>
        i === index ? { ...u, status: u.status === 'Active' ? 'Disabled' : 'Active' } : u
      )
    );
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search by name or email"
            className="border rounded px-2 py-1"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select
            className="border rounded px-2 py-1"
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
          >
            <option value="">All Roles</option>
            <option value="HR">HR</option>
            <option value="Manager">Manager</option>
          </select>
          <select
            className="border rounded px-2 py-1"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="Active">Active</option>
            <option value="Disabled">Disabled</option>
          </select>
        </div>
        <div className="text-sm text-gray-500">
          Showing {filtered.length} of {users.length} users
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border">
          <thead>
            <tr className="bg-gray-200">
              <th className="border p-2">Name</th>
              <th className="border p-2">Role</th>
              <th className="border p-2">Email</th>
              <th className="border p-2">Contact</th>
              <th className="border p-2">Created</th>
              <th className="border p-2">Last Login</th>
              <th className="border p-2">Status</th>
              <th className="border p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((user, index) => (
              <tr key={index} className="text-center hover:bg-blue-50 transition">
                <td className="border p-2">{user.name}</td>
                <td className="border p-2">{user.role}</td>
                <td className="border p-2">{user.email}</td>
                <td className="border p-2">{user.contact}</td>
                <td className="border p-2">{user.created}</td>
                <td className="border p-2">{user.lastLogin}</td>
                <td className="border p-2">
                  <span className={`px-2 py-1 rounded-full text-white ${user.status === 'Active' ? 'bg-green-500' : 'bg-red-500'}`}>{user.status}</span>
                </td>
                <td className="border p-2 flex flex-col gap-1 md:flex-row md:gap-2 justify-center">
                  <button onClick={() => toggleStatus(index)} className="text-xs text-blue-600 hover:underline">{user.status === 'Active' ? '🔒 Disable' : '🔓 Enable'}</button>
                  <button className="text-xs text-yellow-600 hover:underline">✏️ Edit</button>
                  <button className="text-xs text-red-600 hover:underline">🗑️ Delete</button>
                  <button className="text-xs text-purple-600 hover:underline">🔑 Reset Password</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="p-4 text-gray-400">No users found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Live clock widget
function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return <span className="live-clock">{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}</span>;
}

// Profile avatar (placeholder)
function ProfileAvatar() {
  return <img src="https://ui-avatars.com/api/?name=Admin" alt="Profile" className="profile-avatar" />;
}

// User management table (placeholder data)
const initialUsers = [
  { name: 'Ravi Sharma', role: 'HR', email: 'ravi@company.com', status: 'Active' },
  { name: 'Meera Joshi', role: 'Manager', email: 'meera@company.com', status: 'Disabled' },
];

export default function AdminDashboard() {
  const [user] = useState({ name: '' });
  const [summary] = useState({
    totalActive: 12,
    totalHRs: 5,
    totalManagers: 4,
    disabled: 2,
    recent: 3,
    currentDate: new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
  });
  const [users, setUsers] = useState(initialUsers);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    role: 'HR',
    username: '',
    email: '',
    contactNumber: '',
    password: '',
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formFieldErrors, setFormFieldErrors] = useState({});
  const [formSuccess, setFormSuccess] = useState('');

  const navigate = useNavigate();

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormFieldErrors({});
    setFormSuccess('');
    setFormLoading(true);
    try {
      const token = localStorage.getItem('jwtToken');
      await axios.post('/payflowapi/user/admin/create', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFormSuccess('User created successfully!');
      setFormData({ role: 'HR', username: '', email: '', contactNumber: '', password: '' });
    } catch (error) {
      if (error.response?.data?.details) {
        setFormFieldErrors(error.response.data.details);
      }
      setFormError(
        error.response?.data?.error ||
        (error.response?.data?.details && Object.values(error.response.data.details).join(', ')) ||
        'User creation failed.'
      );
    } finally {
      setFormLoading(false);
    }
  };

  // Handle enable/disable user
  const toggleUserStatus = idx => {
    setUsers(users => users.map((u, i) => i === idx ? { ...u, status: u.status === 'Active' ? 'Disabled' : 'Active' } : u));
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('jwtToken');
    navigate('/');
  };

  return (
    <div className="dashboard-layout admin-dashboard">
      <aside className="sidebar admin-sidebar">
        <div className="sidebar-logo">PayFlow</div>
        <nav>
          <ul>
            <li className="active"><a href="/admin-dashboard">🏠 Dashboard</a></li>
            <li><a href="/employees">👥 Manage Users</a></li>
            <li><button className="logout-btn" onClick={handleLogout}>🚪 Logout</button></li>
          </ul>
        </nav>
      </aside>
      <div className="main-content admin-main-content">
        {/* Header */}
        <div className="admin-header-row">
          <div className="welcome-message">👋 Welcome, Admin {user.name}!</div>
          <div className="header-right">
            <LiveClock />
            <ProfileAvatar />
          </div>
        </div>
        {/* Info Cards */}
        <div className="summary-cards-grid admin-cards-grid">
          <SummaryCard title="Total Active Users" value={summary.totalActive} />
          <SummaryCard title="Total HRs" value={summary.totalHRs} />
          <SummaryCard title="Total Managers" value={summary.totalManagers} />
          <SummaryCard title="Disabled Users" value={summary.disabled} />
          <SummaryCard title="Current Date" value={summary.currentDate} />
          <SummaryCard title="Recent User Events" value={summary.recent} />
        </div>
        {/* Create New User Button */}
        <div className="admin-actions-row">
          <button className="create-user-btn" onClick={() => setShowCreateModal(true)}>
            🔐 Create New User (HR/Manager)
          </button>
        </div>
        {/* Create User Modal */}
        {showCreateModal && (
          <div className="modal-backdrop">
            <div className="modal">
              <h3 className="mb-3">Create New User (HR/Manager)</h3>
              <form onSubmit={handleFormSubmit} className="create-user-form">
                {/* Show field-specific errors */}
                {Object.values(formFieldErrors).length > 0 && (
                  <div className="login-error mb-2">
                    {Object.entries(formFieldErrors).map(([field, msg]) => (
                      <div key={field}>{msg}</div>
                    ))}
                  </div>
                )}
                {formError && <div className="login-error mb-2">{formError}</div>}
                {formSuccess && <div className="success-message mb-2">{formSuccess}</div>}
                <div className="form-group">
                  <label>Role</label>
                  <select name="role" value={formData.role} onChange={handleFormChange} className="form-input">
                    <option value="HR">HR</option>
                    <option value="MANAGER">Manager</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Username</label>
                  <input name="username" type="text" value={formData.username} onChange={handleFormChange} required className="form-input" />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input name="email" type="email" value={formData.email} onChange={handleFormChange} required className="form-input" />
                </div>
                <div className="form-group">
                  <label>Contact Number</label>
                  <input name="contactNumber" type="text" value={formData.contactNumber} onChange={handleFormChange} required className="form-input" />
                </div>
                <div className="form-group">
                  <label>Password</label>
                  <input name="password" type="password" value={formData.password} onChange={handleFormChange} required className="form-input" />
                </div>
                <button type="submit" className="login-btn" disabled={formLoading}>
                  {formLoading ? 'Creating...' : 'Create User'}
                </button>
                <button type="button" className="login-btn" style={{marginTop: '10px', backgroundColor: '#f44336'}} onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
