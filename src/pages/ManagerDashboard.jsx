import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Topbar from '../components/Topbar';
import SummaryCard from '../components/SummaryCard';
import QuickActions from '../components/QuickActions';
import MiniCalendar from '../components/MiniCalendar';
import CollapsibleSidebar from '../components/CollapsibleSidebar';
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

// Manager Navigation Content
function ManagerNavigation({ active }) {
  return (
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
  );
}
export default function ManagerDashboard() {
  const [user, setUser] = useState({ name: 'Manager Name' });
  const navigate = useNavigate();
  const sidebarRef = useRef(null);
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
    const token = sessionStorage.getItem('jwtToken');
    if (token) {
      const payload = parseJwt(token);
      setUser({ name: payload.sub || payload.username || 'User' });
    }
    
    async function fetchStatsAndData() {
      try {
        setLoading(true);
        const token = sessionStorage.getItem('jwtToken');
        
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
    sessionStorage.removeItem('jwtToken');
    navigate('/');
  };

  return (
    <div className="dashboard-layout">
      <CollapsibleSidebar ref={sidebarRef} logo="PayFlow Manager">
        <ManagerNavigation active="dashboard" />
      </CollapsibleSidebar>
      <div className="main-content">
        <Topbar
          title="Manager Dashboard"
          user={user}
          onLogout={handleLogout}
          sidebarRef={sidebarRef}
        />
        <div className="p-6">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">👋 Welcome, Manager!</h1>
            <p className="text-gray-600">Here's your team overview and pending actions.</p>
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
            </div>
          </div>
          
          {/* Dashboard Widgets */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <MiniCalendar events={events} />
            
            {/* Leave Management Card */}
            <div className="card">
              <div className="card-content">
                <h3 className="font-semibold mb-4">Leave Management</h3>
                <div className="flex flex-col gap-3">
                  <button 
                    className="btn btn-warning flex justify-between items-center" 
                    onClick={() => navigate('/manager-leave-requests?status=PENDING')}
                  >
                    <span>Pending Requests</span>
                    <span className="badge badge-neutral">{leaveStats.PENDING || 0}</span>
                  </button>
                  <button 
                    className="btn btn-success flex justify-between items-center" 
                    onClick={() => navigate('/manager-leave-requests?status=APPROVED')}
                  >
                    <span>Approved</span>
                    <span className="badge badge-neutral">{leaveStats.APPROVED || 0}</span>
                  </button>
                  <button 
                    className="btn btn-error flex justify-between items-center" 
                    onClick={() => navigate('/manager-leave-requests?status=REJECTED')}
                  >
                    <span>Rejected</span>
                    <span className="badge badge-neutral">{leaveStats.REJECTED || 0}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="card cursor-pointer" onClick={() => navigate('/manager-employees')}>
              <div className="card-content text-center">
                <div className="text-4xl mb-4">👥</div>
                <h3 className="font-semibold mb-2">My Team</h3>
                <p className="text-gray-600">View and manage your team members</p>
              </div>
            </div>

            <div className="card cursor-pointer" onClick={() => navigate('/manager-onboarding')}>
              <div className="card-content text-center">
                <div className="text-4xl mb-4">📝</div>
                <h3 className="font-semibold mb-2">Onboarding</h3>
                <p className="text-gray-600">Onboard new team members</p>
              </div>
            </div>

            <div className="card cursor-pointer" onClick={() => navigate('/manager-leave-requests')}>
              <div className="card-content text-center">
                <div className="text-4xl mb-4">📅</div>
                <h3 className="font-semibold mb-2">Leave Requests</h3>
                <p className="text-gray-600">Review and approve leave requests</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}