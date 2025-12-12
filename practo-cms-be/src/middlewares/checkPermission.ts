import type { Response, NextFunction } from 'express';
import type { AuthRequest } from './auth.middleware.js';
import { ROLE_PERMISSIONS, type Permission, getUserPermissions } from '../config/permissions.js';
import { UserRole } from '../generated/prisma/index.js';

/**
 * RBAC Middleware - Checks if user has required permission for API action
 * 
 * @param requiredPermission - The permission required to access the endpoint
 * @returns Express middleware function
 */
export function checkPermission(requiredPermission: Permission) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      // Ensure user is authenticated (should be set by auth middleware)
      if (!req.user || !req.user.role) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const userRole = req.user.role as UserRole;

      // Check if role exists in permissions config
      if (!ROLE_PERMISSIONS[userRole]) {
        return res.status(403).json({
          success: false,
          message: 'Invalid user role'
        });
      }

      // Check if user's role has the required permission
      const userPermissions = ROLE_PERMISSIONS[userRole];
      if (!userPermissions.includes(requiredPermission)) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Required permission: ${requiredPermission}`,
          userRole,
          userPermissions
        });
      }

      // Permission granted, proceed to next middleware/controller
      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Permission check failed'
      });
    }
  };
}

/**
 * Check multiple permissions (user must have at least one)
 */
export function checkAnyPermission(permissions: Permission[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user || !req.user.role) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const userRole = req.user.role as UserRole;
      const userPermissions = ROLE_PERMISSIONS[userRole] || [];

      const hasPermission = permissions.some(p => userPermissions.includes(p));
      
      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Required one of: ${permissions.join(', ')}`
        });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Permission check failed'
      });
    }
  };
}

/**
 * Check all permissions (user must have all)
 */
export function checkAllPermissions(permissions: Permission[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user || !req.user.role) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const userRole = req.user.role as UserRole;
      const userPermissions = ROLE_PERMISSIONS[userRole] || [];

      const hasAllPermissions = permissions.every(p => userPermissions.includes(p));
      
      if (!hasAllPermissions) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Required all: ${permissions.join(', ')}`
        });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Permission check failed'
      });
    }
  };
}

// Re-export for convenience
export { getUserPermissions, type Permission };
