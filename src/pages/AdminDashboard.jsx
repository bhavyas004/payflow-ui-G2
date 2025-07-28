// src/pages/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import SummaryCard from '../components/SummaryCard';
import '../styles/App.css';
import axios from 'axios';

// JWT parser function
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

// Enhanced UserManagement component
function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('jwtToken');
      const response = await axios.get('/payflowapi/user/hr-managers', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = users.filter(user =>
    (user.username?.toLowerCase().includes(search.toLowerCase()) ||
      user.email?.toLowerCase().includes(search.toLowerCase())) &&
    (roleFilter ? user.role === roleFilter : true)
  );

  return (
    <div>
      <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search by name or email"
          style={{ padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px', minWidth: '200px' }}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          style={{ padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
        >
          <option value="">All Roles</option>
          <option value="HR">HR</option>
          <option value="MANAGER">Manager</option>
        </select>
        <div style={{ marginLeft: 'auto', fontSize: '0.9rem', color: '#666' }}>
          Showing {filtered.length} of {users.length} users
        </div>
      </div>
      <div className="table-container">
        <table className="onboard-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Email</th>
              <th>Contact</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} style={{textAlign: 'center', padding: '2rem'}}>Loading users...</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={4} style={{textAlign: 'center', padding: '2rem'}}>No users found.</td>
              </tr>
            ) : (
              filtered.map((user, index) => (
                <tr key={user.id || index}>
                  <td>{user.username}</td>
                  <td>
                    <span className={`status-badge ${user.role?.toLowerCase()}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>{user.email || 'N/A'}</td>
                  <td>{user.contactNumber || 'N/A'}</td>
                </tr>
              ))
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

export default function AdminDashboard() {
  const [user, setUser] = useState({ name: '' });
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' or 'users'
  const [summary, setSummary] = useState({
    totalUsers: 0,
    totalHRs: 0,
    totalManagers: 0,
    currentDate: new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
  });
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

  useEffect(() => {
    // Extract user info from JWT token
    const token = localStorage.getItem('jwtToken');
    if (token) {
      const payload = parseJwt(token);
      setUser({ name: payload.sub || payload.username || 'User' });
    }
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      const token = localStorage.getItem('jwtToken');
      const [userCountsRes, totalUsersRes] = await Promise.all([
        axios.get('/payflowapi/user/counts', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('/payflowapi/stats/users/total', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      
      setSummary(prev => ({
        ...prev,
        totalUsers: totalUsersRes.data.totalUsers || 0,
        totalHRs: userCountsRes.data.HR || 0,
        totalManagers: userCountsRes.data.MANAGER || 0,
      }));
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

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
      // Refresh statistics after creating user
      fetchStatistics();
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
            <li className={currentView === 'dashboard' ? 'active' : ''}><a href="#" onClick={(e) => {e.preventDefault(); setCurrentView('dashboard')}}>🏠 Dashboard</a></li>
            <li className={currentView === 'users' ? 'active' : ''}><a href="#" onClick={(e) => {e.preventDefault(); setCurrentView('users')}}>👥 Users</a></li>
            <li><button className="logout-btn" onClick={handleLogout}>🚪 Logout</button></li>
          </ul>
        </nav>
      </aside>
      <div className="main-content admin-main-content">
        {currentView === 'dashboard' ? (
          <>
            {/* Header */}
            <div className="admin-header-row">
              <div className="welcome-message">👋 Welcome, {user.name}!</div>
              <div className="header-right">
                <LiveClock />
                <ProfileAvatar />
              </div>
            </div>
            {/* Info Cards */}
            <div className="summary-cards-grid admin-cards-grid">
              <SummaryCard title="Total Users" value={summary.totalUsers} />
              <SummaryCard title="Total HRs" value={summary.totalHRs} />
              <SummaryCard title="Total Managers" value={summary.totalManagers} />
              <SummaryCard title="Current Date" value={summary.currentDate} />
            </div>
            {/* Create New User Button */}
            <div className="admin-actions-row">
              <button className="create-user-btn" onClick={() => setShowCreateModal(true)}>
                🔐 Create New User (HR/Manager)
              </button>
            </div>
          </>
        ) : (
          <div style={{ padding: '20px' }}>
            <h2 style={{ marginBottom: '20px' }}>Users (HR & Managers)</h2>
            <UserManagement />
          </div>
        )}
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
