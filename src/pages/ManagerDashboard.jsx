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

// Custom Sidebar for Manager Dashboard
function ManagerSidebar({ active }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">PayFlow Manager</div>
      <nav>
        <ul>
          <li className={active === 'dashboard' ? 'active' : ''}>
            <a href="/manager-dashboard">🏠 Dashboard</a>
          </li>
          <li className={active === 'employees' ? 'active' : ''}>
            <a href="/manager-employees">👥 Employees</a>
          </li>
          <li className={active === 'onboarding' ? 'active' : ''}>
            <a href="/manager-onboarding">📝 Onboarding</a>
          </li>
          <li className={active === 'leave-requests' ? 'active' : ''}>
            <a href="/manager-leave-requests">📅 Leave Requests</a>
          </li>
        </ul>
      </nav>
    </aside>
  );
}
export default function ManagerDashboard() {
  const [user, setUser] = useState({ name: 'Manager Name' });
  const navigate = useNavigate();
  const [stats, setStats] = useState({ TOTAL: 0, ACTIVE: 0, INACTIVE: 0, RECENT: 0 });
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [leaveStats, setLeaveStats] = useState({ PENDING: 0, APPROVED: 0, REJECTED: 0 });
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
        
        // Fetch basic statistics and employees first
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
        
        // Fetch leave statistics separately with error handling
        try {
          const leaveStatsRes = await axios.get('/payflowapi/leave-requests/manager/stats', {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          console.log('Leave stats response:', leaveStatsRes.data);
          
          if (leaveStatsRes.data && leaveStatsRes.data.success) {
            setLeaveStats(leaveStatsRes.data.data);
          } else {
            console.warn('Leave stats API did not return success:', leaveStatsRes.data);
            setLeaveStats({ PENDING: 0, APPROVED: 0, REJECTED: 0 });
          }
        } catch (leaveError) {
          console.error('Error fetching leave stats:', leaveError);
          console.error('Leave stats error response:', leaveError.response?.data);
          setLeaveStats({ PENDING: 0, APPROVED: 0, REJECTED: 0 });
        }
        
      } catch (error) {
        console.error('Error fetching Manager dashboard data:', error);
        setStats({ TOTAL: 0, ACTIVE: 0, INACTIVE: 0, RECENT: 0 });
        setEmployees([]);
        setLeaveStats({ PENDING: 0, APPROVED: 0, REJECTED: 0 });
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
      <ManagerSidebar active="dashboard" />
      <div className="main-content">
        <Topbar
          title="Manager Dashboard"
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
              title="Pending Leaves" 
              value={loading ? '...' : leaveStats.PENDING} 
              actionable 
              onClick={() => navigate('/manager-leave-requests')} 
            />
            <SummaryCard 
              title="Recently Onboarded" 
              value={loading ? '...' : stats.RECENT} 
              actionable 
              onClick={() => navigate('/hr-employees')} 
            />
          </div>
          
          {/* Leave Request Quick Actions */}
          <div className="dashboard-widgets-row">
            <MiniCalendar events={events} />
            <div className="leave-quick-actions">
              <h3>Leave Management</h3>
              <div className="leave-action-buttons">
                <button 
                  className="action-btn pending" 
                  onClick={() => navigate('/manager-leave-requests?status=PENDING')}
                >
                  Pending Requests ({leaveStats.PENDING || 0})
                </button>
                <button 
                  className="action-btn approved" 
                  onClick={() => navigate('/manager-leave-requests?status=APPROVED')}
                >
                  Approved ({leaveStats.APPROVED || 0})
                </button>
                <button 
                  className="action-btn rejected" 
                  onClick={() => navigate('/manager-leave-requests?status=REJECTED')}
                >
                  Rejected ({leaveStats.REJECTED || 0})
                </button>
              </div>
            </div>
          </div>
          <div className="quick-action-card" onClick={() => navigate('/manager-employees')}>
  <div className="action-icon">👥</div>
  <h3>My Team</h3>
  <p>View and manage your team members</p>
</div>

<div className="quick-action-card" onClick={() => navigate('/manager-onboarding')}>
  <div className="action-icon">📝</div>
  <h3>Add Team Member</h3>
  <p>Onboard new employees to your team</p>
</div>
          <h3 style={{marginTop: '2rem'}}>My Team Members</h3>
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
                    <td colSpan="7" style={{textAlign: 'center', padding: '2rem'}}>No team members found</td>
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