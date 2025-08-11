import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const SimpleUnifiedPayrollManagement = () => {
  const [activeTab, setActiveTab] = useState('summary');
  const [loading, setLoading] = useState(false);
  const [payrollData, setPayrollData] = useState({
    totalEmployees: 25,
    totalPayroll: 125000,
    pendingPayslips: 5,
    completedPayslips: 20,
    statistics: {
      currentMonth: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      totalProcessed: 20,
      totalPending: 5,
      totalAmount: 125000,
      averageSalary: 5000,
      totalPayslips: 20,
      totalEmployees: 25,
      totalPayrollAmount: 125000
    }
  });

  const fetchPayrollData = useCallback(async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('jwtToken');
      
      if (!token) {
        console.error('No JWT token found');
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };
      
      // Fetch payslips and employees
      const promises = [
        axios.get('http://localhost:8080/payflowapi/payroll/payslips', { headers })
          .then(res => {
            console.log('Payslips API Response:', res.data);
            return { type: 'payslips', data: res.data?.data || res.data || [] };
          })
          .catch(error => {
            console.error('Error fetching payslips:', error.response?.data || error.message);
            return { type: 'payslips', data: [] };
          }),
        
        axios.get('http://localhost:8080/payflowapi/onboard-employee/employees', { headers })
          .then(res => {
            console.log('Employees API Response:', res.data);
            return { type: 'employees', data: res.data || [] };
          })
          .catch(error => {
            console.error('Error fetching employees:', error.response?.data || error.message);
            return { type: 'employees', data: [] };
          })
      ];

      const results = await Promise.all(promises);
      
      // Process results
      const newPayrollData = { ...payrollData };
      
      results.forEach(result => {
        switch (result.type) {
          case 'payslips':
            const payslips = result.data || [];
            newPayrollData.completedPayslips = payslips.length;
            newPayrollData.totalPayroll = payslips.reduce((sum, p) => sum + (p.totalSalary || 0), 0);
            break;
          case 'employees':
            const employees = result.data || [];
            newPayrollData.totalEmployees = employees.length;
            break;
        }
      });

      // Update statistics
      newPayrollData.statistics = {
        ...newPayrollData.statistics,
        totalPayslips: newPayrollData.completedPayslips,
        totalEmployees: newPayrollData.totalEmployees,
        totalPayrollAmount: newPayrollData.totalPayroll
      };

      setPayrollData(newPayrollData);
    } catch (error) {
      console.error('Error in fetchPayrollData:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchPayrollData]);

  useEffect(() => {
    fetchPayrollData();
  }, [fetchPayrollData]);

  const renderOverview = () => {
    const stats = payrollData.statistics || {
      currentMonth: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      totalProcessed: 0,
      totalPending: 0,
      totalAmount: 0,
      averageSalary: 0,
      totalPayslips: payrollData.completedPayslips || 0,
      totalEmployees: payrollData.totalEmployees || 0,
      totalPayrollAmount: payrollData.totalPayroll || 0
    };
    
    if (loading) {
      return (
        <div className="unified-loading-state" style={{ textAlign: 'center', padding: '2rem' }}>
          <h3>Loading payroll data...</h3>
          <p>Please wait while we fetch the latest information.</p>
        </div>
      );
    }

    return (
      <div className="unified-payroll-overview">
        <div className="unified-overview-header" style={{ marginBottom: '2rem' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem' }}>Payroll Overview</h3>
          <p style={{ margin: 0, color: '#64748b' }}>Current month: {stats.currentMonth}</p>
        </div>
        
        <div className="unified-overview-stats" style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          <div className="unified-stat-card" style={{
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '0.5rem',
            padding: '1.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ fontSize: '2rem' }}>📄</div>
              <div>
                <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '2rem', fontWeight: 'bold' }}>
                  {stats.totalPayslips}
                </h4>
                <p style={{ margin: 0, color: '#64748b' }}>Total Payslips</p>
              </div>
            </div>
          </div>

          <div className="unified-stat-card" style={{
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '0.5rem',
            padding: '1.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ fontSize: '2rem' }}>👥</div>
              <div>
                <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '2rem', fontWeight: 'bold' }}>
                  {stats.totalEmployees}
                </h4>
                <p style={{ margin: 0, color: '#64748b' }}>Total Employees</p>
              </div>
            </div>
          </div>

          <div className="unified-stat-card" style={{
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '0.5rem',
            padding: '1.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ fontSize: '2rem' }}>💰</div>
              <div>
                <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '2rem', fontWeight: 'bold' }}>
                  ₹{stats.totalPayrollAmount.toLocaleString()}
                </h4>
                <p style={{ margin: 0, color: '#64748b' }}>Total Payroll</p>
              </div>
            </div>
          </div>
        </div>

        <div className="unified-quick-actions" style={{
          background: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: '0.5rem',
          padding: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h4 style={{ margin: '0 0 1rem 0', fontSize: '1.125rem' }}>Quick Actions</h4>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button style={{
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              padding: '0.5rem 1rem',
              fontSize: '0.875rem',
              cursor: 'pointer'
            }}>
              📄 Generate Payslips
            </button>
            <button style={{
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              padding: '0.5rem 1rem',
              fontSize: '0.875rem',
              cursor: 'pointer'
            }}>
              👥 Manage Employees
            </button>
            <button style={{
              background: '#8b5cf6',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              padding: '0.5rem 1rem',
              fontSize: '0.875rem',
              cursor: 'pointer'
            }}>
              📊 View Reports
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderEmployees = () => (
    <div className="unified-employees-tab">
      <h3 style={{ marginBottom: '1rem' }}>Employee Management</h3>
      <p style={{ color: '#64748b' }}>Employee management features will be implemented here.</p>
    </div>
  );

  const renderPayslips = () => (
    <div className="unified-payslips-tab">
      <h3 style={{ marginBottom: '1rem' }}>Payslip Management</h3>
      <p style={{ color: '#64748b' }}>Payslip generation and management features will be implemented here.</p>
    </div>
  );

  const renderSettings = () => (
    <div className="unified-settings-tab">
      <h3 style={{ marginBottom: '1rem' }}>Payroll Settings</h3>
      <p style={{ color: '#64748b' }}>Payroll configuration and settings will be implemented here.</p>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'summary':
        return renderOverview();
      case 'employees':
        return renderEmployees();
      case 'payslips':
        return renderPayslips();
      case 'settings':
        return renderSettings();
      default:
        return renderOverview();
    }
  };

  return (
    <div className="unified-payroll-management" style={{ 
      background: '#f8fafc',
      minHeight: '100vh',
      padding: '2rem'
    }}>
      <div className="unified-header" style={{ marginBottom: '2rem' }}>
        <h1 style={{ 
          fontSize: '2rem', 
          fontWeight: 'bold', 
          margin: '0 0 0.5rem 0',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          🚀 Unified Payroll Management
        </h1>
        <p style={{ margin: 0, color: '#64748b', fontSize: '1rem' }}>
          Modern, comprehensive payroll management system
        </p>
      </div>

      <div className="unified-tabs" style={{ marginBottom: '2rem' }}>
        <div style={{ 
          display: 'flex', 
          gap: '0.5rem',
          background: 'white',
          padding: '0.5rem',
          borderRadius: '0.5rem',
          border: '1px solid #e2e8f0'
        }}>
          {[
            { id: 'summary', label: '📊 Summary', icon: '📊' },
            { id: 'employees', label: '👥 Employees', icon: '👥' },
            { id: 'payslips', label: '📄 Payslips', icon: '📄' },
            { id: 'settings', label: '⚙️ Settings', icon: '⚙️' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: activeTab === tab.id 
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  : 'transparent',
                color: activeTab === tab.id ? 'white' : '#64748b',
                border: 'none',
                borderRadius: '0.375rem',
                padding: '0.75rem 1.5rem',
                fontSize: '0.875rem',
                fontWeight: activeTab === tab.id ? 'bold' : 'normal',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="unified-content" style={{
        background: 'white',
        borderRadius: '0.5rem',
        border: '1px solid #e2e8f0',
        padding: '2rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        {renderTabContent()}
      </div>
    </div>
  );
};

export default SimpleUnifiedPayrollManagement;
