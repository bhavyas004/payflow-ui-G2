import React, { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import SummaryCard from "../components/SummaryCard";
import QuickActions from "../components/QuickActions";
import axios from "axios";
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

const ManagerDashboard = () => {
  const [stats, setStats] = useState({ ACTIVE: 0, INACTIVE: 0, RECENT: 0 });
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState({ name: 'Manager' });
  const navigate = useNavigate();

  useEffect(() => {
    // Extract user info from JWT token
    const token = localStorage.getItem('jwtToken');
    if (token) {
      const payload = parseJwt(token);
      setUser({ name: payload.sub || payload.username || 'User' });
    }
    
    async function fetchStatsAndEmployees() {
      try {
        setLoading(true);
        const token = localStorage.getItem('jwtToken');
        
        // Fetch statistics from the correct endpoints
        const [totalEmpRes, activeEmpRes, inactiveEmpRes, empListRes] = await Promise.all([
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
        const recentEmployees = (empListRes.data || []).filter(emp => {
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
        
        setEmployees(empListRes.data || []);
        console.log('Manager Dashboard - Employees fetched:', empListRes.data);
        console.log('Manager Dashboard - Recent employees this month:', recentEmployees.length);
      } catch (error) {
        console.error('Error fetching manager dashboard data:', error);
        setStats({ TOTAL: 0, ACTIVE: 0, INACTIVE: 0, RECENT: 0 });
        setEmployees([]);
      } finally {
        setLoading(false);
      }
    }
    fetchStatsAndEmployees();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('jwtToken');
    navigate('/');
  };

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">PayFlow</div>
        <nav>
          <ul>
            <li className="active"><a href="/manager-dashboard">🏠 Dashboard</a></li>
            <li><a href="/hr-employees">👥 Employees</a></li>
            <li><a href="/onboarding">📝 Onboarding</a></li>
            <li><button className="logout-btn" onClick={handleLogout}>🚪 Logout</button></li>
          </ul>
        </nav>
      </aside>
      <div className="main-content">
        <Topbar title="Manager Dashboard" user={user} />
        <div className="summary-cards-row">
          <SummaryCard 
            title="Total Employees" 
            value={loading ? '...' : stats.TOTAL} 
          />
          <SummaryCard 
            title="Active Employees" 
            value={loading ? '...' : stats.ACTIVE} 
          />
          <SummaryCard 
            title="Inactive Employees" 
            value={loading ? '...' : stats.INACTIVE} 
          />
          <SummaryCard 
            title="Recently Onboarded" 
            value={loading ? '...' : stats.RECENT} 
          />
        </div>
        <QuickActions
          onAddEmployee={() => {}}
          onImportBulk={() => {}}
          onAddHRManager={() => {}}
        />
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
  );
};

export default ManagerDashboard;