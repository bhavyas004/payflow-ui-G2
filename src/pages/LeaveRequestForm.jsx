import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/App.css';

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

// Employee Sidebar
function EmployeeSidebar({ active }) {
  const navigate = useNavigate();
  
  const handleLogout = () => {
    localStorage.removeItem('jwtToken');
    navigate('/employee-login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">PayFlow</div>
      <nav>
        <ul>
          <li className={active === 'dashboard' ? 'active' : ''}><a href="/employee-dashboard">🏠 Dashboard</a></li>
          <li className={active === 'leave-request' ? 'active' : ''}><a href="/employee-leave-request">📝 Leave Request</a></li>
          <li className={active === 'payroll' ? 'active' : ''}><a href="/employee-payroll">💰 Payroll</a></li>
          <li><button className="logout-btn" onClick={handleLogout}>🚪 Logout</button></li>
        </ul>
      </nav>
    </aside>
  );
}

export default function LeaveRequestForm() {
  const [user, setUser] = useState({ name: 'Employee', employeeId: null, email: '' });
  const [leaveBalance, setLeaveBalance] = useState({ remaining: 12, used: 0, total: 12 });
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    reason: ''
  });
  const [totalDays, setTotalDays] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [employeeDetails, setEmployeeDetails] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Extract user info from JWT token
    const token = localStorage.getItem('jwtToken');
    if (token) {
      const payload = parseJwt(token);
      setUser({ 
        name: payload.fullName || payload.sub || payload.username || 'Employee',
        employeeId: payload.employeeId,
        email: payload.sub || payload.email || ''
      });
      
      // Fetch employee details and leave balance
      fetchEmployeeDetails(payload.employeeId, token);
    } else {
      navigate('/employee-login');
    }
  }, [navigate]);

  // Calculate total days when dates change
  useEffect(() => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const diffTime = end - start;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Include both start and end dates
      setTotalDays(diffDays > 0 ? diffDays : 0);
    } else {
      setTotalDays(0);
    }
  }, [formData.startDate, formData.endDate]);

  const fetchEmployeeDetails = async (employeeId, token) => {
    try {
      // Fetch employee details
      const empRes = await axios.get(`/payflowapi/onboard-employee/employees`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const employee = empRes.data.find(emp => emp.id === employeeId);
      if (employee) {
        setEmployeeDetails(employee);
        setUser(prev => ({ ...prev, email: employee.email }));
      }
      
      // Mock leave balance - you can replace with actual API call
      // For now using static data since leave balance endpoint doesn't exist yet
      setLeaveBalance({ remaining: 10, used: 2, total: 12 });
      
    } catch (error) {
      console.error('Error fetching employee details:', error);
      setError('Failed to fetch employee details');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
    setSuccess('');
  };

  const validateForm = () => {
    if (!formData.startDate) {
      setError('Please select start date');
      return false;
    }
    if (!formData.endDate) {
      setError('Please select end date');
      return false;
    }
    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      setError('End date cannot be before start date');
      return false;
    }
    if (!formData.reason.trim()) {
      setError('Please provide a reason for leave');
      return false;
    }
    if (totalDays > leaveBalance.remaining) {
      setError(`Insufficient leave balance. You have ${leaveBalance.remaining} days remaining.`);
      return false;
    }
    if (totalDays <= 0) {
      setError('Invalid date range');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('jwtToken');
      const leaveRequest = {
        employeeId: user.employeeId,
        employeeName: user.name,
        employeeEmail: user.email,
        startDate: formData.startDate,
        endDate: formData.endDate,
        totalDays: totalDays,
        reason: formData.reason,
        leaveYear: new Date().getFullYear()
      };

      // Submit leave request (replace with actual endpoint)
      await axios.post('/payflowapi/leave-requests/apply', leaveRequest, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess('Leave request submitted successfully!');
      setFormData({ startDate: '', endDate: '', reason: '' });
      setTotalDays(0);
      
      // Refresh leave balance
      setLeaveBalance(prev => ({
        ...prev,
        remaining: prev.remaining - totalDays,
        used: prev.used + totalDays
      }));

    } catch (error) {
      console.error('Error submitting leave request:', error);
      setError(error.response?.data?.message || 'Failed to submit leave request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-layout">
      <EmployeeSidebar active="leave-request" />
      <div className="main-content">
        <div className="leave-request-container" style={{ padding: '2rem' }}>
          <div className="leave-header">
            <h2>Leave Request Form</h2>
            <div className="leave-balance-info">
              <div className="balance-card">
                <h4>Leave Balance</h4>
                <div className="balance-details">
                  <span>Total: {leaveBalance.total}</span>
                  <span>Used: {leaveBalance.used}</span>
                  <span>Remaining: <strong>{leaveBalance.remaining}</strong></span>
                </div>
              </div>
            </div>
          </div>

          {employeeDetails && (
            <div className="employee-info-card">
              <h4>Employee Information</h4>
              <div className="employee-details">
                <p><strong>Name:</strong> {employeeDetails.fullName}</p>
                <p><strong>Email:</strong> {employeeDetails.email}</p>
                <p><strong>Employee ID:</strong> {user.employeeId}</p>
                <p><strong>Status:</strong> 
                  <span className={`status-badge ${employeeDetails.status?.toLowerCase()}`}>
                    {employeeDetails.status}
                  </span>
                </p>
              </div>
            </div>
          )}

          <form className="leave-request-form" onSubmit={handleSubmit}>
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="startDate">Start Date *</label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  min={new Date().toISOString().split('T')[0]}
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="endDate">End Date *</label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  min={formData.startDate || new Date().toISOString().split('T')[0]}
                  required
                  className="form-input"
                />
              </div>
            </div>

            {totalDays > 0 && (
              <div className="days-info">
                <p>Total Days: <strong>{totalDays}</strong></p>
                <p>Remaining Balance After: <strong>{leaveBalance.remaining - totalDays}</strong></p>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="reason">Reason for Leave *</label>
              <textarea
                id="reason"
                name="reason"
                value={formData.reason}
                onChange={handleInputChange}
                placeholder="Please provide the reason for your leave request"
                required
                className="form-textarea"
                rows="4"
              />
            </div>

            <div className="form-actions">
              <button 
                type="button" 
                className="btn-secondary"
                onClick={() => navigate('/employee-dashboard')}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn-primary"
                disabled={loading || totalDays > leaveBalance.remaining}
              >
                {loading ? 'Submitting...' : 'Submit Leave Request'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}