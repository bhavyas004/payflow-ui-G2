import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Topbar from '../components/Topbar';
import SummaryCard from '../components/SummaryCard';
import QuickActions from '../components/QuickActions';
import MiniCalendar from '../components/MiniCalendar';
import '../styles/App.css';

// Custom Sidebar for HR Dashboard
function HRSidebar({ active }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">PayFlow</div>
      <nav>
        <ul>
          <li className={active === 'dashboard' ? 'active' : ''}><a href="/hr-dashboard">🏠 Dashboard</a></li>
          <li className={active === 'employees' ? 'active' : ''}><a href="/hr-employees">👥 Employees</a></li>
          <li className={active === 'onboarding' ? 'active' : ''}><a href="/onboarding">📝 Onboarding</a></li>
        </ul>
      </nav>
    </aside>
  );
}


export default function HRDashboard() {
  const [user] = useState({ name: 'HR Name' });
  const navigate = useNavigate();
  const [summary, setSummary] = useState({
    totalEmployees: 0,
    newThisMonth: 0,
    pendingProfiles: 0,
  });
  const [events] = useState([
    { date: '2025-07-10', title: 'John D. Birthday' },
    { date: '2025-07-12', title: 'Probation Review: Jane S.' },
    { date: '2025-07-15', title: 'Onboarding: New Hires' },
  ]);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const token = localStorage.getItem('jwtToken');
        const res = await fetch('/payflowapi/employees/summary', {
          headers: {
            Authorization: token ? `Bearer ${token}` : ''
          }
        });
        if (res.ok) {
          const data = await res.json();
          setSummary({
            totalEmployees: data.totalEmployees || 0,
            newThisMonth: data.newThisMonth || 0,
            pendingProfiles: data.pendingProfiles || 0,
          });
        }
      } catch (err) {
        setSummary({ totalEmployees: 0, newThisMonth: 0, pendingProfiles: 0 });
      }
    };
    fetchSummary();
  }, []);

  return (
    <div className="dashboard-layout">
      <HRSidebar active="dashboard" />
      <div className="main-content">
        <Topbar
          title="HR Dashboard"
          user={user}
          onLogout={() => {
            localStorage.removeItem('jwtToken');
            navigate('/');
          }}
        />
        <div className="dashboard-home">
          {/* Summary Cards */}
          <div className="summary-cards-row">
            <SummaryCard title="Total Employees" value={summary.totalEmployees} actionable onClick={() => navigate('/hr-employees')} />
            <SummaryCard title="New This Month" value={summary.newThisMonth} actionable onClick={() => {}} />
            <SummaryCard title="Pending Profiles" value={summary.pendingProfiles} actionable onClick={() => {}} />
          </div>
          <div className="dashboard-widgets-row">
            <MiniCalendar events={events} />
            <QuickActions
              onAddEmployee={() => navigate('/onboarding')}
              onImportBulk={() => {}}
              onAddHRManager={() => {}}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
