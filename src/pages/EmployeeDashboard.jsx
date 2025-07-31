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
          <li className={active === 'leave-requests' ? 'active' : ''}><a href="/employee-leave-requests">📋 My Leave Requests</a></li>
          <li className={active === 'leave-request' ? 'active' : ''}><a href="/employee-leave-request">📝 Apply Leave</a></li>
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
    totalLeaves: 12, 
    remainingLeaves: 10, 
    usedLeaves: 2, 
    todaysDate: new Date().toLocaleDateString()
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
        const payload = parseJwt(token);
        const employeeId = payload.employeeId;
        
        if (employeeId) {
          // Fetch comprehensive leave calculations for the employee
          try {
            const leaveCalcRes = await axios.get(`/payflowapi/leave-requests/calculations/employee/${employeeId}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            
            if (leaveCalcRes.data.success) {
              const leaveData = leaveCalcRes.data.data;
              setStats({
                totalLeaves: leaveData.totalLeavesPerYear || 12,
                remainingLeaves: leaveData.remainingLeaves || 0,
                usedLeaves: leaveData.usedLeaves || 0,
                pendingLeaves: leaveData.pendingLeaves || 0,
                todaysDate: new Date().toLocaleDateString(),
                // Additional stats for potential future use
                totalRequests: leaveData.totalRequests || 0,
                approvedRequests: leaveData.approvedRequests || 0,
                pendingRequests: leaveData.pendingRequests || 0,
                rejectedRequests: leaveData.rejectedRequests || 0
              });
            } else {
              throw new Error('Failed to fetch leave calculations');
            }
          } catch (leaveError) {
            console.log('Leave calculations not available, trying basic balance endpoint');
            
            // Fallback to basic leave balance endpoint
            try {
              const leaveBalanceRes = await axios.get(`/payflowapi/leave-requests/balance/${employeeId}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              
              const leaveBalance = leaveBalanceRes.data;
              setStats({
                totalLeaves: leaveBalance.total || 12,
                remainingLeaves: leaveBalance.remaining || 0,
                usedLeaves: leaveBalance.used || 0,
                pendingLeaves: 0,
                todaysDate: new Date().toLocaleDateString()
              });
            } catch (balanceError) {
              console.log('Using default leave values');
              setStats({
                totalLeaves: 12,
                remainingLeaves: 12,
                usedLeaves: 0,
                pendingLeaves: 0,
                todaysDate: new Date().toLocaleDateString()
              });
            }
          }
        } else {
          // Fallback if no employeeId
          setStats({
            totalLeaves: 12,
            remainingLeaves: 12,
            usedLeaves: 0,
            pendingLeaves: 0,
            todaysDate: new Date().toLocaleDateString()
          });
        }
        
        console.log('Employee Dashboard - User data:', {
          name: user.name,
          employeeId: user.employeeId,
          status: user.status
        });
      } catch (error) {
        console.error('Error fetching employee dashboard data:', error);
        setStats({ 
          totalLeaves: 12, 
          remainingLeaves: 12, 
          usedLeaves: 0, 
          todaysDate: new Date().toLocaleDateString() 
        });
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
              <button 
                className="view-leaves-btn" 
                onClick={() => navigate('/employee-leave-requests')}
                title="View My Leave Requests"
              >
                📋 My Leave Requests
              </button>
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
              title="Total Leaves" 
              value={loading ? '...' : stats.totalLeaves} 
              actionable 
              onClick={() => navigate('/employee-leave-requests')} 
            />
            <SummaryCard 
              title="Used Leaves" 
              value={loading ? '...' : stats.usedLeaves} 
              actionable 
              onClick={() => navigate('/employee-leave-requests')} 
            />
            <SummaryCard 
              title="Remaining Leaves" 
              value={loading ? '...' : stats.remainingLeaves} 
              actionable 
              onClick={() => navigate('/employee-leave-requests')} 
            />
            <SummaryCard 
              title="Today's Date" 
              value={stats.todaysDate} 
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