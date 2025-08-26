import React from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './shared/hooks/useAuth';

// Import unified components
import Dashboard from './pages/Dashboard';
import PayrollManagement from './pages/PayrollManagement';
import EmployeeManagement from './pages/EmployeeManagement';
import UserManagement from './pages/UserManagement';
import LeaveManagement from './pages/LeaveManagement';

// Import shared styles
import './shared/styles/unified.css';

/**
 * Auth Router Component
 * Access via /payflow-ai route with proper navigation
 */
function AuthRouter() {
  const { isLoggedIn, loading, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading PayFlow interface...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isLoggedIn) {
    return (
      <div className="auth-required-container">
        <div className="auth-required-content">
          <h2>🔐 Authentication Required</h2>
          <p>Please log in to access the payflow-ai interface.</p>
          <div style={{ marginTop: '1.5rem' }}>
            <button 
              className="btn btn-primary"
              onClick={() => window.location.href = '/'}
              style={{ marginRight: '1rem' }}
            >
              Go to Login
            </button>
            <button 
              className="btn btn-secondary"
              onClick={() => window.location.href = '/employee-login'}
            >
              Employee Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="payflow-app">
        <Routes>
          {/* Default redirect to dashboard */}
          <Route path="/" element={<Navigate to="/payflow-ai/dashboard" replace />} />
          
          {/* Dashboard */}
          <Route path="/dashboard" element={<Dashboard />} />
          
          {/* Payroll Management */}
          <Route path="/payroll" element={<PayrollManagement />} />
          <Route path="/payslips" element={<PayrollManagement />} />
          <Route path="/ctc" element={<PayrollManagement />} />
          
          {/* Employee Management */}
          <Route path="/employees" element={<EmployeeManagement />} />
          <Route path="/onboarding" element={<EmployeeManagement />} />
          
          {/* User Management */}
          <Route path="/users" element={<UserManagement />} />
          <Route path="/user-management" element={<UserManagement />} />
          
          {/* Leave Management */}
          <Route path="/leaves" element={<LeaveManagement />} />
          <Route path="/leave-request" element={<LeaveManagement />} />
          
          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/payflow-ai/dashboard" replace />} />
        </Routes>
        
        {/* Footer with testing info */}
        <div style={{ 
          background: '#f8fafc', 
          padding: '1rem', 
          textAlign: 'center', 
          borderTop: '1px solid #e2e8f0',
          fontSize: '0.75rem',
          color: '#64748b'
        }}>
          <p>
            <strong>PayFlow AI</strong><br />
            Intelligent payroll management with AI-powered insights.
          </p>
        </div>
    </div>
  );
}

export default AuthRouter;
