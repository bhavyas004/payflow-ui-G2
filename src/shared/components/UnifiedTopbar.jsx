import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import '../../styles/App.css';

/**
 * Unified Topbar Component
 * Provides consistent header across all pages with role-based information
 */
function UnifiedTopbar({ title, subtitle, showClock = true, showProfile = true, className = '' }) {
  const { user, role, logout } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showDropdown, setShowDropdown] = useState(false);

  // Update clock every second
  useEffect(() => {
    if (showClock) {
      const timer = setInterval(() => {
        setCurrentTime(new Date());
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [showClock]);

  // Handle profile dropdown
  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.profile-dropdown-container')) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showDropdown]);

  // Format time for display
  const formatTime = (date) => {
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: true 
    });
  };

  // Format date for display
  const formatDate = (date) => {
    return date.toLocaleDateString([], {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Get role-specific greeting
  const getRoleGreeting = () => {
    const hour = currentTime.getHours();
    let timeGreeting = 'Good evening';
    if (hour < 12) timeGreeting = 'Good morning';
    else if (hour < 17) timeGreeting = 'Good afternoon';

    const roleTitle = {
      'ADMIN': 'Administrator',
      'HR': 'HR Manager',
      'MANAGER': 'Manager',
      'EMPLOYEE': 'Employee'
    }[role] || role;

    return `${timeGreeting}, ${roleTitle}`;
  };

  // Get role-specific avatar colors
  const getAvatarColors = () => {
    const roleColors = {
      'ADMIN': { bg: 'dc2626', color: 'fff' }, // Red for Admin
      'HR': { bg: '059669', color: 'fff' },     // Green for HR
      'MANAGER': { bg: 'ea580c', color: 'fff' }, // Orange for Manager
      'EMPLOYEE': { bg: '4f46e5', color: 'fff' } // Blue for Employee
    };
    
    return roleColors[role] || { bg: '6b7280', color: 'fff' }; // Default gray
  };

  return (
    <div className={`topbar payflow-topbar ${className}`}>
      {/* Left Section - Title and Subtitle */}
      <div className="topbar-left">
        {title && (
          <div className="topbar-title-section">
            <h1 className="topbar-title">{title}</h1>
            {subtitle && <p className="topbar-subtitle">{subtitle}</p>}
          </div>
        )}
      </div>

      {/* Center Section - Date and Time */}
      {showClock && (
        <div className="topbar-center">
          <div className="datetime-display">
            <div className="current-time">{formatTime(currentTime)}</div>
            <div className="current-date">{formatDate(currentTime)}</div>
          </div>
        </div>
      )}

      {/* Right Section - User Profile */}
      {showProfile && (
        <div className="topbar-right">
          <div className="user-greeting">
            <span className="greeting-text">{getRoleGreeting()}</span>
          </div>
          
          <div className="profile-dropdown-container">
            <div className="profile-info" onClick={toggleDropdown}>
              <div 
                className="profile-avatar" 
                style={{ '--avatar-border-color': `#${getAvatarColors().bg}` }}
              >
                <img 
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=${getAvatarColors().bg}&color=${getAvatarColors().color}&size=40`} 
                  alt="Profile" 
                />
              </div>
              <div className="profile-details">
                <span className="profile-name">{user?.name || 'User'}</span>
                <span className="profile-role">{role}</span>
              </div>
              <div className="dropdown-arrow">
                <span className={`arrow ${showDropdown ? 'open' : ''}`}>▼</span>
              </div>
            </div>

            {showDropdown && (
              <div className="profile-dropdown">
                <div className="dropdown-header">
                  <div className="user-info">
                    <strong>{user?.name || 'User'}</strong>
                    <small>{user?.email || ''}</small>
                    <div className="role-badge">{role}</div>
                  </div>
                </div>
                
                <div className="dropdown-divider"></div>
                
                <div className="dropdown-menu">
                  <button className="dropdown-item" onClick={() => setShowDropdown(false)}>
                    <span className="item-icon">👤</span>
                    <span>Profile Settings</span>
                  </button>
                  
                  <button className="dropdown-item" onClick={() => setShowDropdown(false)}>
                    <span className="item-icon">🔧</span>
                    <span>Preferences</span>
                  </button>
                  
                  <div className="dropdown-divider"></div>
                  
                  <button className="dropdown-item logout-item" onClick={logout}>
                    <span className="item-icon">🚪</span>
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default UnifiedTopbar;
