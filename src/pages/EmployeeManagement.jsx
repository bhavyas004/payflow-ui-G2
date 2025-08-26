import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../shared/hooks/useAuth';
import Layout from '../shared/components/Layout';
import PermissionWrapper from '../shared/components/PermissionWrapper';
import axios from 'axios';
import '../shared/styles/unified.css';
import { 
  validateFullName, 
  validateEmail, 
  validatePassword, 
  validateAge,
  validateForm,
  validateAllExperiences
} from '../shared/utils/validationUtils';

/**
 * Unified Employee Management Component
 * Role-based employee interface with permission-controlled features
 */
function EmployeeManagement() {
  const { user, role, getToken, checkRole } = useAuth();
  const location = useLocation();
  
  // Helper function to check if user can access certain roles
  const canAccess = (roles) => checkRole(roles);
  
  // Handle URL parameters for tab navigation
  const getInitialTab = () => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get('tab');
    
    // Validate that the tab exists and user has permission
    if (tabParam) {
      const availableTabs = getAvailableTabsForInit();
      const tabExists = availableTabs.some(tab => tab.id === tabParam);
      if (tabExists) {
        return tabParam;
      }
    }
    
    return 'overview';
  };
  
  // Helper function to get available tabs without depending on component state
  const getAvailableTabsForInit = () => {
    const tabs = [];
    tabs.push({ id: 'overview', label: 'Overview', icon: '📊' });
    
    if (checkRole(['ADMIN', 'HR', 'MANAGER'])) {
      tabs.push({ id: 'employees', label: 'Employee List', icon: '👥' });
    }
    
    if (checkRole(['ADMIN', 'HR', 'MANAGER'])) {
      tabs.push({ id: 'create', label: 'Add Employee', icon: '➕' });
    }
    
    return tabs;
  };
  
  const [activeTab, setActiveTab] = useState(getInitialTab());
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);
  
  // Form states for employee creation
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    age: '',
    password: '',
    manager: '',
    experiences: [{ companyName: '', startDate: '', endDate: '' }],
    status: 'ACTIVE'
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  
  // Manager-related states
  const [managers, setManagers] = useState([]);
  const [loadingManagers, setLoadingManagers] = useState(false);

  // Validation function
  const validateFormData = () => {
    const validationRules = {
      fullName: validateFullName,
      email: validateEmail,
      age: validateAge,
      password: validatePassword
    };
    
    const { errors, isValid } = validateForm(formData, validationRules);
    
    // Validate experiences
    const experienceErrors = validateAllExperiences(formData.experiences);
    if (experienceErrors.length > 0) {
      errors.experiences = experienceErrors;
    }
    
    setValidationErrors(errors);
    return isValid && experienceErrors.length === 0;
  };

  useEffect(() => {
    fetchEmployees();
    fetchManagers();
  }, [role]);

  useEffect(() => {
    applyFilters();
  }, [employees, searchTerm, statusFilter]);

  // Fetch managers for assignment dropdown
  const fetchManagers = async () => {
    try {
      setLoadingManagers(true);
      const token = getToken();
      const headers = { Authorization: `Bearer ${token}` };
      
      const response = await axios.get('http://localhost:8080/payflowapi/managers/available', { headers });
      
      console.log('Manager API Response:', response.data);
      
      if (response.data.success) {
        const managersData = response.data.data || [];
        console.log('Managers data:', managersData);
        setManagers(managersData);
      } else {
        console.warn('Failed to fetch managers:', response.data.message);
        setManagers([]);
      }
    } catch (error) {
      console.error('Error fetching managers:', error);
      console.error('Error response:', error.response?.data);
      setManagers([]);
    } finally {
      setLoadingManagers(false);
    }
  };

  // Helper function to get employee count for a manager (using API data)
  const getManagerEmployeeCount = (manager) => {
    // Use the employeeCount from the API response if available, otherwise calculate from local data
    if (manager.employeeCount !== undefined) {
      console.log(`Manager ${manager.username} has ${manager.employeeCount} employees (from API)`);
      return manager.employeeCount;
    }
    
    // Fallback to local calculation if API data is not available
    const count = employees.filter(emp => emp.manager === manager.username).length;
    console.log(`Manager ${manager.username} has ${count} employees (calculated locally)`);
    return count;
  };

  // Handle experience fields
  const handleExperienceChange = (idx, e) => {
    const { name, value } = e.target;
    const updatedExperiences = formData.experiences.map((exp, i) =>
      i === idx ? { ...exp, [name]: value } : exp
    );
    
    setFormData(prev => ({
      ...prev,
      experiences: updatedExperiences,
    }));
    
    // Validate experiences when date fields change
    if (name === 'startDate' || name === 'endDate') {
      const experienceErrors = validateAllExperiences(updatedExperiences);
      setValidationErrors(prev => ({
        ...prev,
        experiences: experienceErrors.length > 0 ? experienceErrors : undefined
      }));
    }
  };

  // Add new experience row
  const addExperience = () => {
    setFormData(prev => ({
      ...prev,
      experiences: [...prev.experiences, { companyName: '', startDate: '', endDate: '' }]
    }));
  };

  // Remove experience row
  const removeExperience = idx => {
    if (formData.experiences.length > 1) {
      const updatedExperiences = formData.experiences.filter((_, i) => i !== idx);
      setFormData(prev => ({
        ...prev,
        experiences: updatedExperiences
      }));
      
      // Re-validate experiences after removal
      const experienceErrors = validateAllExperiences(updatedExperiences);
      setValidationErrors(prev => ({
        ...prev,
        experiences: experienceErrors.length > 0 ? experienceErrors : undefined
      }));
    }
  };

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const headers = { Authorization: `Bearer ${token}` };
      
      let endpoint = 'http://localhost:8080/payflowapi/onboard-employee/employees';
      
      // Manager might have different endpoint for team members only
      if (role === 'MANAGER') {
        // TODO: Implement manager-specific endpoint
        // endpoint = 'http://localhost:8080/payflowapi/onboard-employee/team-employees';
      }
      
      const response = await axios.get(endpoint, { headers });
      setEmployees(response.data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...employees];
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(emp =>
        emp.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.id?.toString().includes(searchTerm)
      );
    }
    
    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter(emp => emp.status === statusFilter);
    }
    
    setFilteredEmployees(filtered);
    setCurrentPage(1);
  };

  // Handle employee status update
  const handleStatusUpdate = async (employee, newStatus) => {
    try {
      const token = getToken();
      const headers = { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      await axios.put(
        `http://localhost:8080/payflowapi/onboard-employee/${encodeURIComponent(employee.fullName)}/status`,
        { status: newStatus },
        { headers }
      );
      
      setEmployees(prev => 
        prev.map(emp => 
          emp.fullName === employee.fullName 
            ? { ...emp, status: newStatus }
            : emp
        )
      );
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update employee status');
    }
  };

  // Handle employee creation
  const handleCreateEmployee = async (e) => {
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
        'http://localhost:8080/payflowapi/onboard-employee/add',
        formData,
        { headers }
      );
      
      setFormSuccess('Employee created successfully!');
      setFormData({
        fullName: '',
        email: '',
        age: '',
        password: '',
        manager: '',
        experiences: [{ companyName: '', startDate: '', endDate: '' }],
        status: 'ACTIVE'
      });
      setValidationErrors({});
      setShowCreateModal(false);
      fetchEmployees(); // Refresh the list
    } catch (error) {
      setFormError(
        error.response?.data?.error || 
        error.response?.data?.message || 
        'Failed to create employee'
      );
    } finally {
      setFormLoading(false);
    }
  };

  // Get available tabs based on user permissions
  const getAvailableTabs = () => {
    const tabs = [];
    
    // Overview tab - available to all roles that can access this component
    tabs.push({ id: 'overview', label: 'Overview', icon: '📊' });
    
    // Employee list - Admin, HR, Manager
    if (canAccess(['ADMIN', 'HR', 'MANAGER'], ['VIEW_ALL_EMPLOYEES', 'VIEW_TEAM_EMPLOYEES'])) {
      tabs.push({ id: 'employees', label: 'Employee List', icon: '👥' });
    }
    
    // Employee creation - Admin, HR, Manager
    if (canAccess(['ADMIN', 'HR', 'MANAGER'], ['CREATE_EMPLOYEES'])) {
      tabs.push({ id: 'create', label: 'Add Employee', icon: '➕' });
    }
    
    return tabs;
  };

  // Render overview
  const renderOverview = () => {
    const stats = {
      totalEmployees: employees.length,
      activeEmployees: employees.filter(emp => emp.status === 'ACTIVE').length,
      inactiveEmployees: employees.filter(emp => emp.status === 'INACTIVE').length,
      newThisMonth: employees.filter(emp => {
        const createdDate = new Date(emp.createdAt || Date.now());
        const now = new Date();
        return createdDate.getMonth() === now.getMonth() && 
               createdDate.getFullYear() === now.getFullYear();
      }).length
    };

    return (
      <div className="employee-overview">
        <div className="overview-header">
          <h3>Employee Overview</h3>
          <p>Workforce statistics and management</p>
        </div>
        
        <div className="overview-stats">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <h4>{stats.totalEmployees}</h4>
              <p>Total Employees</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <h4>{stats.activeEmployees}</h4>
              <p>Active Employees</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">⏸️</div>
            <div className="stat-content">
              <h4>{stats.inactiveEmployees}</h4>
              <p>Inactive Employees</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">🆕</div>
            <div className="stat-content">
              <h4>{stats.newThisMonth}</h4>
              <p>New This Month</p>
            </div>
          </div>
        </div>
        
        <PermissionWrapper requiredPermissions={['CREATE_EMPLOYEES']}>
          <div className="quick-actions">
            <h4>Quick Actions</h4>
            <div className="action-buttons">
              <button 
                className="btn btn-primary"
                onClick={() => setActiveTab('create')}
              >
                ➕ Add New Employee
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => setActiveTab('employees')}
              >
                👥 View All Employees
              </button>
              <button 
                className="btn btn-ghost"
                onClick={fetchEmployees}
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

  // Render employee list
  const renderEmployeeList = () => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const currentEmployees = filteredEmployees.slice(startIndex, endIndex);
    const totalPages = Math.ceil(filteredEmployees.length / rowsPerPage);

    return (
      <div className="employee-list">
        <div className="list-header">
          <h3>Employee List</h3>
          <p>Manage and view employee information</p>
        </div>
        
        {/* Filters */}
        <div className="filters-section" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div className="search-bar" style={{ flex: 1 }}>
            <input
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-control"
            />
          </div>
          
          <div className="filter-controls" style={{ flex: 1 }}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-control"
            >
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </div>
        
        {/* Employee Table */}
        {loading ? (
          <div className="loading-state">Loading employees...</div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Age</th>
                  <th>Status</th>
                  <PermissionWrapper requiredPermissions={['UPDATE_EMPLOYEES']}>
                    <th>Actions</th>
                  </PermissionWrapper>
                </tr>
              </thead>
              <tbody>
                {currentEmployees.map(employee => (
                  <tr key={employee.id}>
                    <td>{employee.id}</td>
                    <td>{employee.fullName}</td>
                    <td>{employee.email}</td>
                    <td>{employee.age}</td>
                    <td>
                      <span className={`status-badge ${employee.status.toLowerCase()}`}>
                        {employee.status}
                      </span>
                    </td>
                    <PermissionWrapper requiredPermissions={['UPDATE_EMPLOYEES']}>
                      <td>
                        <div className="action-buttons">
                          <button
                            className={`btn btn-sm ${employee.status === 'ACTIVE' ? 'btn-warning' : 'btn-success'}`}
                            onClick={() => handleStatusUpdate(
                              employee,
                              employee.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
                            )}
                          >
                            {employee.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                          </button>
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

  // Render employee creation form
  const renderCreateEmployee = () => {
    return (
      <div className="create-employee">
        <div className="create-header">
          <h3>Add New Employee</h3>
          <p>Create a new employee account</p>
        </div>
        
        <form onSubmit={handleCreateEmployee} className="employee-form">
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
          
          {/* Row 1: Full Name and Email */}
          <div className="form-row" style={{ display: 'flex', gap: '1rem' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="fullName">Full Name *</label>
              <input
                type="text"
                id="fullName"
                value={formData.fullName}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData({ ...formData, fullName: value });
                  setValidationErrors({ ...validationErrors, fullName: validateFullName(value) });
                }}
                required
                className={`form-control ${validationErrors.fullName ? 'is-invalid' : ''}`}
                placeholder="Enter full name"
              />
              {validationErrors.fullName && (
                <small className="form-error" style={{ color: '#dc3545', fontSize: '0.875rem' }}>
                  {validationErrors.fullName}
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
          
          {/* Row 2: Age and Manager */}
          <div className="form-row" style={{ display: 'flex', gap: '1rem' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="age">Age *</label>
              <input
                type="number"
                id="age"
                value={formData.age}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData({ ...formData, age: value });
                  setValidationErrors({ ...validationErrors, age: validateAge(value) });
                }}
                required
                min="18"
                max="65"
                className={`form-control ${validationErrors.age ? 'is-invalid' : ''}`}
                placeholder="Enter age (18-65)"
              />
              {validationErrors.age && (
                <small className="form-error" style={{ color: '#dc3545', fontSize: '0.875rem' }}>
                  {validationErrors.age}
                </small>
              )}
            </div>
            
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="manager">Assign Manager</label>
              {loadingManagers ? (
                <div style={{ padding: '0.75rem', color: '#6b7280', fontStyle: 'italic', background: '#f9fafb', borderRadius: '4px', border: '1px solid #e5e7eb' }}>
                  Loading managers...
                </div>
              ) : (
                <select
                  id="manager"
                  value={formData.manager}
                  onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                  className="form-control"
                >
                  <option value="">Select Manager (Optional)</option>
                  {managers.length === 0 ? (
                    <option disabled>No managers available</option>
                  ) : (
                    managers.map((manager) => (
                      <option key={manager.username} value={manager.username}>
                        {manager.fullName || manager.username} ({manager.role}) - {getManagerEmployeeCount(manager)} employees
                      </option>
                    ))
                  )}
                </select>
              )}
            </div>
          </div>
          
          {/* Row 3: Password and Status */}
          <div className="form-row" style={{ display: 'flex', gap: '1rem' }}>
            <div className="form-group" style={{ flex: 1 }}>
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
            </div>
            
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="status">Status *</label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="form-control"
                required
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>
          
          {/* Experience Section */}
          <div className="form-group">
            <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.5rem', color: '#374151' }}>
              Experience *
            </label>
            <div style={{
              maxHeight: '250px',
              overflowY: 'auto',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '1rem',
              background: '#f9fafb'
            }}>
              {formData.experiences.map((exp, idx) => (
                <div key={idx} style={{
                  marginBottom: '1rem', 
                  padding: '0.75rem',
                  background: '#fff',
                  borderRadius: '6px',
                  border: '1px solid #e5e7eb'
                }}>
                  <input
                    type="text"
                    name="companyName"
                    placeholder="Company Name"
                    value={exp.companyName}
                    onChange={e => handleExperienceChange(idx, e)}
                    required
                    style={{
                      width: '100%', 
                      padding: '0.5rem', 
                      borderRadius: '4px', 
                      border: '1px solid #d1d5db', 
                      marginBottom: '0.5rem',
                      fontSize: '0.9rem'
                    }}
                  />
                  <div style={{display: 'flex', gap: '0.5rem', marginBottom: '0.5rem'}}>
                    <div style={{flex: 1}}>
                      <label style={{fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem', display: 'block'}}>
                        Start Date
                      </label>
                      <input
                        type="date"
                        name="startDate"
                        value={exp.startDate}
                        onChange={e => handleExperienceChange(idx, e)}
                        required
                        style={{
                          width: '100%', 
                          padding: '0.4rem', 
                          borderRadius: '4px', 
                          border: '1px solid #d1d5db',
                          fontSize: '0.85rem'
                        }}
                      />
                    </div>
                    <div style={{flex: 1}}>
                      <label style={{fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem', display: 'block'}}>
                        End Date
                      </label>
                      <input
                        type="date"
                        name="endDate"
                        value={exp.endDate}
                        onChange={e => handleExperienceChange(idx, e)}
                        required
                        style={{
                          width: '100%', 
                          padding: '0.4rem', 
                          borderRadius: '4px', 
                          border: '1px solid #d1d5db',
                          fontSize: '0.85rem'
                        }}
                      />
                    </div>
                  </div>
                  {formData.experiences.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeExperience(idx)}
                      style={{
                        background: '#dc2626',
                        color: 'white',
                        border: 'none',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        cursor: 'pointer'
                      }}
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addExperience}
                style={{
                  background: '#059669',
                  color: 'white',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  marginTop: '0.5rem'
                }}
              >
                + Add Experience
              </button>
            </div>
          </div>
          
          {/* Experience Validation Errors */}
          {validationErrors.experiences && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #f87171',
              borderRadius: '6px',
              padding: '0.75rem',
              marginTop: '0.5rem'
            }}>
              {validationErrors.experiences.map((error, index) => (
                <div key={index} style={{
                  color: '#dc2626',
                  fontSize: '0.875rem',
                  marginBottom: index < validationErrors.experiences.length - 1 ? '0.25rem' : '0'
                }}>
                  • {error}
                </div>
              ))}
            </div>
          )}
          
          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={formLoading}
            >
              {formLoading ? '⏳ Creating...' : '✅ Create Employee'}
            </button>
            
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setFormData({
                  fullName: '',
                  email: '',
                  age: '',
                  password: '',
                  manager: '',
                  experiences: [{ companyName: '', startDate: '', endDate: '' }],
                  status: 'ACTIVE'
                });
                setValidationErrors({});
                setFormError('');
                setFormSuccess('');
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
      case 'employees':
        return renderEmployeeList();
      case 'create':
        return renderCreateEmployee();
      default:
        return renderOverview();
    }
  };

  const availableTabs = getAvailableTabs();

  return (
    <Layout
      title="Employee Management"
      subtitle="Comprehensive employee operations"
      sidebarActive="employees"
      requiredRoles={['ADMIN', 'HR', 'MANAGER']}
    >
      <div className="payflow-employee-management">
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

export default EmployeeManagement;
