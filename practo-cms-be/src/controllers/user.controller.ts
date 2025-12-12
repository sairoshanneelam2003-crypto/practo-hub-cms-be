/**
 * User Controller
 * 
 * Handles user management HTTP requests
 */

import type { Response } from "express";
import type { AuthRequest } from "../middlewares/auth.middleware.js";
import * as userService from "../services/user.service.js";
import { UserRole, UserStatus } from "../generated/prisma/index.js";
import prisma from "../prisma/client.js";

/**
 * Create a new user
 * POST /api/users
 */
export async function createUserController(req: AuthRequest, res: Response) {
  try {
    const { firstName, lastName, email, password, role, specialty, city } = req.body;

    if (!firstName || !lastName || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "firstName, lastName, email, password, and role are required"
      });
    }

    // Validate role
    if (!Object.values(UserRole).includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role. Must be one of: ${Object.values(UserRole).join(', ')}`
      });
    }

    const user = await userService.createUserService(
      firstName, 
      lastName, 
      email, 
      password, 
      role as UserRole, 
      specialty, 
      city
    );

    return res.status(201).json({ 
      success: true, 
      message: "User created successfully", 
      user 
    });
  } catch (err: any) {
    console.error('Create user error:', err);
    if (err.code === 'P2002') {
      return res.status(400).json({ 
        success: false, 
        message: "Email already exists" 
      });
    }
    return res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
}

/**
 * Get all users
 * GET /api/users
 */
export async function getAllUsersController(req: AuthRequest, res: Response) {
  try {
    const { role, status, page = '1', limit = '20' } = req.query;

    const filters: any = {};
    if (role) filters.role = role as UserRole;
    if (status) filters.status = status as UserStatus;

    const result = await userService.getAllUsers(
      filters,
      parseInt(page as string),
      parseInt(limit as string)
    );

    return res.json({ 
      success: true, 
      ...result 
    });
  } catch (err: any) {
    console.error('Get users error:', err);
    return res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
}

/**
 * Get doctors list (for topic assignment)
 * GET /api/users/doctors
 */
export async function getDoctorsController(req: AuthRequest, res: Response) {
  try {
    const doctors = await userService.getDoctors();

    return res.json({ 
      success: true, 
      doctors 
    });
  } catch (err: any) {
    console.error('Get doctors error:', err);
    return res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
}

/**
 * Get current user
 * GET /api/users/me
 */
export async function getCurrentUserController(req: AuthRequest, res: Response) {
  try {
    const user = await userService.getUserById(req.user!.userId);

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    return res.json({ 
      success: true, 
      user: {
        ...user,
        name: `${user.firstName} ${user.lastName}`
      }
    });
  } catch (err: any) {
    console.error('Get current user error:', err);
    return res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
}

/**
 * Get user by ID
 * GET /api/users/:id
 */
export async function getUserByIdController(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    
    const user = await userService.getUserById(id);

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    return res.json({ 
      success: true, 
      user 
    });
  } catch (err: any) {
    console.error('Get user error:', err);
    return res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
}

/**
 * Update user status
 * POST /api/users/update-status
 */
export async function updateUserStatusController(req: AuthRequest, res: Response) {
  try {
    const { userId, status } = req.body;

    if (!userId || !status) {
      return res.status(400).json({ 
        success: false, 
        message: "userId and status are required" 
      });
    }

    if (!Object.values(UserStatus).includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: `Invalid status. Must be one of: ${Object.values(UserStatus).join(', ')}` 
      });
    }

    const user = await userService.updateUserStatus(userId, status as UserStatus);

    return res.json({ 
      success: true, 
      message: "User status updated",
      user
    });
  } catch (err: any) {
    console.error('Update status error:', err);
    return res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
}

/**
 * Toggle user status (active/inactive)
 * POST /api/users/toggle-status
 */
export async function toggleUserStatusController(req: AuthRequest, res: Response) {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: "userId is required" 
      });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    const newStatus = user.status === UserStatus.ACTIVE 
      ? UserStatus.INACTIVE 
      : UserStatus.ACTIVE;

    const updated = await userService.updateUserStatus(userId, newStatus);

    return res.json({ 
      success: true, 
      message: "User status toggled",
      user: updated
    });
  } catch (err: any) {
    console.error('Toggle status error:', err);
    return res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
}

/**
 * Update user role
 * POST /api/users/update-role
 */
export async function updateUserRoleController(req: AuthRequest, res: Response) {
  try {
    const { userId, role } = req.body;

    if (!userId || !role) {
      return res.status(400).json({ 
        success: false, 
        message: "userId and role are required" 
      });
    }

    if (!Object.values(UserRole).includes(role)) {
      return res.status(400).json({ 
        success: false, 
        message: `Invalid role. Must be one of: ${Object.values(UserRole).join(', ')}` 
      });
    }

    const user = await userService.updateUserRole(userId, role as UserRole);

    return res.json({ 
      success: true, 
      message: "User role updated",
      user
    });
  } catch (err: any) {
    console.error('Update role error:', err);
    return res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
}

/**
 * Force workflow move (Super Admin only)
 * POST /api/users/force-move-workflow
 */
export async function forceWorkflowController(req: AuthRequest, res: Response) {
  try {
    const { contentId, contentType, targetStage } = req.body;

    if (!contentId || !contentType || !targetStage) {
      return res.status(400).json({ 
        success: false, 
        message: "contentId, contentType, and targetStage are required" 
      });
    }

    // Log the override action for audit
    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'FORCE_MOVE_WORKFLOW',
        entityType: contentType.toUpperCase(),
        entityId: contentId,
        newValue: { targetStage }
      }
    });

    // Update the content status
    if (contentType === 'script') {
      await prisma.script.update({
        where: { id: contentId },
        data: { status: targetStage }
      });
    } else if (contentType === 'video') {
      await prisma.video.update({
        where: { id: contentId },
        data: { status: targetStage }
      });
    }

    return res.json({ 
      success: true, 
      message: `${contentType} workflow force moved to ${targetStage}`,
      action: "force_move_workflow",
      performedBy: req.user!.userId
    });
  } catch (err: any) {
    console.error('Force workflow error:', err);
    return res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
}

/**
 * Unlock content (Super Admin only)
 * POST /api/users/unlock-content
 */
export async function unlockContentController(req: AuthRequest, res: Response) {
  try {
    const { contentId, contentType } = req.body;

    if (!contentId || !contentType) {
      return res.status(400).json({ 
        success: false, 
        message: "contentId and contentType are required" 
      });
    }

    // Log the override action
    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'EMERGENCY_UNLOCK',
        entityType: contentType.toUpperCase(),
        entityId: contentId
      }
    });

    // Unlock the content
    if (contentType === 'script') {
      await prisma.script.update({
        where: { id: contentId },
        data: { 
          status: 'DOCTOR_REVIEW',
          lockedById: null,
          lockedAt: null
        }
      });
    } else if (contentType === 'video') {
      await prisma.video.update({
        where: { id: contentId },
        data: { 
          status: 'DOCTOR_REVIEW',
          lockedById: null,
          lockedAt: null
        }
      });
    }

    return res.json({ 
      success: true, 
      message: `${contentType} unlocked successfully`,
      action: "unlock_content",
      performedBy: req.user!.userId
    });
  } catch (err: any) {
    console.error('Unlock content error:', err);
    return res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
}
