import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { NAVIGATION_CONFIGS } from '../utils/authUtils';
import '../../styles/App.css';

/**
 * Unified Role-Based Sidebar Component
 * Renders navigation based on user role and permissions
 */
function RoleBasedSidebar({ active, className = '' }) {
  const { role, logout, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Get navigation items for current user role
  const getNavigationItems = () => {
    return NAVIGATION_CONFIGS[role] || [];
  };

  // Handle logout
  const handleLogout = () => {
    logout();
  };

  // Handle navigation
  const handleNavigation = (path) => {
    navigate(path);
  };

  // Check if current path is active
  const isActive = (itemActive, path) => {
    if (active === itemActive) return true;
    return location.pathname === path;
  };

  const navigationItems = getNavigationItems();

  if (!role || navigationItems.length === 0) {
    return null;
  }

  return (
    <aside className={`sidebar ${className}`}>
      <div className="sidebar-logo">
        <span>PayFlow AI</span>
        <small>{role}</small>
      </div>
      
      <nav>
        <ul>
          {navigationItems.map((item) => (
            <li 
              key={item.path} 
              className={isActive(item.active, item.path) ? 'active' : ''}
            >
              <a 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  handleNavigation(item.path);
                }}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </a>
            </li>
          ))}
          
          {/* User Info Section */}
          <li className="user-info">
            <div className="user-details">
              <span className="user-name">{user?.name || 'User'}</span>
              <span className="user-role">{role}</span>
            </div>
          </li>
          
          {/* Logout Button */}
          <li>
            <button className="btn btn-ghost btn-sm w-full logout-btn" onClick={handleLogout}>
              <span className="nav-icon">🚪</span>
              <span className="nav-label">Logout</span>
            </button>
          </li>
        </ul>
      </nav>
    </aside>
  );
}

export default RoleBasedSidebar;
