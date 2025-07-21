// src/pages/AdminDashboard.jsx
import React from 'react';
import DashboardLayout from '../components/DashboardLayout';

function AdminDashboard() {
  return (
    <DashboardLayout role="Admin">
      <div className="dashboard-content">
        <h2>Welcome, Admin</h2>
        <p>Select an action from the sidebar.</p>
      </div>
    </DashboardLayout>
  );
}

export default AdminDashboard;
