/**
 * Auth Service
 * 
 * Handles authentication logic
 */

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../prisma/client.js";
import { UserRole } from "../generated/prisma/index.js";

const JWT_SECRET = process.env.JWT_SECRET || "secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
}

/**
 * Validate user credentials
 */
export async function validateUser(email: string, password: string) {
  const user = await prisma.user.findUnique({ 
    where: { email },
    select: {
      id: true,
      email: true,
      password: true,
      firstName: true,
      lastName: true,
      role: true,
      status: true,
      specialty: true,
      city: true
    }
  });
  
  if (!user || user.status !== "ACTIVE") {
    return null;
  }
  
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return null;
  }
  
  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() }
  });
  
  // Return user without password
  const { password: _p, ...safeUser } = user;
  return safeUser;
}

/**
 * Generate JWT token
 */
export function generateToken(payload: JWTPayload, expiresIn = JWT_EXPIRES_IN): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn } as any);
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
}

/**
 * Hash password
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * Compare password
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
