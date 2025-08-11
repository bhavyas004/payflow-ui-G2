import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Topbar from '../components/Topbar';
import SummaryCard from '../components/SummaryCard';
import QuickActions from '../components/QuickActions';
import MiniCalendar from '../components/MiniCalendar';
import CollapsibleSidebar from '../components/CollapsibleSidebar';
import axios from 'axios';
import '../styles/App.css';
import '../styles/Payroll.css'

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


function HRNavigation({ active }) {
  return (
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
  );
}

export default function HRDashboard() {
  const [user, setUser] = useState({ name: 'HR Name' });
  const navigate = useNavigate();
  const sidebarRef = useRef(null);
  const [stats, setStats] = useState({ TOTAL: 0, ACTIVE: 0, INACTIVE: 0, RECENT: 0 });
  const [loading, setLoading] = useState(true);
  const [events] = useState([
    { date: '2025-07-10', title: 'John D. Birthday' },
    { date: '2025-07-12', title: 'Probation Review: Jane S.' },
    { date: '2025-07-15', title: 'Onboarding: New Hires' },
  ]);

  useEffect(() => {
    // Extract user info from JWT token
    const token = sessionStorage.getItem('jwtToken');
    if (token) {
      const payload = parseJwt(token);
      setUser({ name: payload.sub || payload.username || 'User' });
    }
    
    async function fetchStatsAndData() {
      try {
        setLoading(true);
        const token = sessionStorage.getItem('jwtToken');
        
        // Fetch statistics from the same endpoints as Manager Dashboard
        const [totalEmpRes, activeEmpRes, inactiveEmpRes, employeesRes] = await Promise.all([
          axios.get('/payflowapi/stats/employees/total', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get('/payflowapi/stats/employees/active', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get('/payflowapi/stats/employees/inactive', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get('/payflowapi/onboard-employee/employees', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        
        // Calculate recently onboarded employees (this month)
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const recentEmployees = (employeesRes.data || []).filter(emp => {
          if (emp.createdAt) {
            const empDate = new Date(emp.createdAt);
            return empDate.getMonth() === currentMonth && empDate.getFullYear() === currentYear;
          }
          return false;
        });
        
        setStats({
          TOTAL: totalEmpRes.data.totalEmployees || 0,
          ACTIVE: activeEmpRes.data.totalActiveEmployees || 0,
          INACTIVE: inactiveEmpRes.data.totalInactiveEmployees || 0,
          RECENT: recentEmployees.length
        });
        
        console.log('HR Dashboard - Stats fetched:', {
          total: totalEmpRes.data.totalEmployees,
          active: activeEmpRes.data.totalActiveEmployees,
          inactive: inactiveEmpRes.data.totalInactiveEmployees,
          recent: recentEmployees.length
        });
      } catch (error) {
        console.error('Error fetching HR dashboard data:', error);
        setStats({ TOTAL: 0, ACTIVE: 0, INACTIVE: 0, RECENT: 0 });
      } finally {
        setLoading(false);
      }
    }
    fetchStatsAndData();
  }, []);

  return (
    <div className="dashboard-layout">
      <CollapsibleSidebar ref={sidebarRef} logo="PayFlow">
        <HRNavigation active="dashboard" />
      </CollapsibleSidebar>
      <div className="main-content">
        <Topbar
          title="HR Dashboard"
          user={user}
          onLogout={() => {
            sessionStorage.removeItem('jwtToken');
            navigate('/');
          }}
          sidebarRef={sidebarRef}
        />
        <div className="p-6">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">👋 Welcome back!</h1>
            <p className="text-gray-600">Here's what's happening with your team today.</p>
          </div>

          {/* Summary Cards */}
          <div className="mb-8">
            <div className="summary-cards-container">
              <div className="summary-cards-grid">
                <SummaryCard 
                  title="Total Employees" 
                  value={loading ? '...' : stats.TOTAL} 
                  actionable 
                  onClick={() => navigate('/hr-employees')} 
                />
                <SummaryCard 
                  title="Active Employees" 
                  value={loading ? '...' : stats.ACTIVE} 
                  actionable 
                  onClick={() => navigate('/hr-employees')} 
                />
                <SummaryCard 
                  title="Inactive Employees" 
                  value={loading ? '...' : stats.INACTIVE} 
                  actionable 
                  onClick={() => navigate('/hr-employees')} 
                />
                <SummaryCard 
                  title="Recently Onboarded" 
                  value={loading ? '...' : stats.RECENT} 
                  actionable 
                  onClick={() => navigate('/hr-employees')} 
                />
              </div>
            </div>
          </div>

          {/* Dashboard Widgets */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MiniCalendar events={events} />
            <QuickActions
              onAddEmployee={() => navigate('/onboarding')}
              onImportBulk={() => {}}
              onAddHRManager={() => {}}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
