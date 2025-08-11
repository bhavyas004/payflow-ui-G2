import React from 'react';
import { useRoleBasedComponent } from '../hooks/useAuth';

/**
 * Permission Wrapper Component
 * Conditionally renders content based on user roles and permissions
 */
function PermissionWrapper({ 
  children, 
  requiredRoles = null,
  requiredPermissions = null,
  fallback = null,
  requireAll = false 
}) {
  const { checkRole, checkPermission } = useRoleBasedComponent();

  // Check role-based access
  const hasRoleAccess = () => {
    if (!requiredRoles) return true;
    
    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    return checkRole(roles);
  };

  // Check permission-based access
  const hasPermissionAccess = () => {
    if (!requiredPermissions) return true;
    
    const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];
    
    if (requireAll) {
      // User must have ALL permissions
      return permissions.every(permission => checkPermission(permission));
    } else {
      // User must have ANY permission
      return permissions.some(permission => checkPermission(permission));
    }
  };

  // Determine if user has access
  const hasAccess = () => {
    const roleAccess = hasRoleAccess();
    const permissionAccess = hasPermissionAccess();
    
    // If both roles and permissions are specified, user must satisfy both
    if (requiredRoles && requiredPermissions) {
      return roleAccess && permissionAccess;
    }
    
    // If only roles specified
    if (requiredRoles && !requiredPermissions) {
      return roleAccess;
    }
    
    // If only permissions specified
    if (!requiredRoles && requiredPermissions) {
      return permissionAccess;
    }
    
    // If neither specified, grant access
    return true;
  };

  // Render content based on access
  if (hasAccess()) {
    return <>{children}</>;
  }

  // Return fallback or null if no access
  return fallback;
}

/**
 * Higher-order component for permission-based rendering
 */
export function withPermissions(Component, requiredRoles, requiredPermissions, fallbackComponent = null) {
  return function PermissionWrappedComponent(props) {
    return (
      <PermissionWrapper 
        requiredRoles={requiredRoles}
        requiredPermissions={requiredPermissions}
        fallback={fallbackComponent}
      >
        <Component {...props} />
      </PermissionWrapper>
    );
  };
}

/**
 * Hook for conditional rendering based on permissions
 */
export function usePermissionCheck() {
  const { checkRole, checkPermission } = useRoleBasedComponent();

  const canAccess = (roles = null, permissions = null, requireAll = false) => {
    let hasRoleAccess = true;
    let hasPermissionAccess = true;

    if (roles) {
      const roleList = Array.isArray(roles) ? roles : [roles];
      hasRoleAccess = checkRole(roleList);
    }

    if (permissions) {
      const permissionList = Array.isArray(permissions) ? permissions : [permissions];
      if (requireAll) {
        hasPermissionAccess = permissionList.every(permission => checkPermission(permission));
      } else {
        hasPermissionAccess = permissionList.some(permission => checkPermission(permission));
      }
    }

    return hasRoleAccess && hasPermissionAccess;
  };

  return { canAccess, checkRole, checkPermission };
}

export default PermissionWrapper;
