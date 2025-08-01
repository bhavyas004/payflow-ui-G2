import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Topbar from '../components/Topbar';
import axios from 'axios';
import '../styles/App.css';
import '../styles/Payroll.css';

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

// HR Sidebar
function HRSidebar({ active }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">PayFlow</div>
      <nav>
        <ul>
          <li className={active === 'dashboard' ? 'active' : ''}>
            <a href="/hr-dashboard">🏠 Dashboard</a>
          </li>
          <li className={active === 'employees' ? 'active' : ''}>
            <a href="/hr-employees">👥 Employees</a>
          </li>
          <li className={active === 'onboarding' ? 'active' : ''}>
            <a href="/onboarding">📝 Onboarding</a>
          </li>
          <li className={active === 'payroll' ? 'active' : ''}>
            <a href="/hr-payroll">💰 Payroll</a>
          </li>
          <li className={active === 'ctc' ? 'active' : ''}>
            <a href="/ctc-management">📊 CTC Management</a>
          </li>
          <li className={active === 'payslips' ? 'active' : ''}>
            <a href="/payslip-view">📄 Payslips</a>
          </li>
        </ul>
      </nav>
    </aside>
  );
}

// CTC Form Component (inline to ensure correct API)
function CTCForm({ employee, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    basicSalary: '',
    hra: '',
    allowances: '',
    bonuses: '',
    pfContribution: '',
    gratuity: '',
    effectiveFrom: new Date().toISOString().split('T')[0]
  });
  const [totalCTC, setTotalCTC] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Calculate total CTC whenever form data changes
    const total = Object.keys(formData)
      .filter(key => key !== 'effectiveFrom')
      .reduce((sum, key) => sum + (parseFloat(formData[key]) || 0), 0);
    setTotalCTC(total);
  }, [formData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('jwtToken');
      const ctcData = {
        employeeId: employee.id,
        basicSalary: parseFloat(formData.basicSalary) || 0,
        hra: parseFloat(formData.hra) || 0,
        allowances: parseFloat(formData.allowances) || 0,
        bonuses: parseFloat(formData.bonuses) || 0,
        pfContribution: parseFloat(formData.pfContribution) || 0,
        gratuity: parseFloat(formData.gratuity) || 0,
        effectiveFrom: formData.effectiveFrom,
        totalCtc: totalCTC
      };

      console.log('Sending CTC data:', ctcData);

      const response = await axios.post('/payflowapi/payroll/ctc/add', ctcData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('CTC Response:', response.data);

      if (response.data && response.data.success) {
        alert('CTC saved successfully!');
        onSave();
      } else {
        alert(response.data?.message || 'Failed to save CTC');
      }
    } catch (error) {
      console.error('Error saving CTC:', error);
      console.error('Error response:', error.response?.data);
      
      let errorMessage = 'Failed to save CTC. ';
      if (error.response?.data?.message) {
        errorMessage += error.response.data.message;
      } else if (error.response?.status === 404) {
        errorMessage += 'API endpoint not found. Please check if the backend server is running.';
      } else if (error.response?.status === 401) {
        errorMessage += 'Unauthorized. Please login again.';
      } else {
        errorMessage += error.message;
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content ctc-form-modal">
        <div className="modal-header">
          <h3>Add/Update CTC for {employee.fullName}</h3>
          <button className="close-btn" onClick={onCancel}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="ctc-form">
          <div className="form-grid">
            <div className="form-group">
              <label>Basic Salary (₹)</label>
              <input
                type="number"
                name="basicSalary"
                value={formData.basicSalary}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                required
              />
            </div>

            <div className="form-group">
              <label>HRA (₹)</label>
              <input
                type="number"
                name="hra"
                value={formData.hra}
                onChange={handleInputChange}
                min="0"
                step="0.01"
              />
            </div>

            <div className="form-group">
              <label>Allowances (₹)</label>
              <input
                type="number"
                name="allowances"
                value={formData.allowances}
                onChange={handleInputChange}
                min="0"
                step="0.01"
              />
            </div>

            <div className="form-group">
              <label>Bonuses (₹)</label>
              <input
                type="number"
                name="bonuses"
                value={formData.bonuses}
                onChange={handleInputChange}
                min="0"
                step="0.01"
              />
            </div>

            <div className="form-group">
              <label>PF Contribution (₹)</label>
              <input
                type="number"
                name="pfContribution"
                value={formData.pfContribution}
                onChange={handleInputChange}
                min="0"
                step="0.01"
              />
            </div>

            <div className="form-group">
              <label>Gratuity (₹)</label>
              <input
                type="number"
                name="gratuity"
                value={formData.gratuity}
                onChange={handleInputChange}
                min="0"
                step="0.01"
              />
            </div>

            <div className="form-group full-width">
              <label>Effective From</label>
              <input
                type="date"
                name="effectiveFrom"
                value={formData.effectiveFrom}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group full-width total-ctc">
              <label>Total CTC</label>
              <div className="total-amount">₹{totalCTC.toLocaleString()}</div>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={onCancel} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Saving...' : 'Save CTC'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// CTC History Table Component (inline)
function CTCHistoryTable({ ctcHistory, onEdit }) {
  if (!ctcHistory || ctcHistory.length === 0) {
    return (
      <div className="no-data">
        <p>No CTC history found for this employee.</p>
      </div>
    );
  }

  return (
    <div className="ctc-history-table">
      <table className="data-table">
        <thead>
          <tr>
            <th>Effective From</th>
            <th>Basic Salary</th>
            <th>HRA</th>
            <th>Allowances</th>
            <th>Total CTC</th>
            <th>Created On</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {ctcHistory.map((ctc, index) => (
            <tr key={ctc.ctcId || index}>
              <td>{new Date(ctc.effectiveFrom).toLocaleDateString()}</td>
              <td>₹{Number(ctc.basicSalary || 0).toLocaleString()}</td>
              <td>₹{Number(ctc.hra || 0).toLocaleString()}</td>
              <td>₹{Number(ctc.allowances || 0).toLocaleString()}</td>
              <td className="total-ctc">₹{Number(ctc.totalCtc || 0).toLocaleString()}</td>
              <td>{new Date(ctc.createdAt).toLocaleDateString()}</td>
              <td>
                <button 
                  className="btn btn-sm btn-primary"
                  onClick={() => onEdit(ctc)}
                >
                  Edit
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function CTCManagement() {
  const [user, setUser] = useState({ name: 'HR Name' });
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [ctcHistory, setCTCHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredEmployees, setFilteredEmployees] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('jwtToken');
    if (token) {
      const payload = parseJwt(token);
      setUser({ name: payload.sub || payload.username || 'HR User' });
    }
    
    fetchEmployees();
  }, []);

  useEffect(() => {
    // Filter employees based on search term
    if (searchTerm) {
      const filtered = employees.filter(employee => 
        employee.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.id.toString().includes(searchTerm)
      );
      setFilteredEmployees(filtered);
    } else {
      setFilteredEmployees(employees);
    }
  }, [employees, searchTerm]);

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('jwtToken');
      console.log('Fetching employees...');
      
      const response = await axios.get('/payflowapi/onboard-employee/employees', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Employees response:', response.data);
      setEmployees(response.data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCTCHistory = async (employeeId) => {
    try {
      const token = localStorage.getItem('jwtToken');
      console.log('Fetching CTC history for employee:', employeeId);
      
      // FIXED: Correct API endpoint with /payroll/
      const response = await axios.get(`/payflowapi/payroll/ctc/${employeeId}/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('CTC History response:', response.data);
      
      if (response.data && response.data.success) {
        setCTCHistory(response.data.data || []);
      } else {
        setCTCHistory([]);
      }
    } catch (error) {
      console.error('Error fetching CTC history:', error);
      setCTCHistory([]);
    }
  };

  const handleEmployeeSelect = (employee) => {
    setSelectedEmployee(employee);
    fetchCTCHistory(employee.id);
  };

  const handleCTCSave = () => {
    setShowForm(false);
    if (selectedEmployee) {
      fetchCTCHistory(selectedEmployee.id);
    }
  };

  return (
    <div className="dashboard-layout">
      <HRSidebar active="ctc" />
      <div className="main-content">
        <Topbar
          title="CTC Management"
          user={user}
          onLogout={() => {
            localStorage.removeItem('jwtToken');
            navigate('/');
          }}
        />
        
        <div className="ctc-management">
          <div className="ctc-header">
            <h2>CTC Management</h2>
            <div className="header-actions">
              <button 
                className="btn btn-primary"
                onClick={() => setShowForm(true)}
                disabled={!selectedEmployee}
              >
                + Add/Update CTC
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => navigate('/hr-payroll')}
              >
                Back to Payroll
              </button>
            </div>
          </div>

          <div className="ctc-content">
            {/* Employee Selection */}
            <div className="employee-selection">
              <h3>Select Employee</h3>
              <div className="employee-search">
                <input 
                  type="text" 
                  placeholder="Search employees by name, email, or ID..."
                  className="search-input"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="employee-list">
                {loading ? (
                  <p>Loading employees...</p>
                ) : filteredEmployees.length === 0 ? (
                  <p>No employees found matching your search.</p>
                ) : (
                  filteredEmployees.map(employee => (
                    <div 
                      key={employee.id}
                      className={`employee-item ${selectedEmployee?.id === employee.id ? 'selected' : ''}`}
                      onClick={() => handleEmployeeSelect(employee)}
                    >
                      <div className="employee-info">
                        <h4>{employee.fullName}</h4>
                        <p>{employee.email}</p>
                        <p>ID: {employee.id}</p>
                        <p>Department: {employee.department || 'N/A'}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* CTC Details */}
            <div className="ctc-details">
              {selectedEmployee ? (
                <>
                  <h3>CTC Details for {selectedEmployee.fullName}</h3>
                  <CTCHistoryTable 
                    ctcHistory={ctcHistory}
                    onEdit={(ctc) => {
                      setSelectedEmployee({...selectedEmployee, currentCTC: ctc});
                      setShowForm(true);
                    }}
                  />
                </>
              ) : (
                <div className="no-selection">
                  <div className="empty-icon">👤</div>
                  <h3>Select an employee to view CTC details</h3>
                  <p>Choose an employee from the list to manage their CTC information.</p>
                </div>
              )}
            </div>
          </div>

          {/* CTC Form Modal */}
          {showForm && (
            <CTCForm
              employee={selectedEmployee}
              onSave={handleCTCSave}
              onCancel={() => setShowForm(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
}