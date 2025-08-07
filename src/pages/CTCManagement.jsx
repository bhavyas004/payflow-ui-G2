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
    allowances: '', // Special allowances (covers transport, medical, etc.)
    bonuses: '', // Variable pay/bonus (performance-based)
    effectiveFrom: new Date().toISOString().split('T')[0],
    isMetroCity: true // Toggle for HRA calculation (50% metro vs 40% non-metro)
  });
  
  const [calculatedComponents, setCalculatedComponents] = useState({
    hra: 0,
    pfContribution: 0,
    gratuity: 0,
    totalCTC: 0
  });
  
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    // Debounce calculation to avoid too many API calls
    const timeoutId = setTimeout(() => {
      calculateCTCPreview();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData.basicSalary, formData.allowances, formData.bonuses, formData.isMetroCity]);

  const calculateCTCPreview = async () => {
    const basicSalary = parseFloat(formData.basicSalary) || 0;
    
    if (basicSalary <= 0) {
      setCalculatedComponents({
        hra: 0,
        pfContribution: 0,
        gratuity: 0,
        totalCTC: 0
      });
      return;
    }

    try {
      setCalculating(true);
      const token = localStorage.getItem('jwtToken');
      
      const response = await axios.post('/payflowapi/payroll/ctc/preview', {
        basicSalary: basicSalary,
        allowances: parseFloat(formData.allowances) || 0,
        bonuses: parseFloat(formData.bonuses) || 0,
        isMetroCity: formData.isMetroCity
      }, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        const data = response.data.data;
        setCalculatedComponents({
          hra: data.hra,
          pfContribution: data.pfContribution,
          gratuity: data.gratuity,
          totalCTC: data.totalCTC
        });
      }
    } catch (error) {
      console.error('Error calculating CTC preview:', error);
      // Fall back to frontend calculation if backend fails
      const basicSalary = parseFloat(formData.basicSalary) || 0;
      const allowances = parseFloat(formData.allowances) || 0;
      const bonuses = parseFloat(formData.bonuses) || 0;
      
      const hra = basicSalary * (formData.isMetroCity ? 0.50 : 0.40);
      const pfContribution = basicSalary * 0.12;
      const gratuity = basicSalary * 0.0481;
      const totalCTC = basicSalary + hra + allowances + bonuses + pfContribution + gratuity;
      
      setCalculatedComponents({
        hra: Math.round(hra),
        pfContribution: Math.round(pfContribution),
        gratuity: Math.round(gratuity),
        totalCTC: Math.round(totalCTC)
      });
    } finally {
      setCalculating(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
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
        hra: calculatedComponents.hra,
        allowances: parseFloat(formData.allowances) || 0,
        bonuses: parseFloat(formData.bonuses) || 0,
        pfContribution: calculatedComponents.pfContribution,
        gratuity: calculatedComponents.gratuity,
        effectiveFrom: formData.effectiveFrom,
        totalCtc: calculatedComponents.totalCTC
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
            {/* HR Input Fields */}
            <div className="form-section">
              <h4>💼 HR Input Fields</h4>
              
              <div className="form-group">
                <label>Basic Salary (₹) *</label>
                <input
                  type="number"
                  name="basicSalary"
                  value={formData.basicSalary}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  required
                  placeholder="Enter basic salary"
                />
                <small>Base salary component (typically 40-50% of CTC)</small>
              </div>

              <div className="form-group">
                <label>Special Allowances (₹)</label>
                <input
                  type="number"
                  name="allowances"
                  value={formData.allowances}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  placeholder="Transport, medical, etc."
                />
                <small>Combined allowances (transport, medical, communication, etc.)</small>
              </div>

              <div className="form-group">
                <label>Variable Pay/Bonus (₹)</label>
                <input
                  type="number"
                  name="bonuses"
                  value={formData.bonuses}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  placeholder="Performance bonus"
                />
                <small>Annual performance-based bonus or variable pay</small>
              </div>

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    name="isMetroCity"
                    checked={formData.isMetroCity}
                    onChange={handleInputChange}
                  />
                  Metro City Employee
                </label>
                <small>Affects HRA calculation (50% metro vs 40% non-metro)</small>
              </div>

              <div className="form-group full-width">
                <label>Effective From *</label>
                <input
                  type="date"
                  name="effectiveFrom"
                  value={formData.effectiveFrom}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            {/* Auto-calculated Components */}
            <div className="form-section">
              <h4>🧮 Auto-calculated Components {calculating && <span style={{color: '#007bff', fontSize: '0.9rem'}}>⏳ Calculating...</span>}</h4>
              
              <div className="calculated-field">
                <label>HRA (House Rent Allowance)</label>
                <div className="calculated-value">₹{calculatedComponents.hra.toLocaleString()}</div>
                <small>{formData.isMetroCity ? '50%' : '40%'} of basic salary</small>
              </div>

              <div className="calculated-field">
                <label>PF Contribution (Employer)</label>
                <div className="calculated-value">₹{calculatedComponents.pfContribution.toLocaleString()}</div>
                <small>12% of basic salary</small>
              </div>

              <div className="calculated-field">
                <label>Gratuity Provision</label>
                <div className="calculated-value">₹{calculatedComponents.gratuity.toLocaleString()}</div>
                <small>4.81% of basic salary (annual provision)</small>
              </div>
              
              <div className="calculated-field total-ctc">
                <label>Total CTC</label>
                <div className="total-amount">₹{calculatedComponents.totalCTC.toLocaleString()}</div>
                <small>Sum of all components</small>
              </div>
            </div>

            {/* CTC Breakdown */}
            <div className="form-section full-width">
              <h4>📊 CTC Breakdown Summary</h4>
              <div className="ctc-breakdown">
                <div className="breakdown-item">
                  <span>Basic Salary</span>
                  <span>₹{(parseFloat(formData.basicSalary) || 0).toLocaleString()}</span>
                </div>
                <div className="breakdown-item">
                  <span>HRA ({formData.isMetroCity ? '50%' : '40%'} of basic)</span>
                  <span>₹{calculatedComponents.hra.toLocaleString()}</span>
                </div>
                <div className="breakdown-item">
                  <span>Special Allowances</span>
                  <span>₹{(parseFloat(formData.allowances) || 0).toLocaleString()}</span>
                </div>
                <div className="breakdown-item">
                  <span>Variable Pay/Bonus</span>
                  <span>₹{(parseFloat(formData.bonuses) || 0).toLocaleString()}</span>
                </div>
                <div className="breakdown-item">
                  <span>PF Contribution (12% of basic)</span>
                  <span>₹{calculatedComponents.pfContribution.toLocaleString()}</span>
                </div>
                <div className="breakdown-item">
                  <span>Gratuity Provision (4.81% of basic)</span>
                  <span>₹{calculatedComponents.gratuity.toLocaleString()}</span>
                </div>
                <div className="breakdown-item total">
                  <span><strong>Total Annual CTC</strong></span>
                  <span><strong>₹{calculatedComponents.totalCTC.toLocaleString()}</strong></span>
                </div>
                <div className="breakdown-item" style={{background: '#f8f9fa', fontStyle: 'italic'}}>
                  <span>Monthly Gross Salary (approx.)</span>
                  <span>₹{Math.round(calculatedComponents.totalCTC / 12).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={onCancel} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading || !formData.basicSalary} className="btn btn-primary">
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