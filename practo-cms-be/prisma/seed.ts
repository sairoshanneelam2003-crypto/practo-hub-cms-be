/**
 * Database Seed Script
 * 
 * Creates initial users for all roles
 */

import { PrismaClient, UserRole, UserStatus } from "../src/generated/prisma/index.js";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

const DEFAULT_PASSWORD = "Admin@123";

interface SeedUser {
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  specialty?: string;
  city?: string;
}

// Emails that should be updated on every seed run (useful for OAuth test accounts)
const FORCE_UPDATE_EMAILS = new Set<string>([
  "roshan.neelam@gamyam.co",
  "akshay.sharma@gamyam.co",
  "akash.kalakuntla@gamyam.co"
]);

const seedUsers: SeedUser[] = [
  // Super Admin
  {
    email: "admin@practo.com",
    firstName: "Super",
    lastName: "Admin",
    role: UserRole.SUPER_ADMIN
  },
  // OAuth test users (Super Admin)
  {
    email: "roshan.neelam@gamyam.co",
    firstName: "Roshan",
    lastName: "Neelam",
    role: UserRole.SUPER_ADMIN
  },
   {
    email: "akash.kalakuntla@gamyam.co",
    firstName: "Akash",
    lastName: "Kalakuntla",
    role: UserRole.SUPER_ADMIN
  },
  {
    email: "akshay.sharma@gamyam.co",
    firstName: "Akshay",
    lastName: "Sharma",
    role: UserRole.SUPER_ADMIN
  },
  // Medical Affairs
  {
    email: "medical.affairs@practo.com",
    firstName: "Medical",
    lastName: "Affairs",
    role: UserRole.MEDICAL_AFFAIRS
  },
  // Brand Reviewer
  {
    email: "brand.reviewer@practo.com",
    firstName: "Brand",
    lastName: "Reviewer",
    role: UserRole.BRAND_REVIEWER
  },
  // Doctor
  {
    email: "doctor@practo.com",
    firstName: "Dr. Ramesh",
    lastName: "Kumar",
    role: UserRole.DOCTOR,
    specialty: "Cardiology",
    city: "Mumbai"
  },
  // Another Doctor
  {
    email: "doctor2@practo.com",
    firstName: "Dr. Priya",
    lastName: "Sharma",
    role: UserRole.DOCTOR,
    specialty: "Endocrinology",
    city: "Delhi"
  },
  // Agency POC
  {
    email: "agency@practo.com",
    firstName: "Agency",
    lastName: "POC",
    role: UserRole.AGENCY_POC
  },
  // Content Approver
  {
    email: "approver@practo.com",
    firstName: "Content",
    lastName: "Approver",
    role: UserRole.CONTENT_APPROVER
  },
  // Publisher
  {
    email: "publisher@practo.com",
    firstName: "Video",
    lastName: "Publisher",
    role: UserRole.PUBLISHER
  },
];

async function main() {
  console.log("🌱 Starting database seed...\n");

  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  for (const userData of seedUsers) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: FORCE_UPDATE_EMAILS.has(userData.email)
        ? {
            role: userData.role,
            status: UserStatus.ACTIVE,
            firstName: userData.firstName,
            lastName: userData.lastName
          }
        : {},
      create: {
        ...userData,
        password: hashedPassword,
        status: UserStatus.ACTIVE
      }
    });

    console.log(`✅ ${userData.role}: ${userData.email}`);
  }

  console.log("\n" + "=".repeat(50));
  console.log("🎉 Seed completed successfully!");
  console.log("=".repeat(50));
  console.log("\n📋 Test Credentials:");
  console.log("-".repeat(50));
  
  for (const user of seedUsers) {
    console.log(`${user.role.padEnd(20)} | ${user.email}`);
  }
  
  console.log("-".repeat(50));
  console.log(`Password for all users: ${DEFAULT_PASSWORD}`);
  console.log("=".repeat(50));
}

main()
  .then(() => prisma.$disconnect())
  .catch((err) => {
    console.error("❌ Seed error:", err);
    prisma.$disconnect();
    process.exit(1);
  });
