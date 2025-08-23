import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../shared/hooks/useAuth';
import Layout from '../../shared/components/Layout';
import axios from 'axios';
import '../../shared/styles/unified.css';

/**
 * Unified Dashboard Component
 * Simplified, self-contained dashboard without dependencies on old UI components
 */
function UnifiedDashboard() {
  const { user, role, getToken, checkRole } = useAuth();
  const navigate = useNavigate();
  
  // Helper function to check if user can access certain roles
  const canAccess = (roles) => checkRole(roles);
  
  // Helper function to get appropriate welcome message based on role
  const getWelcomeMessage = () => {
    if (role === 'EMPLOYEE') {
      // For employees, use fullName if available, otherwise fallback to name or username
      return `Welcome, ${user?.name || user?.username || 'Employee'}`;
    } else {
      // For other roles (Admin, HR, Manager), use username
      return `Welcome, ${user?.username || user?.name || 'User'}`;
    }
  };
  
  const [summary, setSummary] = useState({
    totalUsers: 0,
    totalEmployees: 0,
    totalPayslips: 0,
    currentDate: new Date().toLocaleDateString(undefined, { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }),
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [role]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const headers = { Authorization: `Bearer ${token}` };
      
      // Simplified data fetching for unified dashboard
      const promises = [];
      
      if (canAccess(['ADMIN', 'HR'])) {
        promises.push(
          axios.get('http://localhost:8080/payflowapi/user/hr-managers', { headers })
            .then(res => ({ type: 'users', data: res.data }))
            .catch(() => ({ type: 'users', data: [] }))
        );
        
        promises.push(
          axios.get('http://localhost:8080/payflowapi/payroll/payslips', { headers })
            .then(res => ({ type: 'payslips', data: res.data.data || [] }))
            .catch(() => ({ type: 'payslips', data: [] }))
        );
      }
      
      if (canAccess(['ADMIN', 'HR', 'MANAGER'])) {
        promises.push(
          axios.get('http://localhost:8080/payflowapi/onboard-employee/employees', { headers })
            .then(res => ({ type: 'employees', data: res.data }))
            .catch(() => ({ type: 'employees', data: [] }))
        );
      }

      const results = await Promise.all(promises);
      
      let newSummary = { ...summary };
      
      results.forEach(result => {
        switch (result.type) {
          case 'users':
            newSummary.totalUsers = (result.data || []).length;
            break;
          case 'employees':
            newSummary.totalEmployees = (result.data || []).length;
            break;
          case 'payslips':
            newSummary.totalPayslips = (result.data || []).length;
            break;
        }
      });
      
      setSummary(newSummary);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Simple unified summary card component
  const UnifiedSummaryCard = ({ title, value, icon, color = '#3b82f6' }) => (
    <div style={{
      background: 'white',
      border: '1px solid #e2e8f0',
      borderRadius: '0.5rem',
      padding: '1.5rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      display: 'flex',
      alignItems: 'center',
      gap: '1rem'
    }}>
      <div style={{ fontSize: '2rem' }}>{icon}</div>
      <div>
        <h3 style={{ 
          margin: '0 0 0.25rem 0', 
          fontSize: '2rem', 
          fontWeight: 'bold',
          color: color
        }}>
          {value}
        </h3>
        <p style={{ margin: 0, color: '#64748b' }}>{title}</p>
      </div>
    </div>
  );

  if (loading) {
    return (
      <Layout title="Dashboard" subtitle="" sidebarActive="dashboard">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '50vh',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <div style={{ fontSize: '2rem' }}>⏳</div>
          <h3>Loading dashboard...</h3>
          <p style={{ color: '#64748b' }}>Please wait while we fetch your data.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Dashboard" subtitle="" sidebarActive="dashboard">
      <div style={{ padding: '2rem' }}>
        {/* Welcome Section */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ 
            fontSize: '2.5rem', 
            fontWeight: 'bold', 
            margin: '0 0 0.5rem 0',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span style={{ fontSize: '2.5rem' }}>👋</span>
            <span style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              {getWelcomeMessage()}
            </span>
          </h1>
          <p style={{ fontSize: '1.125rem', color: '#64748b', margin: 0 }}>
            {summary.currentDate} • Role: {role}
          </p>
        </div>

        {/* Summary Cards */}
        <div style={{ 
          display: 'flex',
          gap: '1.5rem',
          marginBottom: '2rem',
          flexWrap: 'nowrap',
          justifyContent: 'flex-start'
        }}>
          {canAccess(['ADMIN', 'HR']) && (
            <UnifiedSummaryCard
              title="Total Users"
              value={summary.totalUsers}
              icon="👥"
              color="#3b82f6"
            />
          )}
          
          {canAccess(['ADMIN', 'HR', 'MANAGER']) && (
            <UnifiedSummaryCard
              title="Total Employees"
              value={summary.totalEmployees}
              icon="👨‍💼"
              color="#10b981"
            />
          )}
          
          {canAccess(['ADMIN', 'HR']) && (
            <UnifiedSummaryCard
              title="Total Payslips"
              value={summary.totalPayslips}
              icon="📄"
              color="#8b5cf6"
            />
          )}
        </div>

        {/* Quick Actions */}
        <div style={{
          background: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: '0.5rem',
          padding: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem' }}>Quick Actions</h3>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {canAccess(['ADMIN', 'HR']) && (
              <>
                <button 
                  onClick={() => navigate('/payflow-ai/payroll')}
                  style={{
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.375rem',
                    padding: '0.75rem 1.5rem',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                  💰 Manage Payroll
                </button>
                <button 
                  onClick={() => navigate('/payflow-ai/employees')}
                  style={{
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.375rem',
                    padding: '0.75rem 1.5rem',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                  👥 Manage Employees
                </button>
              </>
            )}
            {(role === 'EMPLOYEE' || role === 'MANAGER') && (
              <button 
                onClick={() => navigate('/payflow-ai/leaves')}
                style={{
                  background: '#8b5cf6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  padding: '0.75rem 1.5rem',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                📋 {role === 'EMPLOYEE' ? 'My Leave Requests' : 'View Leave Requests'}
              </button>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default UnifiedDashboard;
