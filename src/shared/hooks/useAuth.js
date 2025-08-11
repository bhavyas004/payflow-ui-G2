import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  parseJwt, 
  getUserRole, 
  getUserInfo, 
  hasPermission, 
  hasAnyRole,
  getAuthToken,
  isAuthenticated,
  isTokenExpired,
  logout as utilLogout,
  ROLE_PERMISSIONS
} from '../utils/authUtils';

/**
 * Custom hook for authentication and authorization
 * Provides centralized auth state management and role-based functionality
 */
export function useAuth() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  // Initialize auth state
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = useCallback(() => {
    try {
      const token = getAuthToken();
      
      if (!token || isTokenExpired(token)) {
        clearAuthState();
        return;
      }

      const userInfo = getUserInfo(token);
      const userRole = getUserRole(token);

      setUser(userInfo);
      setRole(userRole);
      setIsLoggedIn(true);
    } catch (error) {
      console.error('Error initializing auth:', error);
      clearAuthState();
    } finally {
      setLoading(false);
    }
  }, []);

  const clearAuthState = () => {
    setUser(null);
    setRole(null);
    setIsLoggedIn(false);
    setLoading(false);
  };

  // Check if user has specific permission
  const checkPermission = useCallback((permission) => {
    const token = getAuthToken();
    return hasPermission(token, permission);
  }, []);

  // Check if user has any of the specified roles
  const checkRole = useCallback((roles) => {
    const token = getAuthToken();
    return hasAnyRole(token, Array.isArray(roles) ? roles : [roles]);
  }, []);

  // Logout function
  const logout = useCallback(() => {
    utilLogout();
    clearAuthState();
    navigate('/');
  }, [navigate]);

  // Refresh auth state (useful after token updates)
  const refreshAuth = useCallback(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Check if authenticated
  const checkAuth = useCallback(() => {
    return isAuthenticated();
  }, []);

  // Get user permissions
  const getUserPermissions = useCallback(() => {
    return ROLE_PERMISSIONS[role] || [];
  }, [role]);

  return {
    // Auth state
    user,
    role,
    loading,
    isLoggedIn,
    
    // Auth checks
    checkPermission,
    checkRole,
    checkAuth,
    
    // Auth actions
    logout,
    refreshAuth,
    
    // Utility functions
    getUserPermissions,
    
    // Helper getters
    isAdmin: role === 'ADMIN',
    isHR: role === 'HR',
    isManager: role === 'MANAGER',
    isEmployee: role === 'EMPLOYEE',
    
    // Token utility
    getToken: getAuthToken
  };
}

/**
 * Hook for role-based component rendering
 */
export function useRoleBasedComponent() {
  const { role, checkPermission, checkRole } = useAuth();

  const renderForRoles = useCallback((allowedRoles, component, fallback = null) => {
    if (checkRole(allowedRoles)) {
      return component;
    }
    return fallback;
  }, [checkRole]);

  const renderForPermissions = useCallback((permissions, component, fallback = null) => {
    const hasRequiredPermission = Array.isArray(permissions) 
      ? permissions.some(permission => checkPermission(permission))
      : checkPermission(permissions);
    
    if (hasRequiredPermission) {
      return component;
    }
    return fallback;
  }, [checkPermission]);

  return {
    role,
    renderForRoles,
    renderForPermissions,
    checkPermission,
    checkRole
  };
}

/**
 * Hook for API calls with authentication
 */
export function useAuthenticatedAPI() {
  const { getToken, logout } = useAuth();

  const getAuthHeaders = useCallback(() => {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, [getToken]);

  const handleAPIError = useCallback((error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.warn('Authentication error, logging out');
      logout();
    }
    throw error;
  }, [logout]);

  return {
    getAuthHeaders,
    handleAPIError
  };
}
