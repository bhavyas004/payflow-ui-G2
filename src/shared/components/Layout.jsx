import React from 'react';
import { useAuth } from '../hooks/useAuth';
import RoleBasedSidebar from './RoleBasedSidebar';
import UnifiedTopbar from './UnifiedTopbar';
import PermissionWrapper from './PermissionWrapper';
import '../../styles/App.css';

/**
 * Unified Layout Component
 * Provides consistent layout structure with role-based sidebar and topbar
 */
function Layout({ 
  children, 
  title, 
  subtitle,
  sidebarActive,
  showSidebar = true,
  showTopbar = true,
  className = '',
  requiredRoles = null,
  requiredPermissions = null
}) {
  const { loading, isLoggedIn } = useAuth();

  // Show loading state
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Show login required if not authenticated
  if (!isLoggedIn) {
    return (
      <div className="auth-required-container">
        <div className="auth-required-content">
          <h2>Authentication Required</h2>
          <p>Please log in to access this page.</p>
          <button 
            className="btn btn-primary"
            onClick={() => window.location.href = '/'}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Wrap with permission checking if required
  const content = (
    <div className={`dashboard-layout unified-layout ${className}`}>
      {showSidebar && (
        <RoleBasedSidebar active={sidebarActive} />
      )}
      
      <div className="main-content">
        {showTopbar && (
          <UnifiedTopbar 
            title={title} 
            subtitle={subtitle}
          />
        )}
        
        <div className="content-area">
          {children}
        </div>
      </div>
    </div>
  );

  // Apply permission wrapper if needed
  if (requiredRoles || requiredPermissions) {
    return (
      <PermissionWrapper 
        requiredRoles={requiredRoles}
        requiredPermissions={requiredPermissions}
        fallback={
          <div className="access-denied-container">
            <div className="access-denied-content">
              <h2>Access Denied</h2>
              <p>You don't have permission to access this page.</p>
              <button 
                className="btn btn-secondary"
                onClick={() => window.history.back()}
              >
                Go Back
              </button>
            </div>
          </div>
        }
      >
        {content}
      </PermissionWrapper>
    );
  }

  return content;
}

export default Layout;
