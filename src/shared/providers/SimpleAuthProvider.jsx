import React, { createContext, useContext, useState, useEffect } from 'react';

// Simple Auth Context for backward compatibility
const SimpleAuthContext = createContext();

// JWT parser function
function parseJwt(token) {
  if (!token) return {};
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return {};
  }
}

export function SimpleAuthProvider({ children }) {
  const [authData, setAuthData] = useState({
    isLoggedIn: false,
    user: null,
    role: null,
    loading: true
  });

  useEffect(() => {
    // Check for existing session
    const token = sessionStorage.getItem('jwtToken');
    if (token) {
      try {
        const payload = parseJwt(token);
        setAuthData({
          isLoggedIn: true,
          user: {
            id: payload.userId || payload.sub,
            username: payload.sub || payload.username,
            email: payload.email,
            name: payload.sub || payload.username
          },
          role: payload.role || 'ADMIN',
          loading: false
        });
      } catch (error) {
        console.error('Error parsing JWT:', error);
        setAuthData({ isLoggedIn: false, user: null, role: null, loading: false });
      }
    } else {
      setAuthData({ isLoggedIn: false, user: null, role: null, loading: false });
    }
  }, []);

  const getToken = () => {
    return sessionStorage.getItem('jwtToken');
  };

  const checkRole = (requiredRoles) => {
    if (!authData.role) return false;
    if (Array.isArray(requiredRoles)) {
      return requiredRoles.includes(authData.role);
    }
    return authData.role === requiredRoles;
  };

  const checkPermission = (permission) => {
    // Simple permission check - Admin has all permissions
    return authData.role === 'ADMIN' || authData.role === 'HR';
  };

  const contextValue = {
    ...authData,
    getToken,
    checkRole,
    checkPermission
  };

  return (
    <SimpleAuthContext.Provider value={contextValue}>
      {children}
    </SimpleAuthContext.Provider>
  );
}

export function useSimpleAuth() {
  const context = useContext(SimpleAuthContext);
  if (!context) {
    throw new Error('useSimpleAuth must be used within a SimpleAuthProvider');
  }
  return context;
}
