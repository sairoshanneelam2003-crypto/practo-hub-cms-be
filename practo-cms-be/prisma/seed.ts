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

const seedUsers: SeedUser[] = [
  // Super Admin
  {
    email: "admin@practo.com",
    firstName: "Super",
    lastName: "Admin",
    role: UserRole.SUPER_ADMIN
  },
  // Medical Reviewer
  {
    email: "medical.reviewer@practo.com",
    firstName: "Medical",
    lastName: "Reviewer",
    role: UserRole.MEDICAL_REVIEWER
  },
  // Brand Reviewer
  {
    email: "brand.reviewer@practo.com",
    firstName: "Brand",
    lastName: "Reviewer",
    role: UserRole.BRAND_REVIEWER
  },
  // Doctor Creator
  {
    email: "doctor@practo.com",
    firstName: "Dr. Ramesh",
    lastName: "Kumar",
    role: UserRole.DOCTOR_CREATOR,
    specialty: "Cardiology",
    city: "Mumbai"
  },
  // Another Doctor
  {
    email: "doctor2@practo.com",
    firstName: "Dr. Priya",
    lastName: "Sharma",
    role: UserRole.DOCTOR_CREATOR,
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
  // Viewer
  {
    email: "viewer@practo.com",
    firstName: "Content",
    lastName: "Viewer",
    role: UserRole.VIEWER
  }
];

async function main() {
  console.log("🌱 Starting database seed...\n");

  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  for (const userData of seedUsers) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
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
