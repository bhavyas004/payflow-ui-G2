import React from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './shared/hooks/useAuth';

// Import unified components
import UnifiedDashboard from './unified/pages/UnifiedDashboard';
import UnifiedPayrollManagement from './unified/pages/UnifiedPayrollManagement';
import UnifiedEmployeeManagement from './unified/pages/UnifiedEmployeeManagement';
import UnifiedUserManagement from './unified/pages/UnifiedUserManagement';
import UnifiedLeaveManagement from './unified/pages/UnifiedLeaveManagement';

// Import shared styles
import './shared/styles/unified.css';

/**
 * Unified App Router Component
 * Test routing for new unified architecture
 * Access via /payflow-ai route with proper navigation
 */
function UnifiedAppRouter() {
  const { isLoggedIn, loading, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading unified interface...</p>
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
          <p>Please log in to access the unified interface.</p>
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
          <div style={{ marginTop: '2rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px' }}>
            <h4>🧪 Testing the Unified Interface</h4>
            <p><strong>Current Role:</strong> {role || 'Not logged in'}</p>
            <p><strong>Available Features:</strong></p>
            <ul style={{ textAlign: 'left', fontSize: '0.875rem' }}>
              <li>Role-based navigation and permissions</li>
              <li>Unified dashboard with role-specific content</li>
              <li>Consolidated payroll management</li>
              <li>Streamlined employee management</li>
              <li>Comprehensive leave management</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="unified-app">
        <Routes>
          {/* Default redirect to dashboard */}
          <Route path="/" element={<Navigate to="/payflow-ai/dashboard" replace />} />
          
          {/* Unified Dashboard */}
          <Route path="/dashboard" element={<UnifiedDashboard />} />
          
          {/* Unified Payroll Management */}
          <Route path="/payroll" element={<UnifiedPayrollManagement />} />
          <Route path="/payslips" element={<UnifiedPayrollManagement />} />
          <Route path="/ctc" element={<UnifiedPayrollManagement />} />
          
          {/* Unified Employee Management */}
          <Route path="/employees" element={<UnifiedEmployeeManagement />} />
          <Route path="/onboarding" element={<UnifiedEmployeeManagement />} />
          
          {/* Unified User Management */}
          <Route path="/users" element={<UnifiedUserManagement />} />
          <Route path="/user-management" element={<UnifiedUserManagement />} />
          
          {/* Unified Leave Management */}
          <Route path="/leaves" element={<UnifiedLeaveManagement />} />
          <Route path="/leave-request" element={<UnifiedLeaveManagement />} />
          
          {/* Analytics placeholder */}
          <Route path="/analytics" element={
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              minHeight: '50vh',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              <h2>📊 Analytics Dashboard</h2>
              <p>Advanced analytics and reporting features coming soon!</p>
              <button 
                className="btn btn-primary"
                onClick={() => navigate('/payflow-ai/dashboard')}
              >
                ← Back to Dashboard
              </button>
            </div>
          } />
          
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

export default UnifiedAppRouter;
