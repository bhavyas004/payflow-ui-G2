import React from 'react';
import '../styles/App.css';

const Topbar = ({ title, user, onLogout }) => {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <span className="topbar-logo">PayFlow</span>
        <span className="topbar-title">{title}</span>
      </div>
      <div className="topbar-right">
        <span className="topbar-user">{user?.name || 'User'}</span>
        <span className="topbar-icon">🔔</span>
        <div className="topbar-profile">
          <span>Profile ⬇️</span>
        </div>
        {onLogout && (
          <button className="logout-btn topbar-logout-btn" onClick={onLogout}>🚪 Logout</button>
        )}
      </div>
    </header>
  );
};

export default Topbar; 