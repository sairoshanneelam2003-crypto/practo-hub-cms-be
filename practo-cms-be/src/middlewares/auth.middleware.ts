import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UserRole } from "../generated/prisma/index.js";

const JWT_SECRET = process.env.JWT_SECRET || "secret";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface AuthUser {
  userId: string;
  role: UserRole;
  email: string;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

// ============================================================================
// AUTHENTICATION MIDDLEWARE
// ============================================================================

/**
 * Verify JWT token and attach user info to request
 */
export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const auth = req.headers.authorization as string | undefined;
  
  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ 
      success: false, 
      message: "Authentication required",
      code: "NO_TOKEN"
    });
  }
  
  const token = auth.split(" ")[1];
  
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    
    req.user = { 
      userId: payload.userId, 
      role: payload.role as UserRole, 
      email: payload.email 
    };
    
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: "Token expired",
        code: "TOKEN_EXPIRED"
      });
    }
    
    return res.status(401).json({ 
      success: false, 
      message: "Invalid token",
      code: "INVALID_TOKEN"
    });
  }
}

// ============================================================================
// ROLE-BASED ACCESS CONTROL
// ============================================================================

/**
 * Middleware to check if user has one of the allowed roles
 */
export function allowRoles(roles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: "Not authenticated" 
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: "Insufficient permissions",
        required: roles,
        current: req.user.role
      });
    }
    
    next();
  };
}

/**
 * Middleware to check if user has a specific role
 */
export function requireRole(role: UserRole) {
  return allowRoles([role]);
}

/**
 * Middleware for Super Admin only routes
 */
export function superAdminOnly(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Not authenticated" });
  }
  
  if (req.user.role !== UserRole.SUPER_ADMIN) {
    return res.status(403).json({ 
      success: false, 
      message: "Super Admin access required" 
    });
  }
  
  next();
}
