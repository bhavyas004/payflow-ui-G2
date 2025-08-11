/**
 * Unified Components Index
 * Central export point for all unified components and utilities
 */

// Shared utilities
export { 
  parseJwt, 
  getUserRole, 
  getUserInfo, 
  hasPermission, 
  hasAnyRole,
  ROLE_PERMISSIONS,
  NAVIGATION_CONFIGS,
  getAuthToken,
  isTokenExpired,
  isAuthenticated,
  getDashboardPath,
  logout
} from './shared/utils/authUtils';

// Shared hooks
export { 
  useAuth, 
  useRoleBasedComponent, 
  useAuthenticatedAPI 
} from './shared/hooks/useAuth';

// Shared components
export { default as Layout } from './shared/components/Layout';
export { default as RoleBasedSidebar } from './shared/components/RoleBasedSidebar';
export { default as UnifiedTopbar } from './shared/components/UnifiedTopbar';
export { 
  default as PermissionWrapper,
  withPermissions,
  usePermissionCheck
} from './shared/components/PermissionWrapper';

// Unified pages
export { default as UnifiedDashboard } from './unified/pages/UnifiedDashboard';
export { default as UnifiedPayrollManagement } from './unified/pages/UnifiedPayrollManagement';
export { default as UnifiedEmployeeManagement } from './unified/pages/UnifiedEmployeeManagement';
export { default as UnifiedLeaveManagement } from './unified/pages/UnifiedLeaveManagement';

// Unified app router
export { default as UnifiedAppRouter } from './UnifiedAppRouter';
