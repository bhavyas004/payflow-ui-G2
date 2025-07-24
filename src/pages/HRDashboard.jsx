import React, { useEffect, useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
import axios from "axios";
import '../styles/App.css';

const HRDashboard = () => {
  const [stats, setStats] = useState({ ACTIVE: 0, INACTIVE: 0 });
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <DashboardLayout role="HR" title="HR / Manager Dashboard">
      <div className="dashboard-content">
        <h2>Employee Onboarding Stats</h2>
        <div className="card-container">
          <AnimatedCard title="Active" count={stats.ACTIVE} loading={loading} color="#2563eb" />
          <AnimatedCard title="Inactive" count={stats.INACTIVE} loading={loading} color="#f44336" />
        </div>
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
    </DashboardLayout>
  );
};

function AnimatedCard({ title, count, loading, color }) {
  return (
    <div className="animated-card" style={{ borderColor: color }}>
      <h3>{title}</h3>
      <div className={`count ${loading ? 'loading' : 'loaded'}`}>{loading ? '...' : count}</div>
    </div>
  );
}

export default HRDashboard;
