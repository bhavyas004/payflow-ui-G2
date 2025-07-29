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

// Custom Sidebar for Employee Dashboard
function EmployeeSidebar({ active }) {
  const navigate = useNavigate();
  
  const handleLogout = () => {
    localStorage.removeItem('jwtToken');
    navigate('/employee-login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">PayFlow</div>
      <nav>
        <ul>
          <li className={active === 'dashboard' ? 'active' : ''}><a href="/employee-dashboard">🏠 Dashboard</a></li>
          <li className={active === 'leave-request' ? 'active' : ''}><a href="/employee-leave-request">📝 Leave Request</a></li>
          <li className={active === 'payroll' ? 'active' : ''}><a href="/employee-payroll">💰 Payroll</a></li>
          <li><button className="logout-btn" onClick={handleLogout}>🚪 Logout</button></li>
        </ul>
      </nav>
    </aside>
  );
}

export default function EmployeeDashboard() {
  const [user, setUser] = useState({ name: 'Employee' });
  const navigate = useNavigate();
  const [stats, setStats] = useState({ 
    workDays: 0, 
    leavesTaken: 0, 
    pendingTasks: 0, 
    upcomingEvents: 0 
  });
  const [loading, setLoading] = useState(true);
  const [events] = useState([
    { date: '2025-07-30', title: 'Team Meeting' },
    { date: '2025-08-01', title: 'Project Deadline' },
    { date: '2025-08-05', title: 'Performance Review' },
  ]);

  useEffect(() => {
    // Extract user info from JWT token
    const token = localStorage.getItem('jwtToken');
    if (token) {
      const payload = parseJwt(token);
      setUser({ 
        name: payload.fullName || payload.sub || payload.username || 'Employee',
        employeeId: payload.employeeId,
        status: payload.status
      });
    }
    
    async function fetchEmployeeData() {
      try {
        setLoading(true);
        const token = localStorage.getItem('jwtToken');
        
        // Mock data for employee dashboard - you can replace with actual API calls
        // For now, using static data since employee-specific endpoints don't exist yet
        
        // Calculate work days this month (example calculation)
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        const workDays = Math.floor((today - firstDay) / (1000 * 60 * 60 * 24)) + 1;
        
        setStats({
          workDays: workDays,
          leavesTaken: 2, // Mock data
          pendingTasks: 5, // Mock data
          upcomingEvents: events.length
        });
        
        console.log('Employee Dashboard - User data:', {
          name: user.name,
          employeeId: user.employeeId,
          status: user.status
        });
      } catch (error) {
        console.error('Error fetching employee dashboard data:', error);
        setStats({ workDays: 0, leavesTaken: 0, pendingTasks: 0, upcomingEvents: 0 });
      } finally {
        setLoading(false);
      }
    }
    fetchEmployeeData();
  }, []);

  return (
    <div className="dashboard-layout">
      <EmployeeSidebar active="dashboard" />
      <div className="main-content">
        <Topbar
          title="Employee Dashboard"
          user={user}
          onLogout={() => {
            localStorage.removeItem('jwtToken');
            navigate('/employee-login');
          }}
        />
        <div className="dashboard-home">
          {/* Welcome Message */}
          <div className="admin-header-row">
            <div className="welcome-message">👋 Welcome, {user.name}!</div>
            <div className="header-right">
              <div className="employee-status">
                Status: <span className={`status-badge ${user.status?.toLowerCase()}`}>
                  {user.status || 'ACTIVE'}
                </span>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="summary-cards-row">
            <SummaryCard 
              title="Work Days This Month" 
              value={loading ? '...' : stats.workDays} 
              actionable 
              onClick={() => navigate('/employee-attendance')} 
            />
            <SummaryCard 
              title="Leaves Taken" 
              value={loading ? '...' : stats.leavesTaken} 
              actionable 
              onClick={() => navigate('/employee-attendance')} 
            />
            <SummaryCard 
              title="Pending Tasks" 
              value={loading ? '...' : stats.pendingTasks} 
              actionable 
              onClick={() => navigate('/employee-tasks')} 
            />
            <SummaryCard 
              title="Upcoming Events" 
              value={loading ? '...' : stats.upcomingEvents} 
              actionable 
              onClick={() => {}} 
            />
          </div>
          
          <div className="dashboard-widgets-row">
            <MiniCalendar events={events} />
            
          </div>
        </div>
      </div>
    </div>
  );
}