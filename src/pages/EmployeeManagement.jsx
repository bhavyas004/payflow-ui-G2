import React, { useState } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import { useNavigate, useLocation } from 'react-router-dom';

const initialEmployees = [
  { name: 'John Doe', department: 'Engineering', email: 'john@company.com', status: 'Active', dateJoined: '2025-07-01' },
  { name: 'Jane Smith', department: 'HR', email: 'jane@company.com', status: 'Inactive', dateJoined: '2025-06-15' },
  { name: 'Alice Brown', department: 'Finance', email: 'alice@company.com', status: 'Active', dateJoined: '2025-05-20' },
  { name: 'Bob Lee', department: 'Engineering', email: 'bob@company.com', status: 'Active', dateJoined: '2025-04-10' },
];

// Helper to decode JWT
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

// Custom Sidebar for Employee Management
function EmployeeSidebar({ active, role, onBack, fromDashboard }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">PayFlow</div>
      <nav>
        <ul>
          {/* <li className={active === 'dashboard' ? 'active' : ''}><a href="/dashboard">🏠 Dashboard</a></li> */}
          <li className={active === 'employees' ? 'active' : ''}><a href="/employees">👥 Employees</a></li>
          {/* Only show onboarding for HR */}
          {role === 'HR' && (
            <li className={active === 'onboarding' ? 'active' : ''}><a href="/onboarding">📝 Onboarding</a></li>
          )}
        </ul>
      </nav>
      <button
        className="back-btn"
        style={{ margin: '2rem 1rem 0 1rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', padding: '0.6rem 1.5rem', fontWeight: 600, fontSize: '1rem', cursor: 'pointer', width: 'calc(100% - 2rem)' }}
        onClick={onBack}
      >
        {fromDashboard === 'admin'
          ? '← Back to Admin Dashboard'
          : fromDashboard === 'hr'
          ? '← Back to HR Dashboard'
          : '← Back'}
      </button>
    </aside>
  );
}

export default function EmployeeManagement() {
  const token = sessionStorage.getItem('jwtToken');
  const payload = parseJwt(token);
  const userRole = (payload.role || 'HR').toUpperCase();
  const userName = payload.username || 'User';
  const [user] = useState({ name: userName, role: userRole });
  const navigate = useNavigate();
  const location = useLocation();
  const fromDashboard = location.state?.from;

  const [employees, setEmployees] = useState(initialEmployees);
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
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

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;

  const filtered = employees.filter(emp =>
    (emp.name.toLowerCase().includes(search.toLowerCase()) ||
      emp.email.toLowerCase().includes(search.toLowerCase())) &&
    (departmentFilter ? emp.department === departmentFilter : true) &&
    (statusFilter ? emp.status === statusFilter : true)
  );

  // Pagination logic
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filtered.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(filtered.length / rowsPerPage);

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  // Reset to first page if filter/search changes and current page is out of range
  React.useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1);
  }, [filtered.length, totalPages, currentPage]);

  const toggleStatus = (index) => {
    setEmployees(emps =>
      emps.map((e, i) =>
        i === index ? { ...e, status: e.status === 'Active' ? 'Inactive' : 'Active' } : e
      )
    );
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

  const handleBack = () => {
    if (fromDashboard === 'admin') {
      navigate('/admin-dashboard');
    } else if (fromDashboard === 'hr') {
      navigate('/hr-dashboard');
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="dashboard-layout">
      <EmployeeSidebar active="employees" role={user.role} onBack={handleBack} fromDashboard={fromDashboard} />
      <div className="main-content">
        <Topbar title="Employee Management" user={user} />
        <div className="employee-management-container">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
            <h2 className="text-xl font-bold mb-2">Employee List</h2>
            {/* Only HR can create users */}
            {user.role === 'HR' && (
              <button className="create-user-btn" onClick={() => setShowCreateModal(true)}>
                🔐 Create New User (HR/Manager)
              </button>
            )}
          </div>
          <div className="employee-filter-bar">
            <input
              type="text"
              placeholder="Search by name or email"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select
              value={departmentFilter}
              onChange={e => setDepartmentFilter(e.target.value)}
            >
              <option value="">All Departments</option>
              <option value="Engineering">Engineering</option>
              <option value="HR">HR</option>
              <option value="Finance">Finance</option>
            </select>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
            <div className="text-sm text-gray-500">
              Showing {filtered.length} of {employees.length} employees
            </div>
          </div>
          <div className="overflow-x-auto employee-table-container">
            <table className="w-full border-collapse border employee-table">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border p-2">Name</th>
                  <th className="border p-2">Department</th>
                  <th className="border p-2">Email</th>
                  <th className="border p-2">Status</th>
                  <th className="border p-2">Date Joined</th>
                  <th className="border p-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {currentRows.map((emp, index) => (
                  <tr key={index} className="text-center hover:bg-blue-50 transition">
                    <td className="border p-2">{emp.name}</td>
                    <td className="border p-2">{emp.department}</td>
                    <td className="border p-2">{emp.email}</td>
                    <td className="border p-2">
                      <span className={`px-2 py-1 rounded-full text-white ${emp.status === 'Active' ? 'bg-green-500' : 'bg-red-500'}`}>{emp.status}</span>
                    </td>
                    <td className="border p-2">{emp.dateJoined}</td>
                    <td className="border p-2">
                      <button
                        onClick={() => toggleStatus(index + indexOfFirstRow)}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {emp.status === 'Active' ? '🔒 Deactivate' : '🔓 Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
                {currentRows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-4 text-gray-400">No employees found.</td>
                  </tr>
                )}
              </tbody>
            </table>
            {/* Pagination Controls */}
            <div className="pagination-controls" style={{marginTop: '1rem', display: 'flex', justifyContent: 'center', gap: '0.5rem'}}>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                style={{padding: '0.3rem 0.8rem', borderRadius: '4px', border: '1px solid #ccc', background: currentPage === 1 ? '#eee' : '#fff'}}
              >
                Prev
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => handlePageChange(i + 1)}
                  style={{
                    padding: '0.3rem 0.8rem',
                    borderRadius: '4px',
                    border: '1px solid #2563eb',
                    background: currentPage === i + 1 ? '#2563eb' : '#fff',
                    color: currentPage === i + 1 ? '#fff' : '#2563eb',
                    fontWeight: currentPage === i + 1 ? 700 : 400
                  }}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                style={{padding: '0.3rem 0.8rem', borderRadius: '4px', border: '1px solid #ccc', background: currentPage === totalPages ? '#eee' : '#fff'}}
              >
                Next
              </button>
            </div>
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
    </div>
  );
}