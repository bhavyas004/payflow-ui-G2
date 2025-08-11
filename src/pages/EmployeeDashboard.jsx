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

// Employee Navigation Content
function EmployeeNavigation({ active, onLogout }) {
  return (
    <ul>
      <li className={active === 'dashboard' ? 'active' : ''}><a href="/employee-dashboard">🏠 Dashboard</a></li>
      <li className={active === 'leave-requests' ? 'active' : ''}><a href="/employee-leave-requests">📋 My Leave Requests</a></li>
      <li className={active === 'leave-request' ? 'active' : ''}><a href="/employee-leave-request">📝 Apply Leave</a></li>
      <li className={active === 'payroll' ? 'active' : ''}><a href="/employee-payroll">💰 Payroll</a></li>
      <li><button className="btn btn-ghost btn-sm w-full" onClick={onLogout}>🚪 Logout</button></li>
    </ul>
  );
}

export default function EmployeeDashboard() {
  const [user, setUser] = useState({ name: 'Employee' });
  const navigate = useNavigate();
  const sidebarRef = useRef(null);
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
    const token = sessionStorage.getItem('jwtToken');
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
        const token = sessionStorage.getItem('jwtToken');
        const payload = parseJwt(token);
        const employeeId = payload.employeeId;
        
        console.log('Fetching data for employee ID:', employeeId);
        
        if (employeeId) {
          try {
            // Use the new calculations endpoint
            const leaveCalcRes = await axios.get(`/payflowapi/leave-requests/calculations/employee/${employeeId}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            
            console.log('Leave calculations response:', leaveCalcRes.data);
            
            if (leaveCalcRes.data.success) {
              const leaveData = leaveCalcRes.data.data;
              setStats({
                totalLeaves: leaveData.totalLeavesPerYear || 12,
                remainingLeaves: leaveData.remainingLeaves || 12,
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
            console.error('Leave calculations error:', leaveError);
            
            // Fallback to simple balance endpoint
            try {
              const leaveBalanceRes = await axios.get(`/payflowapi/leave-requests/balance/simple/${employeeId}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              
              console.log('Simple balance response:', leaveBalanceRes.data);
              
              setStats({
                totalLeaves: leaveBalanceRes.data.total || 12,
                remainingLeaves: leaveBalanceRes.data.remaining || 12,
                usedLeaves: leaveBalanceRes.data.used || 0,
                pendingLeaves: leaveBalanceRes.data.pending || 0,
                todaysDate: new Date().toLocaleDateString()
              });
              
            } catch (balanceError) {
              console.error('Balance endpoint error:', balanceError);
              
              // Final fallback: use leave requests to calculate manually
              try {
                const leaveRequestsRes = await axios.get(`/payflowapi/leave-requests/employee/${employeeId}`, {
                  headers: { Authorization: `Bearer ${token}` }
                });
                
                if (leaveRequestsRes.data.success) {
                  const allRequests = leaveRequestsRes.data.data || [];
                  
                  // Calculate manually
                  const approvedRequests = allRequests.filter(req => req.status?.toLowerCase() === 'approved');
                  const pendingRequests = allRequests.filter(req => req.status?.toLowerCase() === 'pending');
                  
                  const usedDays = approvedRequests.reduce((total, req) => total + (req.totalDays || 0), 0);
                  const pendingDays = pendingRequests.reduce((total, req) => total + (req.totalDays || 0), 0);
                  
                  setStats({
                    totalLeaves: 12,
                    remainingLeaves: Math.max(0, 12 - usedDays),
                    usedLeaves: usedDays,
                    pendingLeaves: pendingDays,
                    todaysDate: new Date().toLocaleDateString(),
                    totalRequests: allRequests.length,
                    approvedRequests: approvedRequests.length,
                    pendingRequests: pendingRequests.length,
                    rejectedRequests: allRequests.filter(req => req.status?.toLowerCase() === 'rejected').length
                  });
                } else {
                  throw new Error('No leave data available');
                }
              } catch (finalError) {
                console.error('All endpoints failed:', finalError);
                setStats({
                  totalLeaves: 12,
                  remainingLeaves: 12,
                  usedLeaves: 0,
                  pendingLeaves: 0,
                  todaysDate: new Date().toLocaleDateString()
                });
              }
            }
          }
        } else {
          console.error('No employee ID found in token');
          setStats({
            totalLeaves: 12,
            remainingLeaves: 12,
            usedLeaves: 0,
            pendingLeaves: 0,
            todaysDate: new Date().toLocaleDateString()
          });
        }
        
      } catch (error) {
        console.error('Error fetching employee dashboard data:', error);
        setStats({ 
          totalLeaves: 12, 
          remainingLeaves: 12, 
          usedLeaves: 0, 
          pendingLeaves: 0,
          todaysDate: new Date().toLocaleDateString() 
        });
      } finally {
        setLoading(false);
      }
    }
    
    fetchEmployeeData();
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem('jwtToken');
    navigate('/employee-login');
  };

  return (
    <div className="dashboard-layout">
      <CollapsibleSidebar ref={sidebarRef} logo="PayFlow">
        <EmployeeNavigation active="dashboard" onLogout={handleLogout} />
      </CollapsibleSidebar>
      <div className="main-content">
        <Topbar
          title="Employee Dashboard"
          user={user}
          onLogout={handleLogout}
          sidebarRef={sidebarRef}
        />
        <div className="p-6">
          {/* Welcome Section */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">👋 Welcome, {user.name}!</h1>
              <p className="text-gray-600">Here's your dashboard overview for today.</p>
            </div>
            <div className="flex items-center gap-4 mt-4 md:mt-0">
              <button 
                className="btn btn-primary" 
                onClick={() => navigate('/employee-leave-requests')}
                title="View My Leave Requests"
              >
                📋 My Leave Requests
              </button>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Status:</span>
                <span className={`badge ${user.status?.toLowerCase() === 'active' ? 'badge-success' : 'badge-warning'}`}>
                  {user.status || 'ACTIVE'}
                </span>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="mb-8">
            <div className="summary-cards-container">
              <div className="summary-cards-grid">
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
            </div>
          </div>
          
          {/* Dashboard Widgets */}
          <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
            <MiniCalendar events={events} />
          </div>
        </div>
      </div>
    </div>
  );
}