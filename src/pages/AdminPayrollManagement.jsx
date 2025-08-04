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

// Payroll Statistics Component
function PayrollStats() {
  const [stats, setStats] = useState({
    totalPayslips: 0,
    totalEmployees: 0,
    totalPayrollAmount: 0,
    currentMonth: new Date().toLocaleString('default', { month: 'long', year: 'numeric' })
  });

  useEffect(() => {
    fetchPayrollStats();
  }, []);

  const fetchPayrollStats = async () => {
    try {
      const token = localStorage.getItem('jwtToken');
      const [payslipsRes, employeesRes] = await Promise.all([
        axios.get('/payflowapi/payroll/payslips', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('/payflowapi/onboard-employee/employees', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const payslips = payslipsRes.data.data || [];
      const employees = employeesRes.data || [];
      const totalAmount = payslips.reduce((sum, payslip) => sum + Number(payslip.netPay), 0);

      setStats({
        totalPayslips: payslips.length,
        totalEmployees: employees.length,
        totalPayrollAmount: totalAmount,
        currentMonth: new Date().toLocaleString('default', { month: 'long', year: 'numeric' })
      });
    } catch (error) {
      console.error('Error fetching payroll stats:', error);
    }
  };

  return (
    <div className="payroll-stats-grid">
      <div className="stat-card">
        <h3>Total Payslips</h3>
        <p className="stat-value">{stats.totalPayslips}</p>
      </div>
      <div className="stat-card">
        <h3>Total Employees</h3>
        <p className="stat-value">{stats.totalEmployees}</p>
      </div>
      <div className="stat-card">
        <h3>Total Payroll Amount</h3>
        <p className="stat-value">₹{stats.totalPayrollAmount.toLocaleString()}</p>
      </div>
      <div className="stat-card">
        <h3>Current Period</h3>
        <p className="stat-value">{stats.currentMonth}</p>
      </div>
    </div>
  );
}

// Replace the EmployeeCTCManagement component entirely

function EmployeeCTCManagement() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showCTCModal, setShowCTCModal] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [ctcData, setCTCData] = useState({
    basicSalary: '',
    hra: '',
    allowances: '',
    bonus: '',
    pfContribution: '',
    tax: ''
  });
  const [ctcRecords, setCTCRecords] = useState({});

  useEffect(() => {
    fetchEmployees();
    fetchCTCRecords();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('jwtToken');
      const response = await axios.get('http://localhost:8080/payflowapi/onboard-employee/employees', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmployees(response.data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      alert('Failed to fetch employees. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCTCRecords = async () => {
    try {
      const token = localStorage.getItem('jwtToken');
      // Try to fetch existing CTC records
      const response = await axios.get('http://localhost:8080/payflowapi/admin/ctc-records', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const records = {};
      (response.data || []).forEach(record => {
        records[record.employeeId] = record;
      });
      setCTCRecords(records);
    } catch (error) {
      console.error('CTC records not available:', error);
      // This is okay, we'll create new records
    }
  };

  const handleCTCUpdate = (employee) => {
    setSelectedEmployee(employee);
    
    // Check if CTC record exists
    const existingCTC = ctcRecords[employee.id];
    
    if (existingCTC) {
      setCTCData({
        basicSalary: existingCTC.basicSalary?.toString() || '',
        hra: existingCTC.hra?.toString() || '',
        allowances: existingCTC.allowances?.toString() || '',
        bonus: existingCTC.bonus?.toString() || '',
        pfContribution: existingCTC.pfContribution?.toString() || '',
        tax: existingCTC.tax?.toString() || ''
      });
    } else {
      // Set default values for new CTC
      const defaultCTC = 500000;
      setCTCData({
        basicSalary: Math.round(defaultCTC * 0.6).toString(),
        hra: Math.round(defaultCTC * 0.2).toString(),
        allowances: Math.round(defaultCTC * 0.1).toString(),
        bonus: Math.round(defaultCTC * 0.1).toString(),
        pfContribution: Math.round(defaultCTC * 0.12).toString(),
        tax: Math.round(defaultCTC * 0.1).toString()
      });
    }
    setShowCTCModal(true);
  };

  const saveCTCToLocalStorage = (employeeId, ctcInfo) => {
    const existingCTC = JSON.parse(localStorage.getItem('employeeCTCRecords') || '{}');
    existingCTC[employeeId] = {
      ...ctcInfo,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem('employeeCTCRecords', JSON.stringify(existingCTC));
    
    // Update local state
    setCTCRecords(prev => ({
      ...prev,
      [employeeId]: ctcInfo
    }));
  };

  const handleCTCSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    
    try {
      const token = localStorage.getItem('jwtToken');
      const totalCTC = Object.values(ctcData).reduce((sum, val) => sum + Number(val || 0), 0);
      const netPay = totalCTC - Number(ctcData.pfContribution || 0) - Number(ctcData.tax || 0);
      
      const ctcPayload = {
        employeeId: selectedEmployee.id,
        employeeName: selectedEmployee.fullName,
        basicSalary: Number(ctcData.basicSalary || 0),
        hra: Number(ctcData.hra || 0),
        allowances: Number(ctcData.allowances || 0),
        bonus: Number(ctcData.bonus || 0),
        pfContribution: Number(ctcData.pfContribution || 0),
        tax: Number(ctcData.tax || 0),
        totalCTC: totalCTC,
        netPay: netPay
      };

      // Try to save to backend first
      try {
        await axios.post('http://localhost:8080/payflowapi/admin/ctc-records', ctcPayload, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        alert(`CTC updated successfully for ${selectedEmployee.fullName}!\nTotal CTC: ₹${totalCTC.toLocaleString()}\nNet Pay: ₹${netPay.toLocaleString()}`);
      } catch (apiError) {
        console.log('Backend save failed, saving to localStorage:', apiError);
        
        // If backend fails, save to localStorage
        saveCTCToLocalStorage(selectedEmployee.id, ctcPayload);
        alert(`CTC saved locally for ${selectedEmployee.fullName}!\nTotal CTC: ₹${totalCTC.toLocaleString()}\nNet Pay: ₹${netPay.toLocaleString()}\n\nNote: Saved locally as backend is not available.`);
      }
      
      setShowCTCModal(false);
      
    } catch (error) {
      console.error('Error updating CTC:', error);
      alert('Failed to update CTC. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  // Load CTC records from localStorage on component mount
  useEffect(() => {
    const localCTCRecords = JSON.parse(localStorage.getItem('employeeCTCRecords') || '{}');
    setCTCRecords(prev => ({ ...prev, ...localCTCRecords }));
  }, []);

  const handleInputChange = (field, value) => {
    setCTCData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getCurrentCTC = (employeeId) => {
    const ctcRecord = ctcRecords[employeeId];
    return ctcRecord ? ctcRecord.totalCTC : 0;
  };

  const getNetPay = (employeeId) => {
    const ctcRecord = ctcRecords[employeeId];
    if (!ctcRecord) return 0;
    return ctcRecord.totalCTC - ctcRecord.pfContribution - ctcRecord.tax;
  };

  return (
    <div className="ctc-management">
      <div className="ctc-header">
        <h3>Employee CTC Management ({employees.length} employees)</h3>
        <div className="header-actions">
          <button 
            className="btn btn-secondary btn-sm"
            onClick={fetchEmployees}
            disabled={loading}
          >
            {loading ? 'Loading...' : '🔄 Refresh'}
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => {
              const ctcData = localStorage.getItem('employeeCTCRecords');
              if (ctcData) {
                const blob = new Blob([ctcData], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'employee-ctc-records.json';
                a.click();
                URL.revokeObjectURL(url);
              } else {
                alert('No CTC records to export');
              }
            }}
          >
            📥 Export CTC Data
          </button>
        </div>
      </div>
      
      <div className="table-container">
        <table className="onboard-table">
          <thead>
            <tr>
              <th>Employee ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Status</th>
              <th>Experience</th>
              <th>Current CTC</th>
              <th>Net Pay</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{textAlign: 'center', padding: '2rem'}}>Loading employees...</td>
              </tr>
            ) : employees.length === 0 ? (
              <tr>
                <td colSpan={8} style={{textAlign: 'center', padding: '2rem'}}>No employees found.</td>
              </tr>
            ) : (
              employees.map((employee) => {
                const currentCTC = getCurrentCTC(employee.id);
                const netPay = getNetPay(employee.id);
                
                return (
                  <tr key={employee.id}>
                    <td>{employee.id}</td>
                    <td>{employee.fullName || 'N/A'}</td>
                    <td>{employee.email || 'N/A'}</td>
                    <td>
                      <span className={`status-badge ${employee.status?.toLowerCase()}`}>
                        {employee.status}
                      </span>
                    </td>
                    <td>{employee.totalExperience || 'N/A'}</td>
                    <td className="salary-cell">
                      <span className={currentCTC > 0 ? 'salary-set' : 'salary-not-set'}>
                        ₹{currentCTC.toLocaleString()}
                      </span>
                    </td>
                    <td className="salary-cell">
                      <span className={netPay > 0 ? 'salary-set' : 'salary-not-set'}>
                        ₹{netPay.toLocaleString()}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="btn btn-primary btn-sm"
                        onClick={() => handleCTCUpdate(employee)}
                        disabled={updating}
                      >
                        {currentCTC > 0 ? 'Update CTC' : 'Set CTC'}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* CTC Update Modal */}
      {showCTCModal && (
        <div className="modal-backdrop">
          <div className="modal large-modal">
            <div className="modal-header">
              <h3>
                {getCurrentCTC(selectedEmployee?.id) > 0 ? 'Update' : 'Set'} CTC - {selectedEmployee?.fullName}
              </h3>
              <button 
                className="modal-close-btn"
                onClick={() => setShowCTCModal(false)}
                disabled={updating}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleCTCSubmit} className="ctc-form">
              <div className="employee-info-section">
                <h4>Employee Information</h4>
                <div className="employee-info-grid">
                  <p><strong>ID:</strong> {selectedEmployee?.id}</p>
                  <p><strong>Name:</strong> {selectedEmployee?.fullName}</p>
                  <p><strong>Email:</strong> {selectedEmployee?.email}</p>
                  <p><strong>Experience:</strong> {selectedEmployee?.totalExperience}</p>
                </div>
              </div>

              <div className="form-section">
                <h4>Earnings</h4>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Basic Salary *</label>
                    <input 
                      type="number" 
                      value={ctcData.basicSalary}
                      onChange={(e) => handleInputChange('basicSalary', e.target.value)}
                      className="form-input"
                      min="0"
                      required
                      disabled={updating}
                      placeholder="e.g., 300000"
                    />
                  </div>
                  <div className="form-group">
                    <label>HRA (House Rent Allowance) *</label>
                    <input 
                      type="number" 
                      value={ctcData.hra}
                      onChange={(e) => handleInputChange('hra', e.target.value)}
                      className="form-input"
                      min="0"
                      required
                      disabled={updating}
                      placeholder="e.g., 100000"
                    />
                  </div>
                  <div className="form-group">
                    <label>Other Allowances *</label>
                    <input 
                      type="number" 
                      value={ctcData.allowances}
                      onChange={(e) => handleInputChange('allowances', e.target.value)}
                      className="form-input"
                      min="0"
                      required
                      disabled={updating}
                      placeholder="e.g., 50000"
                    />
                  </div>
                  <div className="form-group">
                    <label>Bonus/Incentives *</label>
                    <input 
                      type="number" 
                      value={ctcData.bonus}
                      onChange={(e) => handleInputChange('bonus', e.target.value)}
                      className="form-input"
                      min="0"
                      required
                      disabled={updating}
                      placeholder="e.g., 50000"
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h4>Deductions</h4>
                <div className="form-grid">
                  <div className="form-group">
                    <label>PF Contribution *</label>
                    <input 
                      type="number" 
                      value={ctcData.pfContribution}
                      onChange={(e) => handleInputChange('pfContribution', e.target.value)}
                      className="form-input"
                      min="0"
                      required
                      disabled={updating}
                      placeholder="e.g., 36000"
                    />
                  </div>
                  <div className="form-group">
                    <label>Tax Deduction *</label>
                    <input 
                      type="number" 
                      value={ctcData.tax}
                      onChange={(e) => handleInputChange('tax', e.target.value)}
                      className="form-input"
                      min="0"
                      required
                      disabled={updating}
                      placeholder="e.g., 50000"
                    />
                  </div>
                </div>
              </div>
              
              <div className="ctc-summary">
                <div className="summary-breakdown">
                  <div className="summary-section">
                    <h5>💰 Total Earnings</h5>
                    <p>₹{(Number(ctcData.basicSalary || 0) + Number(ctcData.hra || 0) + Number(ctcData.allowances || 0) + Number(ctcData.bonus || 0)).toLocaleString()}</p>
                  </div>
                  <div className="summary-section">
                    <h5>💸 Total Deductions</h5>
                    <p>₹{(Number(ctcData.pfContribution || 0) + Number(ctcData.tax || 0)).toLocaleString()}</p>
                  </div>
                </div>
                <h4 className="total-ctc">
                  🎯 Total CTC: ₹{Object.values(ctcData).reduce((sum, val) => sum + Number(val || 0), 0).toLocaleString()}
                </h4>
                <h4 className="net-pay">
                  💳 Net Pay: ₹{(Object.values(ctcData).reduce((sum, val) => sum + Number(val || 0), 0) - Number(ctcData.pfContribution || 0) - Number(ctcData.tax || 0)).toLocaleString()}
                </h4>
              </div>
              
              <div className="modal-actions">
                <button 
                  type="submit" 
                  className="btn btn-success"
                  disabled={updating}
                >
                  {updating ? 'Updating...' : (getCurrentCTC(selectedEmployee?.id) > 0 ? '✅ Update CTC' : '💾 Set CTC')}
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowCTCModal(false)}
                  disabled={updating}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Payroll Actions Component
function PayrollActions() {
  const [generating, setGenerating] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toLocaleString('default', { month: 'long' }).toUpperCase());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const months = [
    'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
    'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
  ];

  const handleGeneratePayslips = async () => {
    try {
      setGenerating(true);
      const token = localStorage.getItem('jwtToken');
      
      const response = await axios.post('/payflowapi/payroll/payslips/generate', {
        month: selectedMonth,
        year: selectedYear
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        alert(`Payslips generated successfully! Generated ${response.data.generated} out of ${response.data.totalEmployees} employees.`);
      } else {
        alert('Failed to generate payslips: ' + response.data.error);
      }
    } catch (error) {
      console.error('Error generating payslips:', error);
      alert('Failed to generate payslips');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="payroll-actions">
      <h3>Payroll Actions</h3>
      <div className="actions-grid">
        <div className="action-card">
          <h4>Generate Monthly Payslips</h4>
          <div className="action-controls">
            <select 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="form-input"
            >
              {months.map(month => (
                <option key={month} value={month}>{month}</option>
              ))}
            </select>
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="form-input"
            >
              <option value={2024}>2024</option>
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
            </select>
            <button 
              className="btn btn-success"
              onClick={handleGeneratePayslips}
              disabled={generating}
            >
              {generating ? 'Generating...' : 'Generate Payslips'}
            </button>
          </div>
        </div>
        
        <div className="action-card">
          <h4>Quick Actions</h4>
          <div className="quick-actions">
            <button className="btn btn-primary" onClick={() => window.open('/payslip-view', '_blank')}>
              View All Payslips
            </button>
            <button className="btn btn-secondary" onClick={() => window.open('/ctc-management', '_blank')}>
              CTC Management
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main Payroll Management Component
function PayrollManagement() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="payroll-management">
      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button 
          className={`tab-btn ${activeTab === 'ctc' ? 'active' : ''}`}
          onClick={() => setActiveTab('ctc')}
        >
          💼 CTC Management
        </button>
        <button 
          className={`tab-btn ${activeTab === 'actions' ? 'active' : ''}`}
          onClick={() => setActiveTab('actions')}
        >
          ⚡ Actions
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'overview' && (
          <div>
            <PayrollStats />
          </div>
        )}
        {activeTab === 'ctc' && <EmployeeCTCManagement />}
        {activeTab === 'actions' && <PayrollActions />}
      </div>
    </div>
  );
}

export default PayrollManagement;