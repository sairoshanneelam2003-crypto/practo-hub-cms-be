/**
 * User Service
 * 
 * Handles user management logic
 */

import prisma from "../prisma/client.js";
import { UserRole, UserStatus } from "../generated/prisma/index.js";
import { hashPassword } from "./auth.service.js";

/**
 * Create a new user
 */
export async function createUserService(
  firstName: string,
  lastName: string,
  email: string,
  password: string,
  role: UserRole,
  specialty?: string,
  city?: string
) {
  const hashedPassword = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role,
      status: UserStatus.ACTIVE,
      specialty,
      city
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      status: true,
      specialty: true,
      city: true,
      createdAt: true
    }
  });

  return user;
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string) {
  return prisma.user.findUnique({
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
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      status: true,
      specialty: true,
      city: true
    }
  });
}

/**
 * Update user
 */
export async function updateUser(
  userId: string,
  data: {
    firstName?: string;
    lastName?: string;
    specialty?: string;
    city?: string;
  }
) {
  return prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      status: true,
      specialty: true,
      city: true
    }
  });
}

/**
 * Update user role
 */
export async function updateUserRole(userId: string, role: UserRole) {
  return prisma.user.update({
    where: { id: userId },
    data: { role },
    select: {
      id: true,
      email: true,
      role: true
    }
  });
}

/**
 * Update user status
 */
export async function updateUserStatus(userId: string, status: UserStatus) {
  return prisma.user.update({
    where: { id: userId },
    data: { status },
    select: {
      id: true,
      email: true,
      status: true
    }
  });
}

/**
 * Get all users
 */
export async function getAllUsers(
  filters: { role?: UserRole; status?: UserStatus } = {},
  page = 1,
  limit = 20
) {
  const skip = (page - 1) * limit;

  const where: any = {};
  if (filters.role) where.role = filters.role;
  if (filters.status) where.status = filters.status;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
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
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    }),
    prisma.user.count({ where })
  ]);

  return {
    users,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  };
}

/**
 * Get doctors (for topic assignment)
 */
export async function getDoctors() {
  return prisma.user.findMany({
    where: {
      role: UserRole.DOCTOR_CREATOR,
      status: UserStatus.ACTIVE
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      specialty: true,
      city: true
    },
    orderBy: { firstName: 'asc' }
  });
}
