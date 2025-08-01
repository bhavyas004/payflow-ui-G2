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

// Summary Card Component
function SummaryCard({ title, value, icon, onClick }) {
  return (
    <div className="summary-card" onClick={onClick}>
      <div className="card-icon">{icon}</div>
      <div className="card-content">
        <h3>{title}</h3>
        <p className="card-value">{value}</p>
      </div>
    </div>
  );
}

export default function HRPayroll() {
  const [user, setUser] = useState({ name: 'HR Name' });
  const navigate = useNavigate();
  const [payrollStats, setPayrollStats] = useState({
    totalEmployeesWithCTC: 0,
    totalMonthlyPayroll: 0,
    averageCTC: 0
  });
  const [loading, setLoading] = useState(true);
  const [currentMonth] = useState(new Date().toLocaleString('default', { month: 'long', year: 'numeric' }));

  useEffect(() => {
    // Extract user info from JWT token
    const token = localStorage.getItem('jwtToken');
    if (token) {
      const payload = parseJwt(token);
      setUser({ name: payload.sub || payload.username || 'HR User' });
    }
    
    fetchPayrollData();
  }, []);

  const fetchPayrollData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('jwtToken');
      
      // Fetch payroll statistics
      const response = await axios.get('/payflowapi/payroll/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setPayrollStats(response.data.data);
      }
      
    } catch (error) {
      console.error('Error fetching payroll data:', error);
    } finally {
      setLoading(false);
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
      fetchPayrollData(); // Refresh data
    } catch (error) {
      console.error('Error generating payslips:', error);
      alert('Failed to generate payslips. Please try again.');
    }
  };

  return (
    <div className="dashboard-layout">
      <HRSidebar active="payroll" />
      <div className="main-content">
        {/* Topbar */}
        <div className="topbar">
          <h1>Payroll Management - {currentMonth}</h1>
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
        
        <div className="payroll-dashboard">
          {/* Payroll Header with Action Buttons */}
          <div className="payroll-header">
            <h2>Payroll Dashboard</h2>
            <div className="payroll-actions">
              <button 
                className="btn btn-primary"
                onClick={() => navigate('/ctc-management')}
              >
                + Add/Update CTC
              </button>
              <button 
                className="btn btn-success"
                onClick={handleGeneratePayslips}
              >
                Generate Monthly Payslips
              </button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="summary-cards-row">
            <SummaryCard 
              title="Employees with CTC" 
              value={loading ? '...' : payrollStats.totalEmployeesWithCTC}
              icon="👥"
              onClick={() => navigate('/ctc-management')} 
            />
            <SummaryCard 
              title="Monthly Payroll" 
              value={loading ? '...' : `₹${Number(payrollStats.totalMonthlyPayroll).toLocaleString()}`}
              icon="💰"
              onClick={() => navigate('/payslip-view')} 
            />
            <SummaryCard 
              title="Average CTC" 
              value={loading ? '...' : `₹${Number(payrollStats.averageCTC).toLocaleString()}`}
              icon="📊"
              onClick={() => navigate('/ctc-management')} 
            />
          </div>

          {/* Quick Actions */}
          <div className="quick-actions-grid">
            <div className="quick-action-card" onClick={() => navigate('/ctc-management')}>
              <div className="action-icon">📊</div>
              <h3>Manage CTC</h3>
              <p>Add, edit, and view employee CTC details</p>
            </div>
            
            <div className="quick-action-card" onClick={() => navigate('/payslip-view')}>
              <div className="action-icon">📄</div>
              <h3>View Payslips</h3>
              <p>Access and download employee payslips</p>
            </div>
            
            <div className="quick-action-card" onClick={() => navigate('/hr-employees')}>
              <div className="action-icon">👥</div>
              <h3>Employee List</h3>
              <p>View all employees and their details</p>
            </div>
            
            <div className="quick-action-card" onClick={handleGeneratePayslips}>
              <div className="action-icon">⚡</div>
              <h3>Generate Payslips</h3>
              <p>Create monthly payslips for all employees</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}