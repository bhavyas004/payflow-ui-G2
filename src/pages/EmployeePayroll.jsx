import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Topbar from '../components/Topbar';
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

// Custom Sidebar for Employee Dashboard
function EmployeeSidebar({ active }) {
  const navigate = useNavigate();
  
  const handleLogout = () => {
    sessionStorage.removeItem('jwtToken');
    navigate('/employee-login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">PayFlow</div>
      <nav>
        <ul>
          <li className={active === 'dashboard' ? 'active' : ''}><a href="/employee-dashboard">🏠 Dashboard</a></li>
          <li className={active === 'leave-requests' ? 'active' : ''}><a href="/employee-leave-requests">📋 My Leave Requests</a></li>
          <li className={active === 'leave-request' ? 'active' : ''}><a href="/employee-leave-request">📝 Apply Leave</a></li>
          <li className={active === 'payroll' ? 'active' : ''}><a href="/employee-payroll">💰 Payroll</a></li>
          <li><button className="logout-btn" onClick={handleLogout}>🚪 Logout</button></li>
        </ul>
      </nav>
    </aside>
  );
}

// Payslip Card Component
function PayslipCard({ payslip, onDownload, onView, downloading }) {
  const grossSalary = Number(payslip.netPay) + Number(payslip.deductions);
  
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return 'Invalid Date';
    }
  };

  return (
    <div className="payslip-card">
      <div className="payslip-card-header">
        <div className="payslip-id">Payslip - {payslip.month} {payslip.year}</div>
        <span className="status-badge status-generated">Generated</span>
      </div>

      <div className="payslip-card-body">
        <div className="payslip-detail-row">
          <span className="detail-label">Gross Salary:</span>
          <span className="detail-value">₹{grossSalary.toLocaleString()}</span>
        </div>

        <div className="payslip-detail-row">
          <span className="detail-label">Total Deductions:</span>
          <span className="detail-value deduction-text">-₹{Number(payslip.deductions).toLocaleString()}</span>
        </div>

        <div className="payslip-detail-row net-pay-row">
          <span className="detail-label">Net Pay:</span>
          <span className="detail-value net-pay-value">₹{Number(payslip.netPay).toLocaleString()}</span>
        </div>

        <div className="payslip-detail-row">
          <span className="detail-label">Generated On:</span>
          <span className="detail-value">{formatDate(payslip.generatedOn)}</span>
        </div>
      </div>

      <div className="payslip-card-footer">
        <button 
          className="btn btn-secondary btn-sm"
          onClick={() => onView(payslip)}
        >
          👁️ View
        </button>
        <button 
          className="btn btn-primary btn-sm"
          onClick={() => onDownload(payslip)}
          disabled={downloading}
        >
          {downloading ? '⏳ Downloading...' : '📄 Download'}
        </button>
      </div>
    </div>
  );
}

// Salary Breakdown Component
function SalaryBreakdown({ payslip }) {
  const grossSalary = Number(payslip.netPay) + Number(payslip.deductions);
  const basicSalary = grossSalary * 0.8;
  const hra = grossSalary * 0.1;
  const allowances = grossSalary * 0.05;
  const bonuses = grossSalary * 0.05;
  const pfContribution = Number(payslip.deductions) * 0.6;
  const tax = Number(payslip.deductions) * 0.4;

  return (
    <div className="salary-breakdown">
      <h3>Salary Breakdown - {payslip.month} {payslip.year}</h3>
      <div className="breakdown-grid">
        <div className="earnings-section">
          <h4>Earnings</h4>
          <div className="breakdown-item">
            <span>Basic Salary</span>
            <span>₹{basicSalary.toLocaleString()}</span>
          </div>
          <div className="breakdown-item">
            <span>HRA</span>
            <span>₹{hra.toLocaleString()}</span>
          </div>
          <div className="breakdown-item">
            <span>Allowances</span>
            <span>₹{allowances.toLocaleString()}</span>
          </div>
          <div className="breakdown-item">
            <span>Bonuses</span>
            <span>₹{bonuses.toLocaleString()}</span>
          </div>
          <div className="breakdown-total">
            <span>Total Earnings</span>
            <span>₹{grossSalary.toLocaleString()}</span>
          </div>
        </div>
        
        <div className="deductions-section">
          <h4>Deductions</h4>
          <div className="breakdown-item">
            <span>PF Contribution</span>
            <span>₹{pfContribution.toLocaleString()}</span>
          </div>
          <div className="breakdown-item">
            <span>Income Tax</span>
            <span>₹{tax.toLocaleString()}</span>
          </div>
          <div className="breakdown-item">
            <span>Other Deductions</span>
            <span>₹0</span>
          </div>
          <div className="breakdown-total">
            <span>Total Deductions</span>
            <span>₹{Number(payslip.deductions).toLocaleString()}</span>
          </div>
        </div>
      </div>
      
      <div className="net-salary">
        <h4>Net Salary: ₹{Number(payslip.netPay).toLocaleString()}</h4>
      </div>
    </div>
  );
}

export default function EmployeePayroll() {
  const [user, setUser] = useState({ name: 'Employee' });
  const navigate = useNavigate();
  const [payslips, setPayslips] = useState([]);
  const [filteredPayslips, setFilteredPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [error, setError] = useState('');
  
  // Filter states
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const months = [
    'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
    'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
  ];

  useEffect(() => {
    // Extract user info from JWT token
    const token = sessionStorage.getItem('jwtToken');
    if (token) {
      const payload = parseJwt(token);
      setUser({ 
        name: payload.fullName || payload.sub || payload.username || 'Employee',
        employeeId: payload.employeeId,
        status: payload.status
      });
    }
  }, []);

  useEffect(() => {
    fetchPayslips();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [payslips, selectedMonth, selectedYear]);

  const fetchPayslips = async () => {
    try {
      setLoading(true);
      setError('');
      const token = sessionStorage.getItem('jwtToken');
      const payload = parseJwt(token);
      const employeeId = payload.employeeId;
      
      if (!employeeId) {
        setError('Employee ID not found');
        return;
      }

      const response = await axios.get(`http://localhost:8080/payflowapi/payroll/payslips/employee/${employeeId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        const payslipsData = response.data.data || [];
        setPayslips(payslipsData);
        if (payslipsData.length > 0) {
          setSelectedPayslip(payslipsData[0]);
        }
      } else {
        setError('Failed to fetch payslips');
        setPayslips([]);
      }
    } catch (error) {
      console.error('Error fetching payslips:', error);
      setError('Error loading payslips');
      setPayslips([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...payslips];

    if (selectedMonth) {
      filtered = filtered.filter(payslip => payslip.month === selectedMonth);
    }

    if (selectedYear) {
      filtered = filtered.filter(payslip => payslip.year === selectedYear);
    }

    setFilteredPayslips(filtered);
  };

  // View payslip in new tab
  const handleView = async (payslip) => {
    try {
      const token = sessionStorage.getItem('jwtToken');
      const viewUrl = `http://localhost:8080/payflowapi/payroll/payslips/download/${payslip.employeeId}/${payslip.month.toLowerCase()}/${payslip.year}`;
      
      const newWindow = window.open('', '_blank');
      
      try {
        const response = await fetch(viewUrl, {
          method: 'GET',
          headers: { 
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const htmlContent = await response.text();
          newWindow.document.write(htmlContent);
          newWindow.document.close();
        } else {
          newWindow.close();
          alert('Failed to view payslip');
        }
      } catch (error) {
        newWindow.close();
        console.error('Error viewing payslip:', error);
        alert('Failed to view payslip. Please try downloading instead.');
      }
    } catch (error) {
      console.error('Error viewing payslip:', error);
      alert('Failed to view payslip. Please try again.');
    }
  };

  // Download payslip as HTML file
  const handleDownload = async (payslip) => {
    try {
      setDownloading(true);
      const token = sessionStorage.getItem('jwtToken');
      
      const downloadUrl = `http://localhost:8080/payflowapi/payroll/payslips/download/${payslip.employeeId}/${payslip.month.toLowerCase()}/${payslip.year}`;
      
      const response = await fetch(downloadUrl, {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `payslip_${payslip.month}_${payslip.year}.html`;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        alert('Payslip downloaded successfully! You can open the HTML file in your browser and print it as PDF.');
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(`Download failed: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error downloading payslip:', error);
      alert('Failed to download payslip. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="dashboard-layout">
      <EmployeeSidebar active="payroll" />
      <div className="main-content">
        <Topbar
          title="My Payroll"
          user={user}
          onLogout={() => {
            sessionStorage.removeItem('jwtToken');
            navigate('/employee-login');
          }}
        />
        
        <div className="payroll-container">
          {/* Current Salary Overview */}
          {selectedPayslip && (
            <div className="salary-overview">
              <div className="overview-card">
                <div className="overview-header">
                  <h2>Current Month Salary</h2>
                  <span className="month-year-badge">{selectedPayslip.month} {selectedPayslip.year}</span>
                </div>
                <div className="overview-stats">
                  <div className="stat-item">
                    <span className="stat-label">Gross Salary</span>
                    <span className="stat-value">₹{(Number(selectedPayslip.netPay) + Number(selectedPayslip.deductions)).toLocaleString()}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Deductions</span>
                    <span className="stat-value deduction-stat">₹{Number(selectedPayslip.deductions).toLocaleString()}</span>
                  </div>
                  <div className="stat-item highlight">
                    <span className="stat-label">Net Pay</span>
                    <span className="stat-value">₹{Number(selectedPayslip.netPay).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="payroll-header">
            <h2>Payslip History</h2>
          </div>

          {/* Filters */}
          <div className="payroll-filters">
            <div className="filters-row">
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
            </div>
            
            <div className="results-info">
              <span>Showing {filteredPayslips.length} of {payslips.length} payslips</span>
            </div>
          </div>

          {/* Content */}
          <div className="payroll-content">
            {loading ? (
              <div className="loading-message">Loading your payslips...</div>
            ) : error ? (
              <div className="error-message">{error}</div>
            ) : filteredPayslips.length === 0 ? (
              <div className="no-payslips-message">
                <h3>No payslips found</h3>
                <p>No payslips available for the selected period.</p>
              </div>
            ) : (
              <>
                <div className="payslips-grid">
                  {filteredPayslips.map(payslip => (
                    <PayslipCard
                      key={`${payslip.employeeId}-${payslip.month}-${payslip.year}`}
                      payslip={payslip}
                      onDownload={handleDownload}
                      onView={handleView}
                      downloading={downloading}
                    />
                  ))}
                </div>
                
                {/* Detailed Breakdown for Selected Payslip */}
                {selectedPayslip && (
                  <SalaryBreakdown payslip={selectedPayslip} />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}