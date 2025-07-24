// src/pages/AdminDashboard.jsx
import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import axios from 'axios';
import '../styles/App.css';

function AdminDashboard() {
  const [counts, setCounts] = useState({ HR: 0, MANAGER: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCounts() {
      try {
        const token = localStorage.getItem('jwtToken');
        const response = await axios.get('/payflowapi/user/counts', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setCounts(response.data);
      } catch (error) {
        setCounts({ HR: 0, MANAGER: 0 });
      } finally {
        setLoading(false);
      }
    }
    fetchCounts();
  }, []);

  return (
    <DashboardLayout role="Admin">
      <div className="dashboard-content">
        <h2>Welcome, Admin</h2>
        <p>Select an action from the sidebar.</p>
        <div className="card-container">
          <AnimatedCard title="HRs" count={counts.HR} loading={loading} color="#2563eb" />
          <AnimatedCard title="Managers" count={counts.MANAGER} loading={loading} color="#10b981" />
        </div>
      </div>
    </DashboardLayout>
  );
}

function AnimatedCard({ title, count, loading, color }) {
  return (
    <div className="animated-card" style={{ borderColor: color }}>
      <h3>{title}</h3>
      <div className={`count ${loading ? 'loading' : 'loaded'}`}>{loading ? '...' : count}</div>
    </div>
  );
}

export default AdminDashboard;
