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
      
      let newPayrollData = { ...payrollData };
      
      results.forEach(result => {
        if (result.type === 'payslips') {
          newPayrollData.payslips = result.data;
          newPayrollData.statistics.totalPayslips = result.data.length;
          newPayrollData.statistics.totalPayrollAmount = result.data.reduce(
            (sum, payslip) => sum + (Number(payslip.netPay) || 0), 0
          );
        } else if (result.type === 'employees') {
          newPayrollData.employees = result.data;
          newPayrollData.statistics.totalEmployees = result.data.length;
        }
      });
      
      console.log('Final Payroll Data:', newPayrollData);
      setPayrollData(newPayrollData);
      
    } catch (error) {
      console.error('Error fetching payroll data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayrollData();
  }, [fetchPayrollData]);

  // Get available tabs for admin
  const getAvailableTabs = () => [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'payslips', label: 'All Payslips', icon: '📄' },
    { id: 'generate', label: 'Generate Payslips', icon: '🚀' },
    { id: 'ctc', label: 'CTC Management', icon: '💼' }
  ];

  // Render payroll overview
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
          padding: '1.5rem'
        }}>
          <h4 style={{ margin: '0 0 1rem 0' }}>Quick Actions</h4>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button 
              className="btn btn-primary"
              onClick={() => setActiveTab('generate')}
              style={{
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.375rem',
                cursor: 'pointer'
              }}
            >
              🚀 Generate Payslips
            </button>
            <button 
              className="btn btn-secondary"
              onClick={() => setActiveTab('payslips')}
              style={{
                background: '#6b7280',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.375rem',
                cursor: 'pointer'
              }}
            >
              📄 View All Payslips
            </button>
            <button 
              className="btn btn-ghost"
              onClick={() => setActiveTab('ctc')}
              style={{
                background: 'transparent',
                color: '#6b7280',
                border: '1px solid #d1d5db',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.375rem',
                cursor: 'pointer'
              }}
            >
              💼 Manage CTC
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render placeholder for other tabs
  const renderPlaceholder = (title, description) => (
    <div style={{ textAlign: 'center', padding: '3rem' }}>
      <h3 style={{ margin: '0 0 1rem 0' }}>{title}</h3>
      <p style={{ color: '#64748b', marginBottom: '2rem' }}>{description}</p>
      <button 
        onClick={() => setActiveTab('overview')}
        style={{
          background: '#3b82f6',
          color: 'white',
          border: 'none',
          padding: '0.75rem 1.5rem',
          borderRadius: '0.375rem',
          cursor: 'pointer'
        }}
      >
        ← Back to Overview
      </button>
    </div>
  );

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'payslips':
        return renderPlaceholder('All Payslips', 'View and manage all employee payslips');
      case 'generate':
        return renderPlaceholder('Generate Payslips', 'Create new payslips for employees');
      case 'ctc':
        return renderPlaceholder('CTC Management', 'Manage employee compensation packages');
      default:
        return renderOverview();
    }
  };

  const availableTabs = getAvailableTabs();

  return (
    <div className="simple-unified-payroll-management">
      {/* Tab Navigation */}
      <div className="unified-tab-navigation" style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '2rem',
        borderBottom: '1px solid #e2e8f0',
        paddingBottom: '1rem'
      }}>
        {availableTabs.map(tab => (
          <button
            key={tab.id}
            className={`unified-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1rem',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              background: activeTab === tab.id ? '#3b82f6' : 'transparent',
              color: activeTab === tab.id ? 'white' : '#64748b',
              transition: 'all 0.2s'
            }}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="unified-tab-content">
        {renderTabContent()}
      </div>
    </div>
  );
}

export default SimpleUnifiedPayrollManagement;
