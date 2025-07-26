import React, { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import SummaryCard from "../components/SummaryCard";
import QuickActions from "../components/QuickActions";
import axios from "axios";
import '../styles/App.css';

const ManagerDashboard = () => {
  const [stats, setStats] = useState({ ACTIVE: 0, INACTIVE: 0 });
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user] = useState({ name: 'Manager' });
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchStatsAndEmployees() {
      try {
        const token = localStorage.getItem('jwtToken');
        const statsRes = await axios.get('/payflowapi/employee/stats', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStats(statsRes.data);
        const empRes = await axios.get('/payflowapi/employee/all', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setEmployees(empRes.data);
      } catch (error) {
        setStats({ ACTIVE: 0, INACTIVE: 0 });
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
            <li><a href="/employees">👥 Employees</a></li>
            <li><a href="/onboarding">📝 Onboarding</a></li>
            <li><button className="logout-btn" onClick={handleLogout}>🚪 Logout</button></li>
          </ul>
        </nav>
      </aside>
      <div className="main-content">
        <Topbar title="Manager Dashboard" user={user} />
        <div className="summary-cards-row">
          <SummaryCard title="Active" value={stats.ACTIVE} />
          <SummaryCard title="Inactive" value={stats.INACTIVE} />
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
                <th>Total Experience</th>
                <th>Status</th>
                <th>Created By</th>
              </tr>
            </thead>
            <tbody>
              {employees.map(emp => (
                <tr key={emp.id}>
                  <td>{emp.fullName}</td>
                  <td>{emp.age}</td>
                  <td>{emp.totalExperience}</td>
                  <td>{emp.status}</td>
                  <td>{emp.createdBy?.username || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;