/**
 * Centralized Authentication Utilities
 * Handles JWT parsing, role extraction, and permission checks
 */

// JWT parser function - centralized implementation
export function parseJwt(token) {
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
    console.error('Error parsing JWT token:', e);
    return {};
  }
}

// Extract user role from token
export function getUserRole(token) {
  const payload = parseJwt(token);
  return (payload.role || 'EMPLOYEE').toUpperCase();
}

// Extract user info from token
export function getUserInfo(token) {
  const payload = parseJwt(token);
  return {
    id: payload.employeeId || payload.userId || null,
    username: payload.sub || payload.username || 'User',
    name: payload.fullName || payload.username || 'User',
    role: getUserRole(token),
    email: payload.email || '',
    status: payload.status || 'ACTIVE'
  };
}

// Check if user has specific permission
export function hasPermission(token, permission) {
  const role = getUserRole(token);
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}

// Check if user has any of the specified roles
export function hasAnyRole(token, roles) {
  const userRole = getUserRole(token);
  return roles.map(r => r.toUpperCase()).includes(userRole);
}

// Role-based permissions configuration
export const ROLE_PERMISSIONS = {
  ADMIN: [
    'VIEW_ALL_EMPLOYEES',
    'CREATE_EMPLOYEES',
    'UPDATE_EMPLOYEES',
    'DELETE_EMPLOYEES',
    'VIEW_ALL_PAYSLIPS',
    'GENERATE_PAYSLIPS',
    'MANAGE_CTC',
    'CREATE_USERS',
    'MANAGE_SYSTEM',
    // 'VIEW_ANALYTICS',
    // 'APPROVE_LEAVES',
    'MANAGE_DEPARTMENTS'
  ],
  HR: [
    'VIEW_ALL_EMPLOYEES',
    'CREATE_EMPLOYEES',
    'UPDATE_EMPLOYEES',
    'VIEW_ALL_PAYSLIPS',
    'GENERATE_PAYSLIPS',
    'MANAGE_CTC',
    // 'VIEW_ANALYTICS',
    // 'APPROVE_LEAVES',
    'MANAGE_ONBOARDING'
  ],
  MANAGER: [
    'VIEW_TEAM_EMPLOYEES',
    'CREATE_EMPLOYEES',
    'UPDATE_TEAM_EMPLOYEES',
    'VIEW_TEAM_PAYSLIPS',
    'APPROVE_TEAM_LEAVES',
    'MANAGE_TEAM_ONBOARDING'
  ],
  EMPLOYEE: [
    'VIEW_OWN_PROFILE',
    'UPDATE_OWN_PROFILE',
    'VIEW_OWN_PAYSLIPS',
    'APPLY_LEAVE',
    'VIEW_OWN_LEAVES'
  ]
};

// Navigation configurations for each role
export const NAVIGATION_CONFIGS = {
  ADMIN: [
    { label: 'Dashboard', path: '/payflow-ai/dashboard', icon: '🏠', active: 'dashboard' },
    { label: 'Users', path: '/payflow-ai/users', icon: '👥', active: 'users' },
    { label: 'Employees', path: '/payflow-ai/employees', icon: '👨‍💼', active: 'employees' },
    { label: 'Payroll', path: '/payflow-ai/payroll', icon: '💰', active: 'payroll' },
    // { label: 'Leave Management', path: '/payflow-ai/leaves', icon: '📅', active: 'leaves' },
    // { label: 'Analytics', path: '/payflow-ai/analytics', icon: '📊', active: 'analytics' }
  ],
  HR: [
    { label: 'Dashboard', path: '/payflow-ai/dashboard', icon: '🏠', active: 'dashboard' },
    { label: 'Employees', path: '/payflow-ai/employees', icon: '👥', active: 'employees' },
    // { label: 'Onboarding', path: '/payflow-ai/onboarding', icon: '📝', active: 'onboarding' },
    { label: 'Payroll', path: '/payflow-ai/payroll', icon: '💰', active: 'payroll' },
    // { label: 'CTC Management', path: '/payflow-ai/ctc', icon: '📊', active: 'ctc' },
    // { label: 'Payslips', path: '/payflow-ai/payslips', icon: '📄', active: 'payslips' },
    // { label: 'Leave Requests', path: '/payflow-ai/leaves', icon: '📅', active: 'leaves' }
  ],
  MANAGER: [
    { label: 'Dashboard', path: '/payflow-ai/dashboard', icon: '🏠', active: 'dashboard' },
    { label: 'My Team', path: '/payflow-ai/employees', icon: '👥', active: 'employees' },
    // { label: 'Onboarding', path: '/payflow-ai/onboarding', icon: '📝', active: 'onboarding' },
    { label: 'Leave Requests', path: '/payflow-ai/leaves', icon: '📅', active: 'leaves' }
  ],
  EMPLOYEE: [
    { label: 'Dashboard', path: '/payflow-ai/dashboard', icon: '🏠', active: 'dashboard' },
    { label: 'My Payroll', path: '/payflow-ai/payroll', icon: '💰', active: 'payroll' },
    { label: 'My Leave Requests', path: '/payflow-ai/leaves', icon: '📋', active: 'leaves' },
    // { label: 'Apply Leave', path: '/payflow-ai/leave-request', icon: '📝', active: 'leave-request' }
  ]
};

// Get token from session storage
export function getAuthToken() {
  return sessionStorage.getItem('jwtToken');
}

// Check if token is expired
export function isTokenExpired(token) {
  if (!token) return true;
  
  try {
    const payload = parseJwt(token);
    const currentTime = Date.now() / 1000;
    return payload.exp < currentTime;
  } catch (e) {
    return true;
  }
}

// Check if user is authenticated
export function isAuthenticated() {
  const token = getAuthToken();
  return token && !isTokenExpired(token);
}

// Get appropriate dashboard path based on role
export function getDashboardPath(role) {
  switch (role?.toUpperCase()) {
    case 'ADMIN':
      return '/payflow-ai/dashboard';
    case 'HR':
      return '/payflow-ai/dashboard';
    case 'MANAGER':
      return '/payflow-ai/dashboard';
    case 'EMPLOYEE':
      return '/payflow-ai/dashboard';
    default:
      return '/';
  }
}

// Logout utility
export function logout() {
  sessionStorage.removeItem('jwtToken');
  window.location.href = '/';
}
