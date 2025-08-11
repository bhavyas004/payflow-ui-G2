import React, { useState, useEffect } from 'react';
import { useAuth } from '../../shared/hooks/useAuth';
import Layout from '../../shared/components/Layout';
import PermissionWrapper from '../../shared/components/PermissionWrapper';
import axios from 'axios';
import '../../shared/styles/unified.css';
import { 
  validateUsername, 
  validateEmail, 
  validatePassword, 
  validateContactNumber,
  validateForm 
} from '../utils/validationUtils';

/**
 * Unified User Management Component
 * Manages system users (HR, Admin, Manager) with login credentials and roles
 * Different from employees - these are users who can access the system
 */
function UnifiedUserManagement() {
  const { user, role, getToken, checkRole } = useAuth();
  
  // Helper function to check if user can access certain roles
  const canAccess = (roles) => checkRole(roles);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);
  
  // Form states for user creation
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    contactNumber: '',
    role: 'HR'
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  // Use shared validation functions
  const validateFormData = () => {
    const validationRules = {
      username: validateUsername,
      email: validateEmail,
      password: validatePassword,
      contactNumber: validateContactNumber
    };
    
    const { errors, isValid } = validateForm(formData, validationRules);
    setValidationErrors(errors);
    return isValid;
  };

  useEffect(() => {
    fetchUsers();
  }, [role]);

  useEffect(() => {
    applyFilters();
  }, [users, searchTerm, roleFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const headers = { Authorization: `Bearer ${token}` };
      
      // Fetch system users (HR, Admin, Manager)
      const response = await axios.get('http://localhost:8080/payflowapi/user/hr-managers', { headers });
      setUsers(response.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...users];
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(usr =>
        usr.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        usr.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        usr.contactNumber?.includes(searchTerm) ||
        usr.id?.toString().includes(searchTerm)
      );
    }
    
    // Apply role filter
    if (roleFilter) {
      filtered = filtered.filter(usr => usr.role === roleFilter);
    }
    
    setFilteredUsers(filtered);
    setCurrentPage(1);
  };

  // Handle user role update
  const handleRoleUpdate = async (selectedUser, newRole) => {
    try {
      const token = getToken();
      const headers = { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      await axios.put(
        `http://localhost:8080/payflowapi/user/${selectedUser.id}/role`,
        { role: newRole },
        { headers }
      );
      
      setUsers(prev => 
        prev.map(usr => 
          usr.id === selectedUser.id 
            ? { ...usr, role: newRole }
            : usr
        )
      );
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('Failed to update user role');
    }
  };

  // Handle user creation
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    setFormSuccess('');
    
    // Validate form before submission
    if (!validateFormData()) {
      setFormLoading(false);
      setFormError('Please fix the validation errors below');
      return;
    }
    
    try {
      const token = getToken();
      const headers = { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      await axios.post(
        'http://localhost:8080/payflowapi/user/admin/create',
        formData,
        { headers }
      );
      
      setFormSuccess('User created successfully!');
      setFormData({
        username: '',
        email: '',
        password: '',
        contactNumber: '',
        role: 'HR'
      });
      setValidationErrors({});
      setShowCreateModal(false);
      fetchUsers(); // Refresh the list
    } catch (error) {
      setFormError(
        error.response?.data?.error || 
        error.response?.data?.message || 
        'Failed to create user'
      );
    } finally {
      setFormLoading(false);
    }
  };

  // Get available tabs based on user permissions
  const getAvailableTabs = () => {
    const tabs = [];
    
    // Overview tab - available to all admins
    tabs.push({ id: 'overview', label: 'Overview', icon: '📊' });
    
    // User list - Admin only
    if (canAccess(['ADMIN'])) {
      tabs.push({ id: 'users', label: 'System Users', icon: '👤' });
    }
    
    // User creation - Admin only
    if (canAccess(['ADMIN'])) {
      tabs.push({ id: 'create', label: 'Add User', icon: '➕' });
    }
    
    return tabs;
  };

  // Render overview
  const renderOverview = () => {
    const stats = {
      totalUsers: users.length,
      hrUsers: users.filter(usr => usr.role === 'HR').length,
      managerUsers: users.filter(usr => usr.role === 'MANAGER').length
    };

    return (
      <div className="user-overview">
        <div className="overview-header">
          <h3>System Users Overview</h3>
          <p>Administrative users with system access</p>
        </div>
        
        <div className="overview-stats">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <h4>{stats.totalUsers}</h4>
              <p>Total System Users</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">👔</div>
            <div className="stat-content">
              <h4>{stats.hrUsers}</h4>
              <p>HR Users</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">👨‍💼</div>
            <div className="stat-content">
              <h4>{stats.managerUsers}</h4>
              <p>Managers</p>
            </div>
          </div>
        </div>
        
        <PermissionWrapper requiredPermissions={['CREATE_USERS']}>
          <div className="quick-actions">
            <h4>Quick Actions</h4>
            <div className="action-buttons">
              <button 
                className="btn btn-primary"
                onClick={() => setActiveTab('create')}
              >
                ➕ Add New User
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => setActiveTab('users')}
              >
                👤 View All Users
              </button>
              <button 
                className="btn btn-ghost"
                onClick={fetchUsers}
                disabled={loading}
              >
                🔄 Refresh Data
              </button>
            </div>
          </div>
        </PermissionWrapper>
      </div>
    );
  };

  // Render user list
  const renderUserList = () => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const currentUsers = filteredUsers.slice(startIndex, endIndex);
    const totalPages = Math.ceil(filteredUsers.length / rowsPerPage);

    return (
      <div className="user-list">
        <div className="list-header">
          <h3>System Users</h3>
          <p>Manage administrative users and their roles</p>
        </div>
        
        {/* Filters */}
        <div className="filters-section" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div className="search-bar" style={{ flex: 1 }}>
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-control"
            />
          </div>
          
          <div className="filter-controls" style={{ flex: 1 }}>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="form-control"
            >
              <option value="">All Roles</option>
              <option value="HR">HR</option>
              <option value="MANAGER">Manager</option>
            </select>
          </div>
        </div>
        
        {/* User Table */}
        {loading ? (
          <div className="loading-state">Loading users...</div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Contact Number</th>
                  <th>Role</th>
                  {/* <th>Created</th> */}
                  <PermissionWrapper requiredPermissions={['UPDATE_USERS']}>
                    <th>Actions</th>
                  </PermissionWrapper>
                </tr>
              </thead>
              <tbody>
                {currentUsers.map(systemUser => (
                  <tr key={systemUser.id}>
                    <td>{systemUser.id}</td>
                    <td>{systemUser.username || systemUser.email}</td>
                    <td>{systemUser.email}</td>
                    <td>{systemUser.contactNumber || 'N/A'}</td>
                    <td>
                      <span className={`role-badge ${systemUser.role.toLowerCase()}`}>
                        {systemUser.role}
                      </span>
                    </td>
                    {/* <td>{new Date(systemUser.createdAt || Date.now()).toLocaleDateString()}</td> */}
                    <PermissionWrapper requiredPermissions={['UPDATE_USERS']}>
                      <td>
                        <div className="action-buttons">
                          <select
                            value={systemUser.role}
                            onChange={(e) => handleRoleUpdate(systemUser, e.target.value)}
                            className="form-control role-select"
                          >
                            <option value="HR">HR</option>
                            <option value="MANAGER">Manager</option>
                          </select>
                        </div>
                      </td>
                    </PermissionWrapper>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  className="btn btn-sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  Previous
                </button>
                
                <span className="pagination-info">
                  Page {currentPage} of {totalPages}
                </span>
                
                <button
                  className="btn btn-sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Render create user form
  const renderCreateUser = () => {
    return (
      <div className="create-user">
        <div className="create-header">
          <h3>Create New System User</h3>
          <p>Add a new HR or Manager user to the system</p>
        </div>
        
        <form onSubmit={handleCreateUser} className="create-form">
          {formError && (
            <div className="alert alert-error">
              {formError}
            </div>
          )}
          
          {formSuccess && (
            <div className="alert alert-success">
              {formSuccess}
            </div>
          )}
          
          {/* Row 1: Username and Email */}
          <div className="form-row" style={{ display: 'flex', gap: '1rem' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="username">Username *</label>
              <input
                type="text"
                id="username"
                value={formData.username}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData({ ...formData, username: value });
                  setValidationErrors({ ...validationErrors, username: validateUsername(value) });
                }}
                required
                className={`form-control ${validationErrors.username ? 'is-invalid' : ''}`}
                placeholder="Enter alphanumeric username"
                minLength="3"
                maxLength="20"
              />
              {validationErrors.username && (
                <small className="form-error" style={{ color: '#dc3545', fontSize: '0.875rem' }}>
                  {validationErrors.username}
                </small>
              )}
            </div>
            
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="email">Email *</label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData({ ...formData, email: value });
                  setValidationErrors({ ...validationErrors, email: validateEmail(value) });
                }}
                required
                className={`form-control ${validationErrors.email ? 'is-invalid' : ''}`}
                placeholder="Enter valid email address"
              />
              {validationErrors.email && (
                <small className="form-error" style={{ color: '#dc3545', fontSize: '0.875rem' }}>
                  {validationErrors.email}
                </small>
              )}
            </div>
          </div>
          
          {/* Row 2: Contact Number and Role */}
          <div className="form-row" style={{ display: 'flex', gap: '1rem' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="contactNumber">Contact Number</label>
              <input
                type="tel"
                id="contactNumber"
                value={formData.contactNumber}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
                  if (value.length <= 10) {
                    setFormData({ ...formData, contactNumber: value });
                    setValidationErrors({ ...validationErrors, contactNumber: validateContactNumber(value) });
                  }
                }}
                className={`form-control ${validationErrors.contactNumber ? 'is-invalid' : ''}`}
                placeholder="Enter 10-digit contact number"
                pattern="[0-9]{10}"
                title="Please enter a 10-digit phone number"
                maxLength="10"
              />
              {validationErrors.contactNumber && (
                <small className="form-error" style={{ color: '#dc3545', fontSize: '0.875rem' }}>
                  {validationErrors.contactNumber}
                </small>
              )}
            </div>
            
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="role">Role *</label>
              <select
                id="role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                required
                className="form-control"
              >
                <option value="HR">HR</option>
                <option value="MANAGER">Manager</option>
              </select>
              <small className="form-help">
                Select the appropriate role for the user
              </small>
            </div>
          </div>
          
          {/* Row 3: Password */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password">Password *</label>
              <input
                type="password"
                id="password"
                value={formData.password}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData({ ...formData, password: value });
                  setValidationErrors({ ...validationErrors, password: validatePassword(value) });
                }}
                required
                className={`form-control ${validationErrors.password ? 'is-invalid' : ''}`}
                placeholder="Enter password (6+ characters, letters and digits only)"
                minLength="6"
              />
              {validationErrors.password && (
                <small className="form-error" style={{ color: '#dc3545', fontSize: '0.875rem' }}>
                  {validationErrors.password}
                </small>
              )}
              <small className="form-help" style={{ color: '#6c757d', fontSize: '0.875rem' }}>
                Password must be at least 6 characters with letters and digits only (no special characters)
              </small>
            </div>
          </div>
          
          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={formLoading}
            >
              {formLoading ? '⏳ Creating...' : '✅ Create User'}
            </button>
            
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setFormData({
                  username: '',
                  email: '',
                  password: '',
                  contactNumber: '',
                  role: 'HR'
                });
                setValidationErrors({});
              }}
            >
              🔄 Reset Form
            </button>
          </div>
        </form>
      </div>
    );
  };

  // Render tab content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'users':
        return renderUserList();
      case 'create':
        return renderCreateUser();
      default:
        return renderOverview();
    }
  };

  const availableTabs = getAvailableTabs();

  return (
    <Layout
      title="User Management"
      subtitle="Manage system users and administrative access"
      sidebarActive="users"
      requiredRoles={['ADMIN']}
    >
      <div className="unified-user-management">
        {/* Tab Navigation */}
        <div className="tab-navigation">
          {availableTabs.map(tab => (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {renderTabContent()}
        </div>
      </div>
    </Layout>
  );
}

export default UnifiedUserManagement;
