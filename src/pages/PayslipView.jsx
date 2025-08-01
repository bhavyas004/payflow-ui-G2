import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

// Sidebar Component
// Update your existing HRSidebar component

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
          {/* New Payroll Menu Items */}
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

// Payslip Card Component
function PayslipCard({ payslip, employeeName, onDownload }) {
  return (
    <div className="payslip-card">
      <div className="payslip-header">
        <h4>{employeeName || `Employee ID: ${payslip.employeeId}`}</h4>
        <span className="payslip-period">{payslip.month} {payslip.year}</span>
      </div>
      <div className="payslip-details">
        <div className="detail-row">
          <span>Net Pay:</span>
          <span className="amount">₹{Number(payslip.netPay).toLocaleString()}</span>
        </div>
        <div className="detail-row">
          <span>Deductions:</span>
          <span className="deduction">₹{Number(payslip.deductions).toLocaleString()}</span>
        </div>
        <div className="detail-row">
          <span>Generated:</span>
          <span>{new Date(payslip.generatedOn).toLocaleDateString()}</span>
        </div>
      </div>
      <div className="payslip-actions">
        <button 
          className="btn btn-primary btn-sm"
          onClick={() => onDownload(payslip)}
          disabled={!payslip.downloadLink}
        >
          📄 Download
        </button>
        <button className="btn btn-secondary btn-sm">
          👁️ View
        </button>
      </div>
    </div>
  );
}

export default function PayslipView() {
  const [user, setUser] = useState({ name: 'HR User' });
  const navigate = useNavigate();
  const [payslips, setPayslips] = useState([]);
  const [filteredPayslips, setFilteredPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  
  // Filter states
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const months = [
    'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
    'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
  ];

  useEffect(() => {
    const token = localStorage.getItem('jwtToken');
    if (token) {
      const payload = parseJwt(token);
      setUser({ name: payload.sub || payload.username || 'HR User' });
    }
    
    fetchPayslips();
    fetchEmployees();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [payslips, selectedMonth, selectedYear, selectedEmployee, searchTerm]);

  const fetchPayslips = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('jwtToken');
      
      const response = await axios.get('/payflowapi/payroll/payslips', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setPayslips(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching payslips:', error);
      setPayslips([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('jwtToken');
      const response = await axios.get('/payflowapi/onboard-employee/employees', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmployees(response.data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...payslips];

    // Filter by month
    if (selectedMonth) {
      filtered = filtered.filter(payslip => payslip.month === selectedMonth);
    }

    // Filter by year
    if (selectedYear) {
      filtered = filtered.filter(payslip => payslip.year === selectedYear);
    }

    // Filter by employee
    if (selectedEmployee) {
      filtered = filtered.filter(payslip => payslip.employeeId === parseInt(selectedEmployee));
    }

    // Search by employee name or ID
    if (searchTerm) {
      filtered = filtered.filter(payslip => {
        const employee = employees.find(emp => emp.id === payslip.employeeId);
        const employeeName = employee ? employee.fullName.toLowerCase() : '';
        return employeeName.includes(searchTerm.toLowerCase()) || 
               payslip.employeeId.toString().includes(searchTerm);
      });
    }

    setFilteredPayslips(filtered);
  };

  const handleDownload = (payslip) => {
    if (payslip.downloadLink) {
      window.open(payslip.downloadLink, '_blank');
    } else {
      alert('Download link not available for this payslip');
    }
  };

  const handleGeneratePayslips = async () => {
    try {
      const token = localStorage.getItem('jwtToken');
      const currentMonth = new Date().toLocaleString('default', { month: 'long' }).toUpperCase();
      const currentYear = new Date().getFullYear();

      await axios.post('/payflowapi/payroll/payslips/generate', {
        month: currentMonth,
        year: currentYear
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Monthly payslips generation initiated!');
      fetchPayslips(); // Refresh the list
    } catch (error) {
      console.error('Error generating payslips:', error);
      alert('Failed to generate payslips. Please try again.');
    }
  };

  const getEmployeeName = (employeeId) => {
    const employee = employees.find(emp => emp.id === employeeId);
    return employee ? employee.fullName : `Employee ID: ${employeeId}`;
  };

  return (
    <div className="dashboard-layout">
      <HRSidebar active="payslips" />
      <div className="main-content">
        {/* Topbar */}
        <div className="topbar">
          <h1>Payslip Management</h1>
          <div className="user-info">
            <span>Welcome, {user.name}</span>
            <button 
              onClick={() => {
                localStorage.removeItem('jwtToken');
                navigate('/');
              }}
              className="logout-btn"
            >
              Logout
            </button>
          </div>
        </div>
        
        <div className="payslip-management">
          {/* Header Actions */}
          <div className="payslip-header">
            <h2>Employee Payslips</h2>
            <div className="header-actions">
              <button 
                className="btn btn-success"
                onClick={handleGeneratePayslips}
              >
                + Generate Monthly Payslips
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="filters-section">
            <div className="filters-row">
              <div className="filter-group">
                <label>Search:</label>
                <input
                  type="text"
                  placeholder="Search by employee name or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
              
              <div className="filter-group">
                <label>Month:</label>
                <select 
                  value={selectedMonth} 
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="filter-select"
                >
                  <option value="">All Months</option>
                  {months.map(month => (
                    <option key={month} value={month}>{month}</option>
                  ))}
                </select>
              </div>
              
              <div className="filter-group">
                <label>Year:</label>
                <select 
                  value={selectedYear} 
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="filter-select"
                >
                  <option value="">All Years</option>
                  <option value={2024}>2024</option>
                  <option value={2025}>2025</option>
                  <option value={2026}>2026</option>
                </select>
              </div>
              
              <div className="filter-group">
                <label>Employee:</label>
                <select 
                  value={selectedEmployee} 
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  className="filter-select"
                >
                  <option value="">All Employees</option>
                  {employees.map(employee => (
                    <option key={employee.id} value={employee.id}>
                      {employee.fullName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="results-info">
              <span>Showing {filteredPayslips.length} of {payslips.length} payslips</span>
            </div>
          </div>

          {/* Payslips Grid */}
          <div className="payslips-content">
            {loading ? (
              <div className="loading-state">
                <p>Loading payslips...</p>
              </div>
            ) : filteredPayslips.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📄</div>
                <h3>No Payslips Found</h3>
                <p>No payslips match your current filters.</p>
                <button className="btn btn-primary" onClick={handleGeneratePayslips}>
                  Generate Payslips
                </button>
              </div>
            ) : (
              <div className="payslips-grid">
                {filteredPayslips.map(payslip => (
                  <PayslipCard
                    key={`${payslip.employeeId}-${payslip.month}-${payslip.year}`}
                    payslip={payslip}
                    employeeName={getEmployeeName(payslip.employeeId)}
                    onDownload={handleDownload}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}