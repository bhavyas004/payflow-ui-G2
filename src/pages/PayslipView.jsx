// Add this import with your other imports
import PayslipGenerationForm from '../components/PayslipGenerationForm';
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

// Payslip Card Component
function PayslipCard({ payslip, employeeName, onDownload, onView, downloading }) {
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
          className="btn btn-secondary btn-sm"
          onClick={() => onView(payslip)}
          style={{ marginRight: '8px' }}
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

export default function PayslipView() {
  const [user, setUser] = useState({ name: 'HR User' });
  const navigate = useNavigate();
  const [payslips, setPayslips] = useState([]);
  const [filteredPayslips, setFilteredPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [employees, setEmployees] = useState([]);
  // Add this state variable
  const [showGenerationForm, setShowGenerationForm] = useState(false);

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
      
      const response = await axios.get('http://localhost:8080/payflowapi/payroll/payslips', {
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
      const response = await axios.get('http://localhost:8080/payflowapi/onboard-employee/employees', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmployees(response.data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
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

    if (selectedEmployee) {
      filtered = filtered.filter(payslip => payslip.employeeId === parseInt(selectedEmployee));
    }

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

  // View payslip in new tab
  const handleView = async (payslip) => {
    try {
      const token = localStorage.getItem('jwtToken');
      const viewUrl = `http://localhost:8080/payflowapi/payroll/payslips/download/${payslip.employeeId}/${payslip.month.toLowerCase()}/${payslip.year}`;
      
      // Open in new tab with authorization header (this might not work due to CORS)
      // Better approach: create a temporary URL with token
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
      const token = localStorage.getItem('jwtToken');
      
      const downloadUrl = `http://localhost:8080/payflowapi/payroll/payslips/download/${payslip.employeeId}/${payslip.month.toLowerCase()}/${payslip.year}`;
      
      console.log('Downloading from:', downloadUrl);
      
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
        link.download = `payslip_${payslip.employeeId}_${payslip.month}_${payslip.year}.html`;
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        
        // Cleanup
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

  // Generate payslips for the month
  const handleGeneratePayslips = () => {
    setShowGenerationForm(true);
  };

  const handleCloseGenerationForm = () => {
    setShowGenerationForm(false);
  };

  const handleGenerateConfirm = async (payload) => {
    setLoading(true);
    
    try {
      const token = localStorage.getItem('jwtToken');
      
      console.log('🚀 Received payload from form:', payload);

      const response = await axios.post('/payflowapi/payroll/payslips/generate', payload, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success || response.status === 200) {
        console.log('✅ Payslips generated successfully:', response.data);
        alert(`Successfully generated ${response.data.generated} payslips for ${response.data.employeesWithCTC} employees with CTC data.`);
        
        setShowGenerationForm(false);
        // Refresh the payslips list
        fetchPayslips();
      } else {
        throw new Error(response.data.message || 'Failed to generate payslips');
      }
    } catch (error) {
      console.error('❌ Payslip generation failed:', error);
      alert(`Failed to generate payslips: ${error.response?.data?.error || error.message}`);
      // await showAlert({
      //   title: 'Generation Failed',
      //   message: `Failed to generate payslips: ${error.response?.data?.error || error.message}`,
      //   variant: 'error'
      // });
    } finally {
      setLoading(false);
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
                  className="btn-primary generate-btn"
                  onClick={handleGeneratePayslips}
                  disabled={loading || showGenerationForm}
                >
                  {loading ? (
                    <>⏳ Generating...</>
                  ) : showGenerationForm ? (
                    <>📝 Form Open</>
                  ) : (
                    <>🚀 Generate New Payslips</>
                  )}
                </button>
              </div>
          </div>

        {showGenerationForm && (
          <PayslipGenerationForm 
            isOpen={showGenerationForm}
            onClose={handleCloseGenerationForm}
            onGenerate={handleGenerateConfirm}
            loading={loading}
            />
        )}
  
          {/* Filters */}
          {
            !showGenerationForm && (
              <>
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
                    onView={handleView}
                    downloading={downloading}
                  />
                ))}
              </div>
            )}
          </div>
        </>
            )
          }
        </div>
      </div>
    </div>
  );
}