import React from 'react';
import '../styles/App.css';

function HRSidebar({ active }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">PayFlow</div>
      <nav>
        <ul>
          <li className={active === 'dashboard' ? 'active' : ''}>
            <a href="/hr-dashboard">🏠 Dashboard</a>
          </li>
          <li className={active === 'employees' ? 'active' : ''}>
            <a href="/hr-employees">👥 Employees</a>
          </li>
          <li className={active === 'onboarding' ? 'active' : ''}>
            <a href="/onboarding">📝 Onboarding</a>
          </li>
          {/* New Payroll Menu Items */}
          <li className={active === 'payroll' ? 'active' : ''}>
            <a href="/hr-payroll">💰 Payroll</a>
          </li>
          <li className={active === 'ctc' ? 'active' : ''}>
            <a href="/ctc-management">📊 CTC Management</a>
          </li>
          <li className={active === 'payslips' ? 'active' : ''}>
            <a href="/payslip-view">📄 Payslips</a>
          </li>
        </ul>
      </nav>
    </aside>
  );
}

export default HRSidebar;