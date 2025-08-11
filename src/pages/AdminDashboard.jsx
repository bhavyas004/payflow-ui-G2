import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Topbar from '../components/Topbar';
import SummaryCard from '../components/SummaryCard';
import CollapsibleSidebar from '../components/CollapsibleSidebar';
import UserManagement from '../components/UserManagement';
import PayrollManagement from './AdminPayrollManagement';
import SimpleUnifiedPayrollManagement from '../components/SimpleUnifiedPayrollManagement';
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

// Admin Navigation Component
function AdminNavigation({ active, onNavigate, onLogout, useUnifiedUI, onToggleUI }) {
  return (
    <ul>
      <li className={active === 'dashboard' ? 'active' : ''}>
        <a href="#" onClick={(e) => {e.preventDefault(); onNavigate('dashboard')}}>🏠 Dashboard</a>
      </li>
      <li className={active === 'users' ? 'active' : ''}>
        <a href="#" onClick={(e) => {e.preventDefault(); onNavigate('users')}}>👥 Users</a>
      </li>
      <li className={active === 'payroll' ? 'active' : ''}>
        <a href="#" onClick={(e) => {e.preventDefault(); onNavigate('payroll')}}>💰 Payroll</a>
      </li>
      <li className="ui-toggle">
        <div style={{ padding: '0.5rem', borderTop: '1px solid #e2e8f0', marginTop: '1rem' }}>
          <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input 
              type="checkbox" 
              checked={useUnifiedUI} 
              onChange={onToggleUI}
              style={{ margin: 0 }}
            />
            🆕 Use New UI
          </label>
        </div>
      </li>
      <li>
        <button className="btn btn-ghost btn-sm w-full" onClick={onLogout}>🚪 Logout</button>
      </li>
    </ul>
  );
}

export default function AdminDashboard() {
  const [user, setUser] = useState({ name: '' });
  const sidebarRef = useRef(null);
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard', 'users', or 'payroll'
  const [useUnifiedUI, setUseUnifiedUI] = useState(true); // Toggle between old and new UI
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
    const token = sessionStorage.getItem('jwtToken');
    if (token) {
      const payload = parseJwt(token);
      setUser({ name: payload.sub || payload.username || 'User' });
    }
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      const token = sessionStorage.getItem('jwtToken');
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
      const token = sessionStorage.getItem('jwtToken');
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
    sessionStorage.removeItem('jwtToken');
    navigate('/');
  };

  return (
    <div className="dashboard-layout">
      <CollapsibleSidebar ref={sidebarRef} logo="PayFlow Admin">
        <AdminNavigation 
          active={currentView} 
          onNavigate={setCurrentView}
          onLogout={handleLogout}
          useUnifiedUI={useUnifiedUI}
          onToggleUI={() => setUseUnifiedUI(!useUnifiedUI)}
        />
      </CollapsibleSidebar>
      <div className="main-content">
        <Topbar
          title="Admin Dashboard"
          user={user}
          onLogout={handleLogout}
          sidebarRef={sidebarRef}
        />
        {currentView === 'payroll' ? (
          <div className="p-6">
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '1.5rem',
              padding: '1rem',
              background: useUnifiedUI ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f8fafc',
              color: useUnifiedUI ? 'white' : 'inherit',
              borderRadius: '0.5rem'
            }}>
              <h2 className="text-2xl font-bold">
                {useUnifiedUI ? '🚀 Unified Payroll Management' : 'Payroll Management'}
              </h2>
              {useUnifiedUI && (
                <span style={{ fontSize: '0.875rem' }}>
                  ✨ New Enhanced Interface
                </span>
              )}
            </div>
            {useUnifiedUI ? (
              <SimpleUnifiedPayrollManagement />
            ) : (
              <PayrollManagement />
            )}
          </div>
        ) : currentView === 'users' ? (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">Users (HR & Managers)</h2>
            <UserManagement />
          </div>
        ) : (
          <div className="p-6">
            {/* Welcome Section */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold mb-2">👋 Welcome, {user.name}!</h1>
                <p className="text-gray-600">System administration and overview.</p>
              </div>
              <div className="flex items-center gap-4 mt-4 md:mt-0">
                <LiveClock />
                <ProfileAvatar />
              </div>
            </div>

            {/* Summary Cards */}
            <div className="mb-8">
              <div className="summary-cards-container">
                <div className="summary-cards-grid">
                  <SummaryCard title="Total Users" value={summary.totalUsers} />
                  <SummaryCard title="Total HRs" value={summary.totalHRs} />
                  <SummaryCard title="Total Managers" value={summary.totalManagers} />
                  <SummaryCard title="Current Date" value={summary.currentDate} />
                </div>
              </div>
            </div>

            {/* Create New User Button */}
            <div className="flex justify-end mb-6">
              <button 
                className="btn btn-primary"
                onClick={() => setShowCreateModal(true)}
              >
                🔐 Create New User (HR/Manager)
              </button>
            </div>
          </div>
        )}
        
        {/* Create User Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-modal">
            <div className="card w-full max-w-md">
              <div className="card-content">
                <h3 className="text-xl font-semibold mb-6">Create New User (HR/Manager)</h3>
                <form onSubmit={handleFormSubmit} className="space-y-4">
                  {/* Show field-specific errors */}
                  {Object.values(formFieldErrors).length > 0 && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      {Object.entries(formFieldErrors).map(([field, msg]) => (
                        <div key={field} className="text-red-800 text-sm">{msg}</div>
                      ))}
                    </div>
                  )}
                  {formError && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-800 text-sm">{formError}</p>
                    </div>
                  )}
                  {formSuccess && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-green-800 text-sm">{formSuccess}</p>
                    </div>
                  )}
                  
                  <div className="form-group">
                    <label className="form-label">Role</label>
                    <select name="role" value={formData.role} onChange={handleFormChange} className="form-select">
                      <option value="HR">HR</option>
                      <option value="MANAGER">Manager</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Username</label>
                    <input name="username" type="text" value={formData.username} onChange={handleFormChange} required className="form-input" />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input name="email" type="email" value={formData.email} onChange={handleFormChange} required className="form-input" />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Contact Number</label>
                    <input name="contactNumber" type="text" value={formData.contactNumber} onChange={handleFormChange} required className="form-input" />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Password</label>
                    <input name="password" type="password" value={formData.password} onChange={handleFormChange} required className="form-input" />
                  </div>
                  
                  <div className="flex gap-3 pt-4">
                    <button type="submit" className="btn btn-primary flex-1" disabled={formLoading}>
                      {formLoading ? 'Creating...' : 'Create User'}
                    </button>
                    <button type="button" className="btn btn-ghost flex-1" onClick={() => setShowCreateModal(false)}>
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}