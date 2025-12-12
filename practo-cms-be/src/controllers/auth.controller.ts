/**
 * Auth Controller
 * 
 * Handles authentication HTTP requests
 */

import type { Request, Response } from "express";
import { validateUser, generateToken, hashPassword } from "../services/auth.service.js";
import prisma from "../prisma/client.js";
import bcrypt from "bcrypt";
import { OAuth2Client } from "google-auth-library";
import { getUserPermissions } from "../config/permissions.js";
import { UserRole } from "../generated/prisma/index.js";
import type { AuthRequest } from "../middlewares/auth.middleware.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Login with email and password
 * POST /api/auth/login
 */
export async function loginController(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: "Email and password required" 
      });
    }

    const user = await validateUser(email, password);
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid credentials" 
      });
    }

    const token = generateToken({ 
      userId: user.id, 
      role: user.role, 
      email: user.email 
    });
    
    const permissions = getUserPermissions(user.role);
    
    return res.json({ 
      success: true, 
      token, 
      user: {
        id: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        specialty: user.specialty,
        city: user.city
      },
      permissions
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
}

/**
 * Google OAuth login
 * POST /api/auth/oauth/google
 */
export async function googleOAuthController(req: Request, res: Response) {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ 
        success: false, 
        message: "Token is required" 
      });
    }

    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    if (!googleClientId) {
      return res.status(500).json({ 
        success: false, 
        message: "Google OAuth not configured" 
      });
    }

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: googleClientId,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid token" 
      });
    }

    const { sub: googleId, email } = payload;

    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(403).json({ 
        success: false, 
        message: "User not found. Contact admin to create your account." 
      });
    }

    if (user.status !== "ACTIVE") {
      return res.status(403).json({ 
        success: false, 
        message: "Account is inactive" 
      });
    }

    // Link Google account if not already linked
    if (!user.googleId) {
      user = await prisma.user.update({
        where: { email },
        data: { googleId, lastLoginAt: new Date() },
      });
    } else {
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      });
    }

    const jwtToken = generateToken({ 
      userId: user.id, 
      role: user.role, 
      email: user.email 
    });
    
    const permissions = getUserPermissions(user.role);

    return res.json({
      success: true,
      token: jwtToken,
      user: {
        id: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        specialty: user.specialty,
        city: user.city
      },
      permissions
    });
  } catch (err: any) {
    console.error('Google OAuth error:', err);
    return res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
}

/**
 * Get current user profile
 * GET /api/auth/me
 */
export async function getMeController(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        status: true,
        specialty: true,
        city: true,
        createdAt: true,
        lastLoginAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    const permissions = getUserPermissions(user.role);

    return res.json({ 
      success: true, 
      user: {
        ...user,
        name: `${user.firstName} ${user.lastName}`
      },
      permissions
    });
  } catch (err: any) {
    console.error('Get me error:', err);
    return res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
}

/**
 * Change password
 * POST /api/auth/change-password
 */
export async function changePasswordController(req: AuthRequest, res: Response) {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user!.userId;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Old and new passwords are required",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 8 characters",
      });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ 
        success: false, 
        message: "Old password incorrect" 
      });
    }

    const hashedNewPass = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPass },
    });

    return res.json({ 
      success: true, 
      message: "Password updated successfully" 
    });
  } catch (err) {
    console.error('Change password error:', err);
    return res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
}

/**
 * Set password (for OAuth users)
 * POST /api/auth/set-password
 */
export async function setPasswordController(req: AuthRequest, res: Response) {
  try {
    const { newPassword } = req.body;
    const userId = req.user!.userId;

    if (!newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: "New password is required" 
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    const hashedPassword = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return res.json({ 
      success: true, 
      message: "Password set successfully" 
    });
  } catch (err) {
    console.error('Set password error:', err);
    return res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
}

/**
 * Refresh token
 * POST /api/auth/refresh
 */
export async function refreshTokenController(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        status: true
      }
    });

    if (!user || user.status !== "ACTIVE") {
      return res.status(401).json({ 
        success: false, 
        message: "User not found or inactive" 
      });
    }

    const token = generateToken({ 
      userId: user.id, 
      role: user.role, 
      email: user.email 
    });

    return res.json({ 
      success: true, 
      token 
    });
  } catch (err) {
    console.error('Refresh token error:', err);
    return res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
}
