import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../styles/App.css';

const navItems = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Employees', path: '/employees' },
  { label: 'Onboarding', path: '/onboarding' },
  // HR-specific links
  { label: 'HR Employee List', path: '/employee/list/user' },
  { label: 'Add Employee', path: '/employee/create' },
  { label: 'Employee Stats', path: '/employee/stats' },
];

const Sidebar = () => {
  const location = useLocation();
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">PayFlow</div>
      <nav>
        <ul>
          {navItems.map(item => (
            <li key={item.path} className={location.pathname === item.path ? 'active' : ''}>
              <Link to={item.path}>{item.label}</Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar; 