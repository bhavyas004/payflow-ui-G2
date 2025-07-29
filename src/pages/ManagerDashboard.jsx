import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Topbar from '../components/Topbar';
import SummaryCard from '../components/SummaryCard';
import QuickActions from '../components/QuickActions';
import MiniCalendar from '../components/MiniCalendar';
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

// Custom Sidebar for HR Dashboard
function HRSidebar({ active }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">PayFlow</div>
      <nav>
        <ul>
          <li className={active === 'dashboard' ? 'active' : ''}><a href="/hr-dashboard">🏠 Dashboard</a></li>
          <li className={active === 'employees' ? 'active' : ''}><a href="/hr-employees">👥 Employees</a></li>
          <li className={active === 'onboarding' ? 'active' : ''}><a href="/onboarding">📝 Onboarding</a></li>
        </ul>
      </nav>
    </aside>
  );
}

export default function HRDashboard() {
  const [user, setUser] = useState({ name: 'HR Name' });
  const navigate = useNavigate();
  const [stats, setStats] = useState({ TOTAL: 0, ACTIVE: 0, INACTIVE: 0, RECENT: 0 });
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [events] = useState([
    { date: '2025-07-10', title: 'John D. Birthday' },
    { date: '2025-07-12', title: 'Probation Review: Jane S.' },
    { date: '2025-07-15', title: 'Onboarding: New Hires' },
  ]);

  useEffect(() => {
    // Extract user info from JWT token
    const token = localStorage.getItem('jwtToken');
    if (token) {
      const payload = parseJwt(token);
      setUser({ name: payload.sub || payload.username || 'User' });
    }
    
    async function fetchStatsAndData() {
      try {
        setLoading(true);
        const token = localStorage.getItem('jwtToken');
        
        // Fetch statistics and employees
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

        setEmployees(employeesRes.data || []);
      } catch (error) {
        console.error('Error fetching HR dashboard data:', error);
        setStats({ TOTAL: 0, ACTIVE: 0, INACTIVE: 0, RECENT: 0 });
        setEmployees([]);
      } finally {
        setLoading(false);
      }
    }
    fetchStatsAndData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('jwtToken');
    navigate('/');
  };

  return (
    <div className="dashboard-layout">
      <HRSidebar active="dashboard" />
      <div className="main-content">
        <Topbar
          title="HR Dashboard"
          user={user}
          onLogout={handleLogout}
        />
        <div className="dashboard-home">
          {/* Summary Cards */}
          <div className="summary-cards-row">
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
          <div className="dashboard-widgets-row">
            <MiniCalendar events={events} />
            <QuickActions
              onAddEmployee={() => navigate('/onboarding')}
              onImportBulk={() => {}}
              onAddHRManager={() => {}}
            />
          </div>
          <h3 style={{marginTop: '2rem'}}>Onboarded Employees</h3>
          <div className="table-container">
            <table className="onboard-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Age</th>
                  <th>Email</th>
                  <th>Total Experience</th>
                  <th>Date Joined</th>
                  <th>Status</th>
                  <th>Created By</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" style={{textAlign: 'center', padding: '2rem'}}>Loading employees...</td>
                  </tr>
                ) : employees.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{textAlign: 'center', padding: '2rem'}}>No employees found</td>
                  </tr>
                ) : (
                  employees.map(emp => (
                    <tr key={emp.id}>
                      <td>{emp.fullName}</td>
                      <td>{emp.age}</td>
                      <td>{emp.email}</td>
                      <td>{emp.totalExperience || 'N/A'}</td>
                      <td>
                        {emp.createdAt ? new Date(emp.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td>
                        <span className={`status-badge ${emp.status?.toLowerCase()}`}>
                          {emp.status}
                        </span>
                      </td>
                      <td>{emp.createdBy || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}