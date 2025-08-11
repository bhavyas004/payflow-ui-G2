import React from 'react';
import '../styles/App.css';

const Topbar = ({ title, user, onLogout, sidebarRef }) => {
  const handleMenuToggle = () => {
    if (sidebarRef && sidebarRef.current) {
      sidebarRef.current.toggleSidebar();
    }
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        {/* Hamburger Menu Button for Mobile */}
        <button 
          className="hamburger-menu-btn"
          onClick={handleMenuToggle}
          aria-label="Toggle navigation menu"
        >
          ☰
        </button>
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
          <button className="btn btn-ghost btn-sm" onClick={onLogout}>
            🚪 Logout
          </button>
        )}
      </div>
    </header>
  );
};

export default Topbar; 