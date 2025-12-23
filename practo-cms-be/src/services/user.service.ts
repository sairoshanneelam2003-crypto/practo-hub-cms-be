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
  filters: { 
    role?: UserRole; 
    status?: UserStatus; 
    search?: string;  // New: search parameter
  } = {},
  page = 1,
  limit = 20,
  sort = 'updatedAt',  // New: sort field
  order: 'ASC' | 'DESC' = 'DESC'  // New: sort order
) {
  const skip = (page - 1) * limit;

  const where: any = {};
  
  // Build AND conditions array to properly combine all filters
  const andConditions: any[] = [];
  
  // Role filter
  if (filters.role) {
    andConditions.push({ role: filters.role });
  }
  
  // Status filter
  if (filters.status) {
    andConditions.push({ status: filters.status });
  }
  
  // Search functionality - searches firstName, lastName, and email
  if (filters.search) {
    const searchTerm = filters.search.trim();
    andConditions.push({
      OR: [
        { firstName: { contains: searchTerm, mode: 'insensitive' } },
        { lastName: { contains: searchTerm, mode: 'insensitive' } },
        { email: { contains: searchTerm, mode: 'insensitive' } }
      ]
    });
  }
  
  // Apply AND conditions if any exist
  if (andConditions.length > 0) {
    where.AND = andConditions;
  }

  // Dynamic sorting - validate sort field
  const orderBy: any = {};
  const validSortFields = ['createdAt', 'updatedAt', 'firstName', 'lastName', 'email'];
  const sortField = validSortFields.includes(sort) ? sort : 'updatedAt';
  orderBy[sortField] = order.toLowerCase();

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
        updatedAt: true,  // Added for sorting
        lastLoginAt: true
      },
      orderBy,
      skip,
      take: limit
    }),
    prisma.user.count({ where })
  ]);

  return {
    users,
    total,
    page,
    size: limit,      // New: include size in response
    limit,            // Keep for backward compatibility
    totalPages: Math.ceil(total / limit)
  };
}

/**
 * Get doctors (for topic assignment)
 */
export async function getDoctors() {
  const where = {
    role: UserRole.DOCTOR,
    status: UserStatus.ACTIVE
  };

  const [doctors, count] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        specialty: true,
        city: true
      },
      orderBy: { firstName: 'asc' }
    }),
    prisma.user.count({ where })
  ]);

  return {
    doctors,
    count
  };
}
