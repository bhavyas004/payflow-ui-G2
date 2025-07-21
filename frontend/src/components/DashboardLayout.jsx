// src/components/DashboardLayout.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/App.css';

function DashboardLayout({ children, role }) {
  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <h3>{role} Panel</h3>
        <ul>
          {role === 'Admin' && (
            <>
              <li><Link to="/create-user">Create User</Link></li>
            </>
          )}
          {(role === 'HR' || role === 'Manager') && (
            <>
              <li><Link to="/onboard">Onboard Employee</Link></li>
            </>
          )}
        </ul>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <span>Payflow AI</span>
          <button onClick={() => window.location.href = '/'}>Logout</button>
        </header>
        <section className="content-area">{children}</section>
      </main>
    </div>
  );
}

export default DashboardLayout;
